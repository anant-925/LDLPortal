// src/volunteer/UpdateTopicForm.js
import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';

const UpdateTopicForm = ({ userProfile, schedules, students }) => {
    const { db, showMessage } = useContext(FirebaseContext);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCamp, setSelectedCamp] = useState('Camp 1');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [loading, setLoading] = useState(false);

    const volunteerStudents = students.filter(s => s.volunteerId === userProfile?.uid);

    useEffect(() => {
        const dateObj = new Date(selectedDate);
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        const topicsForDay = schedules.filter(s => {
            const scheduleDate = new Date(s.date.seconds * 1000);
            return scheduleDate.getDate() === day &&
                   scheduleDate.getMonth() === month &&
                   scheduleDate.getFullYear() === year &&
                   s.camp === selectedCamp;
        }).flatMap(s => s.topics);

        setAvailableTopics([...new Set(topicsForDay)]); // Remove duplicates
    }, [selectedDate, selectedCamp, schedules]);

    const handleTopicChange = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!selectedStudentId || selectedTopics.length === 0) {
            showMessage('Please select a student and at least one topic.', 'error');
            setLoading(false);
            return;
        }

        try {
            const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
            const studentRef = doc(db, `artifacts/${appId}/users/${userProfile.uid}/studentsTaught`, selectedStudentId);
            const studentDoc = await getDoc(studentRef);

            if (studentDoc.exists()) {
                const currentTopics = studentDoc.data().topicsTaught || [];
                const updatedTopics = [...new Set([...currentTopics, ...selectedTopics])]; // Merge and deduplicate

                await updateDoc(studentRef, {
                    topicsTaught: updatedTopics
                });
                showMessage('Student topics updated successfully!', 'success');
                setSelectedTopics([]);
            } else {
                showMessage('Student not found.', 'error');
            }
        } catch (error) {
            console.error("Error updating topics:", error);
            showMessage('Failed to update topics. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg mx-auto">
            {loading && <LoadingSpinner />}
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Update Topics Taught</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="studentSelect" className="block text-gray-700 text-sm font-medium mb-2">Select Student</label>
                    <select
                        id="studentSelect"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    >
                        <option value="">-- Select a Student --</option>
                        {volunteerStudents.map(student => (
                            <option key={student.id} value={student.id}>{student.studentName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="dateSelect" className="block text-gray-700 text-sm font-medium mb-2">Select Date</label>
                    <input
                        type="date"
                        id="dateSelect"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <div>
                    <label htmlFor="campSelect" className="block text-gray-700 text-sm font-medium mb-2">Select Camp</label>
                    <select
                        id="campSelect"
                        value={selectedCamp}
                        onChange={(e) => setSelectedCamp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Available Topics for Selected Date/Camp:</label>
                    {availableTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {availableTopics.map(topic => (
                                <button
                                    key={topic}
                                    type="button"
                                    onClick={() => handleTopicChange(topic)}
                                    className={`px-4 py-2 rounded-full border transition-colors duration-200 ${selectedTopics.includes(topic) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-300'}`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No topics scheduled for this date and camp.</p>
                    )}
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 transform hover:scale-105"
                >
                    Update Topics
                </button>
            </form>
        </div>
    );
};

export default UpdateTopicForm;
