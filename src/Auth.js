/* global __app_id */
import React, { useState, useContext } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; // getAuth is not needed here
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'; // Import getDoc for checking user profile existence
import { Mail, Lock, User, Share2, Chrome } from 'lucide-react'; // Added Chrome icon for Google, if available

import { FirebaseContext } from './FirebaseContext';
import LoadingSpinner from './components/LoadingSpinner';

const Auth = ({ setCurrentPage }) => {
    // Destructure `loading` as `firebaseLoading` to avoid naming conflicts with local `setLoading`
    const { auth, db, showMessage, loading: firebaseLoading, signInWithGoogle } = useContext(FirebaseContext); // Get signInWithGoogle
    
    // Local loading state for form submission (separate from Firebase initialization)
    const [localLoading, setLocalLoading] = useState(false); 

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState(''); // Initialize with empty string

    const handleEmailAuth = async (e) => { // Renamed from handleAuth to be specific
        e.preventDefault();
        
        if (firebaseLoading || !auth || !db) {
            showMessage("Application is still initializing. Please wait a moment.", "info");
            return;
        }

        setLocalLoading(true);

        // --- reCAPTCHA Enterprise Widget Token Retrieval ---
        const recaptchaResponseElement = document.querySelector('[name="g-recaptcha-response"]');
        let recaptchaToken = recaptchaResponseElement ? recaptchaResponseElement.value : null;

        if (!recaptchaToken) {
            showMessage('reCAPTCHA verification failed. Please try again or refresh the page.', 'error');
            setLocalLoading(false);
            return;
        }
        console.log("reCAPTCHA Token obtained:", recaptchaToken);
        // --- End reCAPTCHA Enterprise Widget Token Retrieval ---

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                showMessage('Logged in successfully!', 'success');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');

                const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
                await setDoc(userDocRef, {
                    uid: user.uid,
                }, { merge: true });

                const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/userProfile`, user.uid);

                let referrerUid = null;
                if (referralCode) {
                    const referrerQuery = query(collection(db, `artifacts/${appId}/users`), where('userId', '==', referralCode));
                    const referrerDocs = await getDocs(referrerQuery);
                    if (!referrerDocs.empty) {
                        referrerUid = referrerDocs.docs[0].id;
                    } else {
                        showMessage('Invalid referral code, but you can still sign up.', 'error');
                    }
                }

                await setDoc(userProfileRef, {
                    uid: user.uid,
                    email: email,
                    name: name,
                    role: 'volunteer',
                    topicsCanTeach: [],
                    totalAttendanceDays: 0,
                    referredBy: referrerUid,
                    referralCount: 0,
                    rewards: [],
                    createdAt: new Date(),
                    userId: user.uid
                });
                showMessage('Account created successfully! Please log in.', 'success');
                setIsLogin(true);
            }

            // TODO: CRITICAL SECURITY STEP - Send `recaptchaToken` to your backend (e.g., Firebase Cloud Function)
            // for verification using your reCAPTCHA Secret Key. This is essential for robust bot protection.
            // If backend verification fails, abort the authentication process (e.g., by signing out the user).

        } catch (error) {
            console.error("Auth error caught:", error.code, error.message);
            let errorMessage = "An unexpected error occurred. Please try again.";

            if (isLogin) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password. No account found, please sign up.';
                    setIsLogin(false);
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                }
            } else {
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email is already registered. Please log in instead.';
                    setIsLogin(true);
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'The email address is not valid.';
                }
            }
            showMessage(errorMessage, 'error');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (firebaseLoading || !auth || !db) {
            showMessage("Application is still initializing. Please wait a moment.", "info");
            return;
        }
        setLocalLoading(true); // Indicate local loading for Google sign-in
        try {
            await signInWithGoogle(); // Call the function from FirebaseContext
        } finally {
            setLocalLoading(false);
        }
    };

    const isDisabled = firebaseLoading || localLoading;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-6 font-inter">
            {(firebaseLoading || localLoading) && <LoadingSpinner />} 
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:scale-[1.01] hover:shadow-3xl">
                <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-10 leading-tight">
                    {isLogin ? 'Welcome Back!' : 'Join the LDL Family!'}
                </h2>
                <form onSubmit={handleEmailAuth} className="space-y-7"> {/* Changed onSubmit to handleEmailAuth */}
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 text-lg"
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 text-lg"
                            disabled={isDisabled}
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                                <input
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 text-lg"
                                    disabled={isDisabled}
                                />
                            </div>
                            <div className="relative">
                                <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                                <input
                                    type="text"
                                    placeholder="Referral Code (Optional)"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 text-lg"
                                    disabled={isDisabled}
                                />
                            </div>
                        </>
                    )}
                    {/* ReCAPTCHA Enterprise Widget */}
                    <div className="g-recaptcha" data-sitekey="6LcD72srAAAAAKTdZ8ezLcScc3Bi7KCXDE3GAINm" data-action={isLogin ? "LOGIN" : "SIGNUP"}></div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-70 text-xl"
                        disabled={isDisabled} 
                    >
                        {isLogin ? 'Login Securely' : 'Sign Up Now'}
                    </button>
                </form>

                {/* Google Sign-In Button */}
                <div className="mt-6">
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-70 text-lg"
                        disabled={isDisabled}
                    >
                        <Chrome className="mr-3" size={20} /> {/* Using Chrome icon as a placeholder for Google */}
                        Sign In with Google
                    </button>
                </div>

                <div className="text-center mt-8">
                    <p className="text-gray-600 text-lg">
                        {isLogin ? "Don't have an account yet?" : "Already part of the family?"}{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-700 font-semibold hover:underline hover:text-indigo-800 transition-colors duration-200"
                            disabled={isDisabled} 
                        >
                            {isLogin ? 'Create Account' : 'Login Here'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
