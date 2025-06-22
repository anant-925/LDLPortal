// src/App.js
import React, { useState, useEffect, useContext } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'; // Import doc and getDoc for initial profile fetching fallback
import { FirebaseContext, FirebaseProvider } from './FirebaseContext';
import MessageBox from './components/MessageBox';
import LoadingSpinner from './components/LoadingSpinner';
import Auth from './Auth';
import DashboardLayout from './components/DashboardLayout';
import VolunteerDashboard from './volunteer/VolunteerDashboard';
import AddStudentForm from './volunteer/AddStudentForm';
import UpdateTopicForm from './volunteer/UpdateTopicForm';
import ReferralSection from './volunteer/ReferralSection';
import MarkAttendance from './management/MarkAttendance';
import ManageSchedule from './management/ManageSchedule';
import Leaderboard from './shared/Leaderboard';
import { ListTodo, Calendar, Award } from 'lucide-react'; // Icons for management dashboard overview

const AppContent = () => {
    const { db, auth, userId, userProfile, isAuthReady, showMessage, message, messageType, handleCloseMessage } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('auth');
    const [loadingData, setLoadingData] = useState(true);

    // State for common data fetched by all roles
    const [allUsers, setAllUsers] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [students, setStudents] = useState([]); // Volunteer-specific
    const [schedules, setSchedules] = useState([]);


    // Determine initial page once auth is ready
    useEffect(() => {
        if (isAuthReady) {
            if (userId && userProfile) {
                setCurrentPage('dashboard');
            } else {
                setCurrentPage('auth');
            }
            setLoadingData(false); // Auth and initial profile state determined
        }
    }, [isAuthReady, userId, userProfile]);

    // Listeners for common data (allUsers, attendanceRecords, schedules, students)
    useEffect(() => {
        if (!db || !userId || !userProfile || !isAuthReady) {
            // Wait until Firebase is initialized, user is authenticated, and profile is loaded
            return;
        }

        const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';

        // 1. All Users (for leaderboard and management)
        const unsubscribeAllUsers = onSnapshot(collection(db, `artifacts/${appId}/users`), (snapshot) => {
            const usersPromises = snapshot.docs.map(docSnap => {
                const userProfileRef = doc(db, `artifacts/${appId}/users/${docSnap.id}/userProfile`, docSnap.id);
                return getDoc(userProfileRef).then(profileSnap => {
                    if (profileSnap.exists()) {
                        return { id: profileSnap.id, ...profileSnap.data() };
                    }
                    return null;
                }).catch(e => {
                    console.error("Error fetching nested user profile:", e);
                    return null;
                });
            });

            Promise.all(usersPromises).then(results => {
                setAllUsers(results.filter(Boolean)); // Filter out nulls
            });
        }, (error) => {
            console.error("Error listening to all users:", error);
            showMessage("Failed to load user list.", "error");
        });

        // 2. Attendance Records (Public)
        const unsubscribeAttendance = onSnapshot(collection(db, `artifacts/${appId}/public/data/attendance`), (snapshot) => {
            const attendanceData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setAttendanceRecords(attendanceData);
        }, (error) => {
            console.error("Error listening to attendance records:", error);
            showMessage("Failed to load attendance records.", "error");
        });

        // 3. Schedules (Public)
        const unsubscribeSchedules = onSnapshot(collection(db, `artifacts/${appId}/public/data/schedules`), (snapshot) => {
            const schedulesData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setSchedules(schedulesData);
        }, (error) => {
            console.error("Error listening to schedules:", error);
            showMessage("Failed to load schedules.", "error");
        });

        // 4. Students (Volunteer-specific private data)
        let unsubscribeStudents = () => {};
        if (userProfile?.role === 'volunteer') {
             unsubscribeStudents = onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/studentsTaught`), (snapshot) => {
                const studentsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                setStudents(studentsData);
            }, (error) => {
                console.error("Error listening to students taught:", error);
                showMessage("Failed to load your students data.", "error");
            });
        } else {
            setStudents([]); // Clear students if not a volunteer or profile not ready
        }

        return () => {
            unsubscribeAllUsers();
            unsubscribeAttendance();
            unsubscribeSchedules();
            unsubscribeStudents();
        };

    }, [db, userId, userProfile, isAuthReady, showMessage]);


    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                showMessage('Logged out successfully!', 'success');
                // state will be cleared by onAuthStateChanged listener
                setCurrentPage('auth');
            } catch (error) {
                console.error("Logout error:", error);
                showMessage('Failed to log out. ' + error.message, 'error');
            }
        }
    };

    if (!isAuthReady || loadingData) {
        return <LoadingSpinner />;
    }

    return (
        <div className="App">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .animate-fade-in-down {
                    animation: fadeInDown 0.5s ease-out forwards;
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
            {message && <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />}

            {!userId || !userProfile ? (
                <Auth setCurrentPage={setCurrentPage} />
            ) : (
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
            )}
        </div>
    );
};

// Wrap AppContent with FirebaseProvider
const App = () => (
    <FirebaseProvider>
        <AppContent />
    </FirebaseProvider>
);

export default App;
