// src/App.js
import React, { useState, useEffect, useContext } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { onSnapshot, collection, query, where, doc, getDoc } from 'firebase/firestore';
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
import MessageBox from './components/MessageBox';

import './index.css';

function App() {
    const { db, auth, userId, userProfile, isAuthReady, message, messageType, showMessage, handleCloseMessage } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [students, setStudents] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        if (!db || !isAuthReady) {
            console.log("App.js [allUsers]: Not ready - db:", !!db, "isAuthReady:", isAuthReady);
            return;
        }

        const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
        console.log("App.js [allUsers]: Using appId:", appId);

        const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
        console.log("App.js [allUsers]: Listening to collection:", usersCollectionRef.path);

        const unsubscribeAllUsers = onSnapshot(usersCollectionRef, (usersSnapshot) => {
            console.log("App.js [allUsers]: Received snapshot. Top-level User Docs count:", usersSnapshot.docs.length);
            if (usersSnapshot.empty) {
                console.log("App.js [allUsers]: Top-level 'users' collection is empty. No user UIDs found directly.");
                setAllUsers([]);
                return;
            }

            const fetchedUsers = [];
            const profilePromises = usersSnapshot.docs.map(userDoc => {
                const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/userProfile`, userDoc.id);
                return getDoc(userProfileDocRef).then(profileSnap => {
                    if (profileSnap.exists()) {
                        fetchedUsers.push({ id: profileSnap.id, ...profileSnap.data() });
                    } else {
                        console.warn("App.js [allUsers]: User profile document does NOT exist for UID:", userDoc.id);
                    }
                }).catch(error => {
                    console.error(`App.js [allUsers]: Error fetching user profile for ${userDoc.id}:`, error);
                });
            });

            Promise.all(profilePromises).then(() => {
                console.log("App.js [allUsers]: All user profiles processed. Total fetched:", fetchedUsers.length, "Data:", fetchedUsers);
                setAllUsers(fetchedUsers);
            }).catch(error => {
                console.error("App.js [allUsers]: Error processing all user profiles promises:", error);
                showMessage("Failed to process all user profiles.", "error");
            });

        }, (error) => {
            console.error("App.js [allUsers]: Error listening to all users (main collection):", error);
            showMessage("Failed to load user list. Check console for details.", "error");
        });


        let unsubscribeStudents = () => {};
        if (userId && userProfile?.role === 'volunteer') {
            const studentsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/studentsTaught`);
            unsubscribeStudents = onSnapshot(studentsCollectionRef, (snapshot) => {
                const fetchedStudents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(fetchedStudents);
                console.log("App.js: Students Taught data loaded:", fetchedStudents);
            }, (error) => {
                console.error("Error listening to students taught:", error);
                showMessage("Failed to load your students' data.", "error");
            });
        }

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
            setCurrentPage('dashboard');
        } catch (error) {
            console.error("Logout error:", error);
            showMessage('Logout failed: ' + error.message, 'error');
        }
    };

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    // Add a check for userProfile here before rendering content that depends on its properties
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
