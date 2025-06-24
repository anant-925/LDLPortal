/* global __app_id */
import React, { useState, useContext, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const ManageSchedule = ({ userProfile }) => {
    const { db, showMessage, schedules } = useContext(FirebaseContext); // Get schedules from context
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [camp, setCamp] = useState('Camp 1');
    const [topics, setTopics] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentScheduleId, setCurrentScheduleId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter schedules for the selected date and camp for display/editing
    const filteredSchedules = schedules.filter(s => {
        const scheduleDate = new Date(s.date.seconds * 1000).toISOString().split('T')[0];
        return scheduleDate === date && s.camp === camp;
    });

    const handleAddUpdateSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        const parsedTopics = topics.split(',').map(t => t.trim()).filter(t => t);

        if (parsedTopics.length === 0) {
            showMessage('Please enter at least one topic.', 'error');
            setLoading(false);
            return;
        }

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            const schedulesCollectionRef = collection(db, `artifacts/${appId}/public/data/schedules`);

            if (isEditing) {
                // Update existing schedule
                const scheduleDocRef = doc(db, `artifacts/${appId}/public/data/schedules`, currentScheduleId);
                await updateDoc(scheduleDocRef, {
                    topics: parsedTopics,
                    lastUpdated: new Date()
                });
                console.log(`ManageSchedule: Successfully updated schedule ${currentScheduleId} with topics:`, parsedTopics);
                showMessage('Schedule updated successfully!', 'success');
            } else {
                // Add new schedule
                await addDoc(schedulesCollectionRef, {
                    date: new Date(date),
                    camp: camp,
                    topics: parsedTopics,
                    createdAt: new Date(),
                    createdBy: userProfile.uid
                });
                console.log('ManageSchedule: Successfully added new schedule:', { date, camp, topics: parsedTopics });
                showMessage('Schedule added successfully!', 'success');
            }
            // Reset form
            setTopics('');
            setIsEditing(false);
            setCurrentScheduleId(null);
        } catch (error) {
            console.error("ManageSchedule: Error adding/updating schedule:", error);
            showMessage('Failed to save schedule. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (schedule) => {
        setIsEditing(true);
        setCurrentScheduleId(schedule.id);
        setDate(new Date(schedule.date.seconds * 1000).toISOString().split('T')[0]);
        setCamp(schedule.camp);
        setTopics(schedule.topics.join(', '));
        showMessage('Editing schedule. Remember to re-select date and camp if necessary.', 'info');
    };

    const handleDelete = async (scheduleId) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) { // Using window.confirm temporarily for quick debug
            setLoading(true);
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
                const scheduleDocRef = doc(db, `artifacts/${appId}/public/data/schedules`, scheduleId);
                await deleteDoc(scheduleDocRef);
                console.log(`ManageSchedule: Successfully deleted schedule ${scheduleId}.`);
                showMessage('Schedule deleted successfully!', 'success');
            } catch (error) {
                console.error("ManageSchedule: Error deleting schedule:", error);
                showMessage('Failed to delete schedule. ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-2xl mx-auto border-b-4 border-yellow-500">
            {loading && <LoadingSpinner />}
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Manage Camp Schedules</h3>

            <form onSubmit={handleAddUpdateSchedule} className="space-y-6 mb-10 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                <h4 className="text-2xl font-semibold text-gray-800 mb-4">{isEditing ? 'Edit Schedule' : 'Add New Schedule'}</h4>
                <div>
                    <label htmlFor="scheduleDate" className="block text-gray-700 text-lg font-medium mb-2">Date</label>
                    <input
                        type="date"
                        id="scheduleDate"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 text-lg shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="scheduleCamp" className="block text-gray-700 text-lg font-medium mb-2">Camp</label>
                    <select
                        id="scheduleCamp"
                        value={camp}
                        onChange={(e) => setCamp(e.target.value)}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 text-lg shadow-sm bg-white"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="scheduleTopics" className="block text-gray-700 text-lg font-medium mb-2">Topics (comma-separated)</label>
                    <input
                        type="text"
                        id="scheduleTopics"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200 text-lg shadow-sm"
                        placeholder="e.g., Math, Science, Art"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:from-yellow-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center"
                >
                    {isEditing ? <Edit className="mr-3" /> : <PlusCircle className="mr-3" />} {isEditing ? 'Update Schedule' : 'Add Schedule'}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={() => { setIsEditing(false); setCurrentScheduleId(null); setTopics(''); }}
                        className="w-full mt-4 bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-300 transform hover:scale-105 text-xl"
                    >
                        Cancel Edit
                    </button>
                )}
            </form>

            <h4 className="text-2xl font-bold text-gray-900 mt-12 mb-6 text-center">Schedules for {new Date(date).toLocaleDateString()} in {camp}</h4>
            {filteredSchedules.length > 0 ? (
                <ul className="space-y-4">
                    {filteredSchedules.map(schedule => (
                        <li key={schedule.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex-grow mb-3 sm:mb-0">
                                <p className="text-lg font-semibold text-gray-800">Topics: <span className="font-normal text-gray-700">{schedule.topics.join(', ')}</span></p>
                                <p className="text-sm text-gray-500 mt-1">Camp: {schedule.camp}</p>
                                <p className="text-sm text-gray-500">Created: {new Date(schedule.createdAt.seconds * 1000).toLocaleString()}</p>
                            </div>
                            <div className="flex space-x-3 mt-3 sm:mt-0">
                                <button
                                    onClick={() => handleEdit(schedule)}
                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md"
                                    title="Edit Schedule"
                                >
                                    <Edit size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(schedule.id)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md"
                                    title="Delete Schedule"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200">No schedules found for this date and camp. Add one above!</p>
            )}
        </div>
    );
};

export default ManageSchedule;
