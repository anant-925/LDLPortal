// src/Auth.js
import React, { useState, useContext } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { FirebaseContext } from './FirebaseContext';
import LoadingSpinner from './components/LoadingSpinner';
import { Mail, Lock, User, Share2 } from 'lucide-react';

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
                await signInWithEmailAndPassword(auth, email, password);
                showMessage('Logged in successfully!', 'success');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Use process.env.REACT_APP_APP_UNIQUE_ID for appId (e.g., 'ldlportal')
                const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
                const userRef = doc(db, `artifacts/${appId}/users/${user.uid}/userProfile`, user.uid);

                // Check if referral code is valid
                let referrerUid = null;
                if (referralCode) {
                    const referrerQuery = query(collection(db, `artifacts/${appId}/users`), where('userId', '==', referralCode));
                    const referrerDocs = await getDocs(referrerQuery);
                    if (!referrerDocs.empty) {
                        referrerUid = referrerDocs.docs[0].id; // Get the actual UID
                    } else {
                        showMessage('Invalid referral code, but you can still sign up.', 'error');
                    }
                }

                await setDoc(userRef, {
                    uid: user.uid,
                    email: email,
                    name: name,
                    role: 'volunteer', // Default role for new signups
                    topicsCanTeach: [],
                    totalAttendanceDays: 0,
                    referredBy: referrerUid,
                    referralCount: 0,
                    rewards: [],
                    createdAt: new Date(),
                    userId: user.uid // Storing userId for easier lookup in referrals
                });
                showMessage('Account created successfully! Please log in.', 'success');
                setIsLogin(true); // Switch to login after signup
            }
        } catch (error) {
            console.error("Auth error:", error);
            showMessage(error.message, 'error');
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

