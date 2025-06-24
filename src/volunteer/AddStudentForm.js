/* global __app_id */
import React, { useState, useContext } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserPlus } from 'lucide-react'; // Added icon

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
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            const studentTopicsArray = topicsTaught.split(',').map(t => t.trim()).filter(t => t);

            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userProfile.uid}/studentsTaught`), {
                volunteerId: userProfile.uid,
                studentName: studentName,
                camp: camp,
                topicsTaught: studentTopicsArray,
                dateAdded: new Date()
            });
            console.log(`AddStudentForm: Successfully added student with ID: ${docRef.id}. Data:`, { studentName, camp, topicsTaught: studentTopicsArray });
            showMessage('Student added successfully!', 'success');
            setStudentName('');
            setTopicsTaught('');
        } catch (error) {
            console.error("AddStudentForm: Error adding student:", error);
            showMessage('Failed to add student. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg mx-auto border-t-4 border-blue-500">
            {loading && <LoadingSpinner />}
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center">
                <UserPlus className="mr-3 text-blue-600" size={28} /> Enroll New Student
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="studentName" className="block text-gray-700 text-lg font-medium mb-2">Student's Full Name</label>
                    <input
                        type="text"
                        id="studentName"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm"
                        placeholder="e.g., Ananya Sharma"
                    />
                </div>
                <div>
                    <label htmlFor="camp" className="block text-gray-700 text-lg font-medium mb-2">Select Camp</label>
                    <select
                        id="camp"
                        value={camp}
                        onChange={(e) => setCamp(e.target.value)}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm bg-white"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="topicsTaught" className="block text-gray-700 text-lg font-medium mb-2">Topics Taught (comma-separated)</label>
                    <input
                        type="text"
                        id="topicsTaught"
                        value={topicsTaught}
                        onChange={(e) => setTopicsTaught(e.target.value)}
                        placeholder="e.g., Algebra, Storytelling, English Grammar"
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center"
                >
                    Add Student Record
                </button>
            </form>
        </div>
    );
};

export default AddStudentForm;
