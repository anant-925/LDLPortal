/* global __app_id, __firebase_config, __initial_auth_token */ // ALL global variables MUST be declared here for ESLint
import React, { useState, useEffect, createContext, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, collection, collectionGroup, getDocs } from 'firebase/firestore';

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        let appInstance;
        try {
            let firebaseConfig;
            let currentAppId = 'default-app-id-fallback';

            // Determine Firebase Config based on environment
            if (typeof __firebase_config !== 'undefined' && __firebase_config) {
                try {
                    firebaseConfig = JSON.parse(__firebase_config);
                    console.log("FirebaseContext: Using Canvas-provided __firebase_config.");
                    if (typeof __app_id !== 'undefined' && __app_id) {
                        currentAppId = __app_id;
                    }
                } catch (e) {
                    console.error("FirebaseContext: Error parsing __firebase_config, falling back to process.env.", e);
                    firebaseConfig = {
                        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                        appId: process.env.REACT_APP_FIREBASE_APP_ID
                    };
                    currentAppId = process.env.REACT_APP_APP_UNIQUE_ID || firebaseConfig.projectId || 'default-app-id';
                }
            } else {
                console.log("FirebaseContext: __firebase_config not found, using process.env for Firebase config.");
                firebaseConfig = {
                    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.REACT_APP_FIREBASE_APP_ID
                };
                currentAppId = process.env.REACT_APP_APP_UNIQUE_ID || firebaseConfig.projectId || 'default-app-id';
            }

            // Ensure projectId is present
            if (!firebaseConfig.projectId) {
                console.warn("FirebaseContext: 'projectId' is missing in firebaseConfig. Please ensure your Firebase credentials are correctly set. Data access might fail.");
                firebaseConfig.projectId = currentAppId;
            }

            // Initialize Firebase app if not already initialized
            if (!getApps().length) {
                appInstance = initializeApp(firebaseConfig);
            } else {
                appInstance = getApp();
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
                            showMessage("User profile not found. Please contact support.", "error");
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

            // Authentication logic: prioritize __initial_auth_token for Canvas
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
            console.error("Firebase initialization failed:", e);
            showMessage("Failed to initialize the application. Please try again later.", "error");
            setLoading(false);
        }
    }, [showMessage]);

    const [allUsers, setAllUsers] = useState([]);
    useEffect(() => {
        if (!db) return;

        const currentAppIdForFilter = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
        console.log("FirebaseContext [allUsers]: AppId being used for filtering collection group:", currentAppIdForFilter);

        const userProfilesCollectionGroupRef = collectionGroup(db, 'userProfile');
        
        const unsubscribeAllUsers = onSnapshot(userProfilesCollectionGroupRef, (snapshot) => {
            const allUsersData = [];
            console.log("FirebaseContext [allUsers]: Collection group snapshot received. Total docs in snapshot:", snapshot.docs.length);

            snapshot.forEach(docSnap => {
                const fullPath = docSnap.ref.path;
                const pathParts = fullPath.split('/');
                
                if (pathParts.length < 6 || pathParts[0] !== 'artifacts' || pathParts[2] !== 'users' || pathParts[4] !== 'userProfile') {
                    console.warn(`FirebaseContext [allUsers]: Unexpected document path format: ${fullPath}. Skipping.`);
                    return;
                }

                const docAppId = pathParts[1];
                const docUserId = pathParts[3];
                const docProfileId = docSnap.id;

                console.log(`  Doc Path: ${fullPath}`);
                console.log(`    Parsed: appId=${docAppId}, userId=${docUserId}, profileId=${docProfileId}`);
                console.log(`    Filtering with currentAppIdForFilter: ${currentAppIdForFilter}`);

                if (docAppId === currentAppIdForFilter && docUserId === docProfileId) {
                    allUsersData.push({ id: docSnap.id, ...docSnap.data() });
                    console.log("    => Doc INCLUDED for leaderboard. Data:", docSnap.data());
                } else {
                    console.log("    => Doc EXCLUDED (AppId or userId/profileId mismatch).");
                }
            });
            setAllUsers(allUsersData);
            console.log("FirebaseContext [allUsers]: Real-time update - All users fetched. Count after filtering:", allUsersData.length, "Data:", allUsersData);
        }, (error) => {
            console.error("FirebaseContext [allUsers]: Error listening to all user profiles (collection group):", error);
            showMessage("Failed to load all users list in real-time. Check console for details.", "error");
        });

        return () => unsubscribeAllUsers();
    }, [db, showMessage]);

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    useEffect(() => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
        const unsubscribe = onSnapshot(collection(db, `artifacts/${appId}/public/data/attendance`), (snapshot) => {
            const attendanceData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setAttendanceRecords(attendanceData);
            console.log("FirebaseContext: Public attendance records snapshot received. Count:", attendanceData.length);
        }, (error) => {
            console.error("FirebaseContext: Error listening to attendance records:", error);
        });
        return () => unsubscribe();
    }, [db]);

    const [schedules, setSchedules] = useState([]);
    useEffect(() => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
        const unsubscribe = onSnapshot(collection(db, `artifacts/${appId}/public/data/schedules`), (snapshot) => {
            const schedulesData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setSchedules(schedulesData);
            console.log("FirebaseContext: Public schedules snapshot received. Count:", schedulesData.length);
        }, (error) => {
            console.error("FirebaseContext: Error listening to schedules:", error);
        });
        return () => unsubscribe();
    }, [db]);

    const [students, setStudents] = useState([]);
    useEffect(() => {
        let unsubscribeStudents = () => {};
        if (db && userId && userProfile && userProfile.role === 'volunteer') {
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            unsubscribeStudents = onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/studentsTaught`), (snapshot) => {
                const studentsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                setStudents(studentsData);
                console.log("FirebaseContext: Student-specific studentsTaught snapshot received. Count:", studentsData.length);
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
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
};
