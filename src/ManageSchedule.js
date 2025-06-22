// src/management/ManageSchedule.js
import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageSchedule = ({ userProfile }) => {
    const { db, showMessage } = useContext(FirebaseContext);
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleCamp, setScheduleCamp] = useState('Camp 1');
    const [topics, setTopics] = useState(''); // comma-separated string
    const [loading, setLoading] = useState(false);

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
            const topicsArray = topics.split(',').map(t => t.trim()).filter(t => t);
            if (topicsArray.length === 0) {
                showMessage('Please enter at least one topic.', 'error');
                setLoading(false);
                return;
            }

            // Check if a schedule for this date and camp already exists
            const q = query(collection(db, `artifacts/${appId}/public/data/schedules`),
                where('camp', '==', scheduleCamp)
            );
            const querySnapshot = await getDocs(q);
            const scheduleExists = querySnapshot.docs.some(doc => {
                const docDate = new Date(doc.data().date.seconds * 1000).toISOString().split('T')[0];
                return docDate === scheduleDate;
            });

            if (scheduleExists) {
                showMessage('Schedule for this date and camp already exists. Please update it instead.', 'error');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, `artifacts/${appId}/public/data/schedules`), {
                date: new Date(scheduleDate),
                camp: scheduleCamp,
                topics: topicsArray,
                managedBy: userProfile.uid,
                createdAt: new Date()
            });
            showMessage('Schedule created successfully!', 'success');
            setTopics('');
        } catch (error) {
            console.error("Error creating schedule:", error);
            showMessage('Failed to create schedule. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg mx-auto">
            {loading && <LoadingSpinner />}
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Manage Teaching Schedule</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-5">
                <div>
                    <label htmlFor="scheduleDate" className="block text-gray-700 text-sm font-medium mb-2">Date</label>
                    <input
                        type="date"
                        id="scheduleDate"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <div>
                    <label htmlFor="scheduleCamp" className="block text-gray-700 text-sm font-medium mb-2">Camp</label>
                    <select
                        id="scheduleCamp"
                        value={scheduleCamp}
                        onChange={(e) => setScheduleCamp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="scheduleTopics" className="block text-gray-700 text-sm font-medium mb-2">Topics (comma-separated)</label>
                    <input
                        type="text"
                        id="scheduleTopics"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="e.g., Algebra, Geometry, Reading"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 transform hover:scale-105"
                >
                    Create/Update Schedule
                </button>
            </form>
        </div>
    );
};

export default ManageSchedule;
