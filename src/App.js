/* global __app_id */
import React, { useState, useContext } from 'react';
import { signOut } from 'firebase/auth';
import { FirebaseContext } from './FirebaseContext'; // Path: src/FirebaseContext.js
import Auth from './Auth'; // Path: src/Auth.js
import DashboardLayout from './components/DashboardLayout'; // Path: src/components/DashboardLayout.js
import VolunteerDashboard from './volunteer/VolunteerDashboard'; // Path: src/volunteer/VolunteerDashboard.js
import AddStudentForm from './volunteer/AddStudentForm'; // Path: src/volunteer/AddStudentForm.js
import UpdateTopicForm from './volunteer/UpdateTopicForm'; // Path: src/volunteer/UpdateTopicForm.js
import ReferralSection from './volunteer/ReferralSection'; // Path: src/volunteer/ReferralSection.js
import MarkAttendance from './management/MarkAttendance'; // Path: src/management/MarkAttendance.js
import ManageSchedule from './management/ManageSchedule'; // Path: src/management/ManageSchedule.js
import Leaderboard from './shared/Leaderboard'; // Path: src/shared/Leaderboard.js
import LoadingSpinner from './components/LoadingSpinner'; // Path: src/components/LoadingSpinner.js
import MessageBox from './components/MessageBox'; // Path: src/components/MessageBox.js
import { ListTodo, Calendar, Award } from 'lucide-react';
import './index.css'; // Path: src/index.css

function App() {
    const { auth, userId, userProfile, loading, message, messageType, showMessage, handleCloseMessage } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('dashboard');

    // Destructure data from context
    const { allUsers, attendanceRecords, schedules, students } = useContext(FirebaseContext);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            showMessage('Logged out successfully!', 'success');
            setCurrentPage('auth'); // Redirect to auth page after logout
        } catch (error) {
            console.error("Logout error:", error);
            showMessage('Logout failed: ' + error.message, 'error');
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!userId || !userProfile) {
        return <Auth setCurrentPage={setCurrentPage} />;
    }

    return (
        <>
            <DashboardLayout
                userProfile={userProfile}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                handleLogout={handleLogout}
            >
                {currentPage === 'dashboard' && userProfile.role === 'volunteer' && (
                    <VolunteerDashboard
                        userProfile={userProfile}
                        students={students}
                        attendanceRecords={attendanceRecords}
                        schedules={schedules}
                    />
                )}
                {currentPage === 'addStudent' && userProfile.role === 'volunteer' && (
                    <AddStudentForm userProfile={userProfile} />
                )}
                {currentPage === 'updateTopic' && userProfile.role === 'volunteer' && (
                    <UpdateTopicForm userProfile={userProfile} schedules={schedules} students={students} />
                )}
                {currentPage === 'referral' && userProfile.role === 'volunteer' && (
                    <ReferralSection userProfile={userProfile} />
                )}
                {currentPage === 'markAttendance' && userProfile.role === 'management' && (
                    <MarkAttendance userProfile={userProfile} allUsers={allUsers} attendanceRecords={attendanceRecords} />
                )}
                {currentPage === 'manageSchedule' && userProfile.role === 'management' && (
                    <ManageSchedule userProfile={userProfile} />
                )}
                {currentPage === 'leaderboard' && (
                    <Leaderboard allUsers={allUsers} />
                )}
                {/* Fallback for management dashboard if no specific page is selected or role mismatch */}
                {currentPage === 'dashboard' && userProfile.role === 'management' && (
                     <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Management Dashboard Overview</h3>
                        <p className="text-gray-600">Please use the sidebar to access features like marking attendance, managing schedules, and viewing the leaderboard.</p>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => setCurrentPage('markAttendance')}
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                            >
                                <ListTodo className="mr-2" /> Mark Attendance
                            </button>
                            <button
                                onClick={() => setCurrentPage('manageSchedule')}
                                className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center justify-center"
                            >
                                <Calendar className="mr-2" /> Manage Schedule
                            </button>
                            <button
                                onClick={() => setCurrentPage('leaderboard')}
                                className="bg-purple-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-600 transition-colors flex items-center justify-center"
                            >
                                <Award className="mr-2" /> View Leaderboard
                            </button>
                        </div>
                    </div>
                )}
            </DashboardLayout>
            <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />
        </>
    );
}

export default App;
