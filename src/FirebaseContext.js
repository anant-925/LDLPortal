// src/FirebaseContext.js
import React, { useState, useEffect, createContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, getDoc, getDocs } from 'firebase/firestore';

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // To track if auth state is determined
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
    };

    const handleCloseMessage = () => {
        setMessage('');
        setMessageType('');
    };

    useEffect(() => {
        try {
            // Use environment variables for Firebase config
            const firebaseConfig = {
                apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.REACT_APP_FIREBASE_APP_ID
            };

            if (!firebaseConfig.apiKey) {
                console.error("Firebase config is missing. Please set up .env.local file.");
                showMessage("Firebase setup incomplete. Check console.", "error");
                setIsAuthReady(true); // Still set ready to unblock UI
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            // Access __app_id from environment variable or set a default
            const appId = process.env.REACT_APP_APP_UNIQUE_ID || firebaseConfig.projectId || 'default-ldl-portal-app';

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    // Listener for userProfile
                    const userProfileRef = doc(firestoreDb, `artifacts/${appId}/users/${user.uid}/userProfile`, user.uid);
                    onSnapshot(userProfileRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setUserProfile({ id: docSnap.id, ...docSnap.data() });
                        } else {
                            // User authenticated but profile not created yet (e.g., new signup)
                            setUserProfile(null);
                        }
                        setIsAuthReady(true);
                    }, (error) => {
                        console.error("Error listening to user profile:", error);
                        showMessage("Failed to load user profile.", "error");
                        setIsAuthReady(true);
                    });
                } else {
                    setUserId(null);
                    setUserProfile(null);
                    setIsAuthReady(true);
                }
            });

            // Attempt to sign in anonymously if no initial auth token is provided
            // This is primarily for the Canvas environment and allows initial Firebase access
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                 signInWithCustomToken(firebaseAuth, __initial_auth_token).catch((error) => {
                    console.error("Error signing in with custom token:", error);
                    // If custom token fails, proceed to anonymous sign-in or handle login flow
                    signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign-in failed:", err));
                });
            } else {
                signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign-in failed:", err));
            }


            return () => unsubscribe(); // Clean up auth listener on unmount
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            showMessage("Failed to initialize Firebase. Check your configuration.", "error");
            setIsAuthReady(true);
        }
    }, []); // Empty dependency array means this runs once on component mount

    return (
        <FirebaseContext.Provider value={{ db, auth, userId, userProfile, isAuthReady, showMessage, message, messageType, handleCloseMessage }}>
            {children}
        </FirebaseContext.Provider>
    );
};
