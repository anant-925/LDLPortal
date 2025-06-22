// src/components/MessageBox.js
import React from 'react';

const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const textColor = 'text-white';
    const borderColor = type === 'error' ? 'border-red-600' : 'border-green-600';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`relative ${bgColor} ${textColor} p-6 rounded-lg shadow-xl border-2 ${borderColor} max-w-sm w-full mx-auto animate-fade-in-down`}>
                <p className="text-lg font-semibold text-center mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-white text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition-colors duration-200 shadow-md transform hover:scale-105"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default MessageBox;

