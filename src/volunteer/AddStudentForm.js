// src/volunteer/AddStudentForm.js
import React, { useState, useContext } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AddStudentForm = ({ userProfile }) => {
    const { db, showMessage } = useContext(FirebaseContext);
    const [studentName, setStudentName] = useState('');
    const [camp, setCamp] = useState('Camp 1');
    const [topicsTaught, setTopicsTaught] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
            await addDoc(collection(db, `artifacts/${appId}/users/${userProfile.uid}/studentsTaught`), {
                volunteerId: userProfile.uid,
                studentName: studentName,
                camp: camp,
                topicsTaught: topicsTaught.split(',').map(t => t.trim()).filter(t => t),
                dateAdded: new Date()
            });
            showMessage('Student added successfully!', 'success');
            setStudentName('');
            setTopicsTaught('');
        } catch (error) {
            console.error("Error adding student:", error);
            showMessage('Failed to add student. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg mx-auto">
            {loading && <LoadingSpinner />}
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Add New Student</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="studentName" className="block text-gray-700 text-sm font-medium mb-2">Student Name</label>
                    <input
                        type="text"
                        id="studentName"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <div>
                    <label htmlFor="camp" className="block text-gray-700 text-sm font-medium mb-2">Camp</label>
                    <select
                        id="camp"
                        value={camp}
                        onChange={(e) => setCamp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="topicsTaught" className="block text-gray-700 text-sm font-medium mb-2">Topics Taught (comma-separated)</label>
                    <input
                        type="text"
                        id="topicsTaught"
                        value={topicsTaught}
                        onChange={(e) => setTopicsTaught(e.target.value)}
                        placeholder="e.g., Math, Science, English"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 transform hover:scale-105"
                >
                    Add Student
                </button>
            </form>
        </div>
    );
};

export default AddStudentForm;
