// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global CSS imports
import App from './App';
import { FirebaseProvider } from './FirebaseContext'; // Import the FirebaseProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FirebaseProvider> {/* Wrap your App with FirebaseProvider */}
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);
