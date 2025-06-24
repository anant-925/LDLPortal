/* global __app_id */ // Declare __app_id as a global variable for ESLint
import React, { useState, useContext } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, Lock, User, Share2 } from 'lucide-react';

// These paths assume Auth.js is directly in the src/ directory.
import { FirebaseContext } from './FirebaseContext';
import LoadingSpinner from './components/LoadingSpinner';

const Auth = ({ setCurrentPage }) => {
    const { auth, db, showMessage } = useContext(FirebaseContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                // Attempt to sign in
                await signInWithEmailAndPassword(auth, email, password);
                showMessage('Logged in successfully!', 'success');
            } else {
                // Attempt to sign up
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Using __app_id for consistency with Canvas environment, fallback to process.env
                const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');

                // Create a document for the user's UID in the top-level 'users' collection
                const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
                await setDoc(userDocRef, {
                    uid: user.uid,
                }, { merge: true });

                // Create the userProfile subcollection document
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
                    role: 'volunteer', // Default role for new sign-ups
                    topicsCanTeach: [],
                    totalAttendanceDays: 0,
                    referredBy: referrerUid,
                    referralCount: 0,
                    rewards: [],
                    createdAt: new Date(),
                    userId: user.uid
                });
                showMessage('Account created successfully! Please log in.', 'success');
                setIsLogin(true); // Switch to login form after successful signup
            }
        } catch (error) {
            console.error("Auth error caught:", error.code, error.message);
            let errorMessage = "An unexpected error occurred. Please try again.";

            if (isLogin) {
                // Firebase returns 'auth/invalid-credential' for both user-not-found and wrong-password
                // We will now treat 'auth/invalid-credential' as an indicator to suggest signup
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password. No account found, please sign up.';
                    setIsLogin(false); // Automatically switch to sign-up form for these errors
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                }
            } else { // Signup error handling
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email is already registered. Please log in instead.';
                    setIsLogin(true); // Switch to login form
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'The email address is not valid.';
                }
            }
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-6 font-inter">
            {loading && <LoadingSpinner />}
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:scale-[1.01] hover:shadow-3xl">
                <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-10 leading-tight">
                    {isLogin ? 'Welcome Back!' : 'Join the LDL Family!'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-7">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 text-lg"
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
                        />
                    </div>
                    {/* Conditional rendering based on isLogin state */}
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
                                />
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-70 text-xl"
                    >
                        {isLogin ? 'Login Securely' : 'Sign Up Now'}
                    </button>
                </form>
                <div className="text-center mt-8">
                    <p className="text-gray-600 text-lg">
                        {isLogin ? "Don't have an account yet?" : "Already part of the family?"}{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-700 font-semibold hover:underline hover:text-indigo-800 transition-colors duration-200"
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
