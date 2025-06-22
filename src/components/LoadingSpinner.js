// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-400 mb-4"></div>
            <p className="text-white text-xl font-semibold">Loading...</p>
        </div>
    </div>
);

export default LoadingSpinner;
