// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
);

export default LoadingSpinner;
