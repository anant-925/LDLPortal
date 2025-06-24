/* global __app_id */
import React, { useState, useContext, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext'; // Correct path assuming FirebaseContext.js is in src/
import LoadingSpinner from '../components/LoadingSpinner'; // Correct path assuming LoadingSpinner.js is in src/components/
import { CheckSquare, Square, Save, BookOpen, GraduationCap } from 'lucide-react'; // Added BookOpen and GraduationCap

const UpdateTopicForm = ({ userProfile, schedules, students }) => {
    const { db, showMessage } = useContext(FirebaseContext);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCamp, setSelectedCamp] = useState('Camp 1');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTopicsForStudent, setSelectedTopicsForStudent] = useState(null); // Initialize as null or empty array based on student selection
    const [selectedTopicsForProfile, setSelectedTopicsForProfile] = useState(userProfile?.topicsCanTeach || []); // Topics related to volunteer's own profile
    const [loading, setLoading] = useState(false);

    // Filter students taught by this specific volunteer
    const volunteerStudents = students.filter(s => s.volunteerId === userProfile?.uid);

    // Effect to populate available topics based on selected date and camp from public schedules
    useEffect(() => {
        console.log("UpdateTopicForm: Running useEffect for available topics.");
        const dateObj = new Date(selectedDate);
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        const topicsForDay = schedules
            .filter(s => {
                const scheduleDate = new Date(s.date.seconds * 1000);
                return scheduleDate.getDate() === day &&
                       scheduleDate.getMonth() === month &&
                       scheduleDate.getFullYear() === year &&
                       s.camp === selectedCamp;
            })
            .flatMap(s => s.topics || []); // Ensure 'topics' exists and is an array

        setAvailableTopics([...new Set(topicsForDay)]); // Remove duplicates
        console.log("UpdateTopicForm: Available topics updated:", [...new Set(topicsForDay)]);
    }, [selectedDate, selectedCamp, schedules]); // Dependencies for this effect

    // Effect to set student's current topics when a student is selected
    useEffect(() => {
        if (selectedStudentId) {
            const student = volunteerStudents.find(s => s.id === selectedStudentId);
            if (student) {
                // Ensure selectedTopicsForStudent is an array for safety
                setSelectedTopicsForStudent(student.topicsTaught || []);
                console.log(`UpdateTopicForm: Selected student ${student.studentName}, current topics:`, student.topicsTaught);
            }
        } else {
            setSelectedTopicsForStudent([]); // Clear if no student is selected
        }
    }, [selectedStudentId, volunteerStudents]); // Dependencies for this effect

    // Sync volunteer's topicsCanTeach state with prop if userProfile changes
    useEffect(() => {
        if (userProfile?.topicsCanTeach) {
            setSelectedTopicsForProfile(userProfile.topicsCanTeach);
        }
    }, [userProfile?.topicsCanTeach]);


    // Handler for updating volunteer's own topicsCanTeach
    const handleToggleTopicForProfile = (topic) => {
        setSelectedTopicsForProfile(prev => {
            const newTopics = prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic];
            console.log(`UpdateTopicForm: Toggling profile topic '${topic}'. New profile topics:`, newTopics);
            return newTopics;
        });
    };

    // Handler for updating a student's taught topics
    const handleToggleTopicForStudent = (topic) => {
        setSelectedTopicsForStudent(prev => {
            // Handle case where prev might be null initially before a student is selected
            const currentTopics = Array.isArray(prev) ? prev : [];
            const newTopics = currentTopics.includes(topic) ? currentTopics.filter(t => t !== topic) : [...currentTopics, topic];
            console.log(`UpdateTopicForm: Toggling student topic '${topic}'. New student topics:`, newTopics);
            return newTopics;
        });
    };


    const handleUpdateVolunteerProfileTopics = async () => {
        setLoading(true);
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            const userProfileRef = doc(db, `artifacts/${appId}/users/${userProfile.uid}/userProfile`, userProfile.uid);
            await updateDoc(userProfileRef, {
                topicsCanTeach: selectedTopicsForProfile
            });
            console.log(`UpdateTopicForm: Successfully updated volunteer ${userProfile.name}'s topicsCanTeach to:`, selectedTopicsForProfile);
            showMessage('Your teaching topics updated successfully!', 'success');
        } catch (error) {
            console.error("UpdateTopicForm: Error updating volunteer's teaching topics:", error);
            showMessage('Failed to update your teaching topics. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStudentTopics = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!selectedStudentId) {
            showMessage('Please select a student to update their topics.', 'error');
            setLoading(false);
            return;
        }
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
            const studentDocRef = doc(db, `artifacts/${appId}/users/${userProfile.uid}/studentsTaught`, selectedStudentId);
            await updateDoc(studentDocRef, {
                topicsTaught: selectedTopicsForStudent
            });
            console.log(`UpdateTopicForm: Successfully updated student ${selectedStudentId}'s taught topics to:`, selectedTopicsForStudent);
            showMessage('Student topics updated successfully!', 'success');
        } catch (error) {
            console.error("UpdateTopicForm: Error updating student's topics:", error);
            showMessage('Failed to update student topics. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-2xl mx-auto border-r-4 border-purple-500">
            {loading && <LoadingSpinner />}
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Manage Your Topics & Student Topics</h3>

            {/* Section 1: Update Volunteer's Own Topics */}
            <div className="mb-10 p-6 bg-blue-50 rounded-xl shadow-inner border border-blue-200">
                <h4 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center">
                    <BookOpen className="mr-3" size={24} /> Your Teaching Expertise
                </h4>
                <p className="text-gray-700 mb-4">Select topics you are qualified to teach. These will appear on your profile.</p>
                
                {/* Date and Camp selection to filter available topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label htmlFor="topicDate" className="block text-gray-700 text-lg font-medium mb-2">Select Date for Topics</label>
                        <input
                            type="date"
                            id="topicDate"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="topicCamp" className="block text-gray-700 text-lg font-medium mb-2">Select Camp for Topics</label>
                        <select
                            id="topicCamp"
                            value={selectedCamp}
                            onChange={(e) => setSelectedCamp(e.target.value)}
                            className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm bg-white"
                        >
                            <option value="Camp 1">Camp 1</option>
                            <option value="Camp 2">Camp 2</option>
                        </select>
                    </div>
                </div>

                {availableTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mb-6">
                        {availableTopics.map(topic => (
                            <button
                                type="button"
                                key={topic}
                                onClick={() => handleToggleTopicForProfile(topic)}
                                className={`flex items-center px-4 py-2 rounded-full font-medium text-lg shadow-sm border
                                ${selectedTopicsForProfile.includes(topic)
                                    ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                } transition-colors duration-200`}
                            >
                                {selectedTopicsForProfile.includes(topic) ? <CheckSquare size={20} className="mr-2" /> : <Square size={20} className="mr-2" />}
                                {topic}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic text-center p-4 bg-gray-100 rounded-lg border border-gray-200">No scheduled topics found for the selected date/camp. Add schedules as management first.</p>
                )}

                <button
                    type="button"
                    onClick={handleUpdateVolunteerProfileTopics}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center"
                >
                    <Save className="mr-3" /> Save My Teaching Topics
                </button>
            </div>

            {/* Section 2: Update Topics Taught for a Specific Student */}
            <div className="p-6 bg-green-50 rounded-xl shadow-inner border border-green-200">
                <h4 className="text-2xl font-semibold text-green-800 mb-4 flex items-center">
                    <GraduationCap className="mr-3" size={24} /> Update Student's Taught Topics
                </h4>
                <p className="text-gray-700 mb-4">Select a student and update the topics you have taught them.</p>

                <div className="mb-5">
                    <label htmlFor="studentSelect" className="block text-gray-700 text-lg font-medium mb-2">Select Student</label>
                    <select
                        id="studentSelect"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-green-500 focus:border-green-500 transition duration-200 text-lg shadow-sm bg-white"
                    >
                        <option value="">-- Choose a Student --</option>
                        {volunteerStudents.map(student => (
                            <option key={student.id} value={student.id}>{student.studentName} ({student.camp})</option>
                        ))}
                    </select>
                </div>

                {selectedStudentId && availableTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mb-6">
                        {availableTopics.map(topic => (
                            <button
                                type="button"
                                key={topic}
                                onClick={() => handleToggleTopicForStudent(topic)}
                                className={`flex items-center px-4 py-2 rounded-full font-medium text-lg shadow-sm border
                                ${selectedTopicsForStudent && selectedTopicsForStudent.includes(topic)
                                    ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                } transition-colors duration-200`}
                            >
                                {selectedTopicsForStudent && selectedTopicsForStudent.includes(topic) ? <CheckSquare size={20} className="mr-2" /> : <Square size={20} className="mr-2" />}
                                {topic}
                            </button>
                        ))}
                    </div>
                ) : selectedStudentId && availableTopics.length === 0 ? (
                    <p className="text-gray-500 italic text-center p-4 bg-gray-100 rounded-lg border border-gray-200">No scheduled topics found for the selected date/camp to assign to this student.</p>
                ) : (
                    <p className="text-gray-500 italic text-center p-4 bg-gray-100 rounded-lg border border-gray-200">Select a student above to manage their topics.</p>
                )}

                <button
                    type="button"
                    onClick={handleUpdateStudentTopics}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 text-xl flex items-center justify-center"
                >
                    <Save className="mr-3" /> Save Student Topics
                </button>
            </div>
        </div>
    );
};

export default UpdateTopicForm;
