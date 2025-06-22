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
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg mx-auto text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center justify-center"><Share2 className="mr-3 text-blue-600" /> Referral Program</h3>
            <p className="text-gray-600 mb-4">
                Share your unique referral code with friends! You'll receive a reward once they accumulate 30 days of attendance.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 shadow-inner">
                <p className="text-lg font-medium text-gray-700 mb-2">Your Referral Code:</p>
                <div className="flex items-center justify-center bg-white border border-gray-300 rounded-md p-3">
                    <span className="font-mono text-xl text-blue-800 mr-3 break-all">{userProfile?.uid}</span>
                    <button
                        onClick={handleCopyClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md transform hover:scale-105"
                    >
                        Copy
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-green-50 p-4 rounded-lg shadow-inner">
                    <p className="text-lg font-bold text-green-600">{userProfile?.referralCount || 0}</p>
                    <p className="text-gray-600 mt-1">Successful Referrals</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg shadow-inner">
                    <p className="text-lg font-bold text-purple-600">{userProfile?.rewards?.length || 0}</p>
                    <p className="text-gray-600 mt-1">Earned Rewards</p>
                </div>
            </div>
        </div>
    );
};

export default ReferralSection;
