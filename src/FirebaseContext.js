// src/FirebaseContext.js
import React, { createContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc and doc

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create the context
export const FirebaseContext = createContext(null); // Default value is null initially

export const FirebaseProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // 'success' or 'error'

    // Function to display messages
    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('success'); // Reset to default
        }, 5000); // Message disappears after 5 seconds
    };

    const handleCloseMessage = () => {
        setMessage('');
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                // Fetch user profile from Firestore
                try {
                    const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
                    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/userProfile`, user.uid);
                    const docSnap = await getDoc(userProfileRef);
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        console.warn("No user profile found for UID:", user.uid);
                        setUserProfile(null);
                        // Optionally show an error or redirect if profile is missing
                        showMessage("User profile not found. Please contact support.", "error");
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUserProfile(null);
                    showMessage("Error loading user profile: " + error.message, "error");
                }
            } else {
                setUserId(null);
                setUserProfile(null);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, [showMessage]); // Depend on showMessage if it's stable or memoized, otherwise remove

    // The value provided to consumers of this context
    const contextValue = {
        auth,
        db,
        userId,
        userProfile,
        isAuthReady,
        message,
        messageType,
        showMessage,
        handleCloseMessage
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
};
