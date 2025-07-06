/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useState, useEffect, createContext, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, collectionGroup, setDoc, getDoc } from 'firebase/firestore'; // Removed query, where, getDocs

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true); // Overall Firebase initialization loading
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const showMessage = useCallback((msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    }, []);

    const handleCloseMessage = () => {
        setMessage('');
        setMessageType('');
    };

    // Function to sign in with Google
    const signInWithGoogle = useCallback(async () => {
        if (!auth || !db) {
            showMessage("Firebase services not initialized. Please wait.", "error");
            return;
        }
        setLoading(true); // Indicate global loading for Google sign-in process
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user profile already exists, if not, create it
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/userProfile`, user.uid);
            const userProfileSnap = await getDoc(userProfileRef); // Use getDoc here

            if (!userProfileSnap.exists()) {
                await setDoc(userProfileRef, {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || 'Google User',
                    role: 'volunteer', // Default role for new sign-ups
                    topicsCanTeach: [],
                    totalAttendanceDays: 0,
                    referredBy: null, // Google sign-in doesn't use referral codes directly
                    referralCount: 0,
                    rewards: [],
                    createdAt: new Date(),
                    userId: user.uid // Storing UID as userId for consistency
                });
                showMessage('Signed in with Google! Welcome!', 'success');
            } else {
                showMessage('Signed in with Google! Welcome back!', 'success');
            }
            return user; // Return the user object
        } catch (error) {
            console.error("FirebaseContext: Google Sign-In failed:", error);
            let errorMessage = "Google Sign-In failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Google Sign-In was cancelled.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = "Another popup was opened. Please try again.";
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "An account with this email already exists using a different sign-in method.";
            }
            showMessage(errorMessage, "error");
            return null; // Indicate failure
        } finally {
            setLoading(false); // End global loading
        }
    }, [auth, db, showMessage]);


    useEffect(() => {
        let appInstance;
        try {
            let firebaseConfig = {};
            let currentAppId = 'default-app-id-fallback';

            if (typeof __firebase_config !== 'undefined' && __firebase_config) {
                try {
                    const parsedConfig = JSON.parse(__firebase_config);
                    if (parsedConfig && parsedConfig.projectId && parsedConfig.apiKey) {
                        firebaseConfig = parsedConfig;
                        console.log("FirebaseContext: Attempting to use Canvas-provided __firebase_config.");
                    } else {
                        console.warn("FirebaseContext: Canvas-provided __firebase_config is incomplete or invalid. Falling back to process.env.");
                    }
                } catch (e) {
                    console.error("FirebaseContext: Error parsing __firebase_config. Falling back to process.env.", e);
                }
            }

            if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
                console.log("FirebaseContext: Retrieving Firebase config from process.env.");
                firebaseConfig = {
                    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.REACT_APP_FIREBASE_APP_ID
                };
                currentAppId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id-env-fallback';
            } else {
                 currentAppId = typeof __app_id !== 'undefined' && __app_id ? __app_id : firebaseConfig.projectId;
            }

            console.log("FirebaseContext: Final firebaseConfig being used:", firebaseConfig);
            console.log("FirebaseContext: Final currentAppId being used:", currentAppId);

            if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
                console.error("FirebaseContext: CRITICAL ERROR - Firebase configuration is incomplete. Missing projectId or apiKey.");
                showMessage("CRITICAL ERROR: Firebase config missing. Check Vercel Environment Variables and browser console.", "error");
                setLoading(false);
                return;
            }

            if (!getApps().length) {
                appInstance = initializeApp(firebaseConfig);
                console.log("FirebaseContext: Initialized new Firebase app:", firebaseConfig.projectId);
            } else {
                appInstance = getApp();
                console.log("FirebaseContext: Using existing Firebase app.");
            }

            const firestoreDb = getFirestore(appInstance);
            const firebaseAuth = getAuth(appInstance);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
                console.log("FirebaseContext: Auth state changed. User:", user ? user.uid : "null");
                if (user) {
                    setUserId(user.uid);
                    const userProfileRef = doc(firestoreDb, `artifacts/${currentAppId}/users/${user.uid}/userProfile`, user.uid);

                    const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const profileData = { id: docSnap.id, ...docSnap.data() };
                            setUserProfile(profileData);
                            console.log("FirebaseContext: User profile snapshot received for UID:", user.uid, "Data:", profileData);
                        } else {
                            setUserProfile(null);
                            console.warn("FirebaseContext: User profile not found in Firestore for UID:", user.uid);
                            if (user.isAnonymous === false) {
                                showMessage("User profile not found. Please contact support.", "error");
                            }
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("FirebaseContext: Error listening to user profile:", error);
                        showMessage("Failed to load user profile.", "error");
                        setLoading(false);
                    });
                    return () => unsubscribeProfile();
                } else {
                    setUserId(null);
                    setUserProfile(null);
                    setLoading(false);
                }
            });

            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                signInWithCustomToken(firebaseAuth, __initial_auth_token).catch((error) => {
                    console.error("FirebaseContext: Error signing in with custom token:", error);
                    signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign-in failed:", err));
                });
            } else {
                signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign-in failed:", err));
            }

            return () => unsubscribeAuth();
        } catch (e) {
            console.error("Firebase initialization failed in outer try-catch:", e);
            showMessage("Failed to initialize the application. Please try again later. (Check console)", "error");
            setLoading(false);
        }
    }, [showMessage]);


    const [allUsers, setAllUsers] = useState([]);
    useEffect(() => {
        if (!db) return;

        const currentAppIdForFilter = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id-filter-fallback');

        const userProfilesCollectionGroupRef = collectionGroup(db, 'userProfile');
        
        const unsubscribeAllUsers = onSnapshot(userProfilesCollectionGroupRef, (snapshot) => {
            const allUsersData = [];
            snapshot.forEach(docSnap => {
                const fullPath = docSnap.ref.path;
                const pathParts = fullPath.split('/');
                
                const docAppId = pathParts[1];
                const docUserId = pathParts[3];
                const docProfileId = docSnap.id;

                if (docAppId === currentAppIdForFilter && docUserId === docProfileId) {
                    allUsersData.push({ id: docSnap.id, ...docSnap.data() });
                }
            });
            setAllUsers(allUsersData);
        }, (error) => {
            console.error("FirebaseContext [allUsers]: Error listening to all user profiles (collection group):", error);
            showMessage("Failed to load all users list in real-time. Check console for details (likely missing index).", "error");
        });

        return () => unsubscribeAllUsers();
    }, [db, showMessage]);


    const [attendanceRecords, setAttendanceRecords] = useState([]);
    useEffect(() => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id-attendance-fallback');
        const unsubscribe = onSnapshot(collection(db, `artifacts/${appId}/public/data/attendance`), (snapshot) => {
            const attendanceData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setAttendanceRecords(attendanceData);
        }, (error) => {
            console.error("FirebaseContext: Error listening to attendance records:", error);
        });
        return () => unsubscribe();
    }, [db, userProfile]); // Added userProfile to dependency array


    const [schedules, setSchedules] = useState([]);
    useEffect(() => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id-schedules-fallback');
        const unsubscribe = onSnapshot(collection(db, `artifacts/${appId}/public/data/schedules`), (snapshot) => {
            const schedulesData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setSchedules(schedulesData);
        }, (error) => {
            console.error("FirebaseContext: Error listening to schedules:", error);
        });
        return () => unsubscribe();
    }, [db]);

    const [students, setStudents] = useState([]);
    useEffect(() => {
        let unsubscribeStudents = () => {};
        if (db && userId && userProfile && userProfile.role === 'volunteer') {
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id-students-fallback');
            unsubscribeStudents = onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/studentsTaught`), (snapshot) => {
                const studentsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                setStudents(studentsData);
            }, (error) => {
                console.error("FirebaseContext: Error listening to students taught:", error);
            });
        } else {
            setStudents([]);
        }
        return () => unsubscribeStudents();
    }, [db, userId, userProfile?.role]);

    const contextValue = {
        db,
        auth,
        userId,
        userProfile,
        loading,
        message,
        messageType,
        showMessage,
        handleCloseMessage,
        allUsers,
        attendanceRecords,
        schedules,
        students,
        signInWithGoogle // Expose the new Google Sign-In function
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {message && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-50 transition-all duration-300 ${messageType === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {message}
                    <button onClick={handleCloseMessage} className="ml-2 font-bold">X</button>
                </div>
            )}
            {children}
        </FirebaseContext.Provider>
    );
};
