// src/volunteer/ReferralSection.js
import React, { useContext } from 'react';
import { Share2 } from 'lucide-react';
import { FirebaseContext } from '../FirebaseContext';

const ReferralSection = ({ userProfile }) => {
    const { showMessage } = useContext(FirebaseContext);

    const handleCopyClick = () => {
        const referralLink = userProfile?.uid; // Use UID as referral code
        if (referralLink) {
            // Using execCommand for better iframe compatibility
            const el = document.createElement('textarea');
            el.value = referralLink;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showMessage('Referral code copied to clipboard!', 'success');
        } else {
            showMessage('Referral code not available.', 'error');
        }
    };

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg mx-auto text-center border-l-4 border-purple-500">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center"><Share2 className="mr-3 text-purple-600" size={28} /> Referral Program</h3>
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Empower our mission by referring new volunteers! Earn exciting rewards once your referred friends complete 30 days of active attendance.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8 shadow-inner">
                <p className="text-xl font-semibold text-gray-800 mb-3">Your Unique Referral Code:</p>
                <div className="flex items-center justify-center bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                    <span className="font-mono text-2xl text-purple-800 mr-4 break-all select-all">{userProfile?.uid}</span>
                    <button
                        onClick={handleCopyClick}
                        className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-md transform hover:scale-105 font-semibold text-lg"
                    >
                        Copy Code
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
                    <p className="text-4xl font-extrabold text-green-700">{userProfile?.referralCount || 0}</p>
                    <p className="text-lg text-gray-700 mt-2">Successful Referrals</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-xl shadow-md border border-amber-200">
                    <p className="text-4xl font-extrabold text-amber-700">{userProfile?.rewards?.length || 0}</p>
                    <p className="text-lg text-gray-700 mt-2">Earned Rewards</p>
                </div>
            </div>
        </div>
    );
};

export default ReferralSection;
