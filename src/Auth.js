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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            {loading && <LoadingSpinner />}
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    {isLogin ? 'Login to LDLPortal' : 'Sign Up for LDLPortal'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                                />
                            </div>
                            <div className="relative">
                                <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Referral Code (Optional)"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                                />
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 font-semibold hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
