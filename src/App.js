// src/App.js
import React, { useState, useEffect, useContext } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { onSnapshot, collection, query, where, doc, getDoc } from 'firebase/firestore';
// Corrected: Added ListTodo, Calendar, Award to lucide-react import
import { ListTodo, Calendar, Award } from 'lucide-react';
import { FirebaseContext } from './FirebaseContext';
import Auth from './Auth';
import DashboardLayout from './components/DashboardLayout';
import VolunteerDashboard from './volunteer/VolunteerDashboard';
import AddStudentForm from './volunteer/AddStudentForm';
import UpdateTopicForm from './volunteer/UpdateTopicForm';
import ReferralSection from './volunteer/ReferralSection';
import MarkAttendance from './management/MarkAttendance';
import ManageSchedule from './management/ManageSchedule';
import Leaderboard from './shared/Leaderboard';
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox'; // Ensure this is imported

import './index.css'; // Make sure this is imported

function App() {
    const { db, auth, userId, userProfile, isAuthReady, message, messageType, showMessage, handleCloseMessage } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [students, setStudents] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // All user profiles for leaderboard/management
    const [attendanceRecords, setAttendanceRecords] = useState([]); // Public attendance records
    const [schedules, setSchedules] = useState([]); // Public schedules

    // Fetch and listen for all users (for leaderboard and management view)
    useEffect(() => {
        if (!db || !isAuthReady) {
            console.log("App.js [allUsers]: Not ready - db:", !!db, "isAuthReady:", isAuthReady); // Log readiness
            return;
        }

        const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
        console.log("App.js [allUsers]: Using appId:", appId); // Log appId being used

        // Listener for ALL user documents (UIDs) under 'users' collection
        // This is necessary to get all UIDs to then fetch their profiles
        const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
        console.log("App.js [allUsers]: Listening to collection:", usersCollectionRef.path); // Log the full collection path

        const unsubscribeAllUsers = onSnapshot(usersCollectionRef, (usersSnapshot) => {
            console.log("App.js [allUsers]: Received snapshot. Docs count:", usersSnapshot.docs.length); // Log snapshot size
            if (usersSnapshot.empty) {
                console.log("App.js [allUsers]: Users collection is empty.");
                setAllUsers([]);
                return;
            }

            const fetchedUsers = [];
            const profilePromises = usersSnapshot.docs.map(userDoc => {
                const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/userProfile`, userDoc.id);
                console.log("App.js [allUsers]: Fetching user profile for UID:", userDoc.id, "Path:", userProfileDocRef.path); // Log individual profile path
                return getDoc(userProfileDocRef).then(profileSnap => {
                    if (profileSnap.exists()) {
                        fetchedUsers.push({ id: profileSnap.id, ...profileSnap.data() });
                    } else {
                        console.warn("App.js [allUsers]: User profile does not exist for:", userDoc.id); // Warn if profile is missing
                    }
                }).catch(error => {
                    console.error(`App.js [allUsers]: Error fetching user profile for ${userDoc.id}:`, error); // Log individual fetch errors
                });
            });

            Promise.all(profilePromises).then(() => {
                console.log("App.js [allUsers]: All user profiles processed. Total fetched:", fetchedUsers.length, "Data:", fetchedUsers); // Final processed data log
                setAllUsers(fetchedUsers);
            }).catch(error => {
                console.error("App.js [allUsers]: Error processing all user profiles promises:", error);
                showMessage("Failed to process all user profiles.", "error");
            });

        }, (error) => {
            console.error("App.js [allUsers]: Error listening to all users (main collection):", error);
            showMessage("Failed to load user list. Check console for details.", "error");
        });


        // Listener for current user's students taught
        let unsubscribeStudents = () => {};
        if (userId && userProfile?.role === 'volunteer') {
            const studentsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/studentsTaught`);
            unsubscribeStudents = onSnapshot(studentsCollectionRef, (snapshot) => {
                const fetchedStudents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(fetchedStudents);
                console.log("App.js: Students Taught data loaded:", fetchedStudents); // Log for debugging
            }, (error) => {
                console.error("Error listening to students taught:", error); // Log for debugging
                showMessage("Failed to load your students' data.", "error");
            });
        }

        // Listener for public attendance records
        const unsubscribeAttendance = onSnapshot(collection(db, `artifacts/${appId}/public/data/attendance`), (snapshot) => {
            const fetchedAttendance = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAttendanceRecords(fetchedAttendance);
        }, (error) => {
            console.error("Error listening to attendance records:", error);
            showMessage("Failed to load attendance records.", "error");
        });

        // Listener for public schedules
        const unsubscribeSchedules = onSnapshot(collection(db, `artifacts/${appId}/public/data/schedules`), (snapshot) => {
            const fetchedSchedules = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSchedules(fetchedSchedules);
        }, (error) => {
            console.error("Error listening to schedules:", error);
            showMessage("Failed to load schedules.", "error");
        });

        return () => {
            unsubscribeAllUsers();
            unsubscribeStudents();
            unsubscribeAttendance();
            unsubscribeSchedules();
        };
    }, [db, userId, userProfile, isAuthReady, showMessage]);


    const handleLogout = async () => {
        try {
            await signOut(auth);
            showMessage('Logged out successfully!', 'success');
            setCurrentPage('dashboard'); // Reset to dashboard for next login
        } catch (error) {
            console.error("Logout error:", error);
            showMessage('Logout failed: ' + error.message, 'error');
        }
    };

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    if (!userId) {
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
                {/* Render components based on currentPage and user role */}
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
