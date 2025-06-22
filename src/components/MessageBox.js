// src/components/MessageBox.js
import React from 'react';

const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';
    const textColor = 'text-white';
    const borderColor = type === 'error' ? 'border-red-700' : 'border-green-700';

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-6">
            <div className={`relative ${bgColor} ${textColor} p-8 rounded-xl shadow-2xl border-4 ${borderColor} max-w-md w-full mx-auto transform transition-all duration-300 scale-100 animate-fade-in-down`}>
                <p className="text-xl font-bold text-center mb-6 leading-tight">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-white text-gray-800 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-70"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

export default MessageBox;
