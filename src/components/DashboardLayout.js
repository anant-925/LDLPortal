// src/components/DashboardLayout.js
import React from 'react';
import { LayoutDashboard, PlusCircle, BookOpen, Share2, ListTodo, Calendar, Award, LogOut, User } from 'lucide-react';

const DashboardLayout = ({ userProfile, children, currentPage, setCurrentPage, handleLogout }) => (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 font-inter">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-gradient-to-b from-blue-700 to-blue-800 text-white p-6 flex flex-col shadow-lg lg:min-h-screen">
            <h1 className="text-3xl font-extrabold mb-8 text-center border-b border-blue-600 pb-4">LDLPortal</h1>
            <nav className="flex-grow">
                <ul className="space-y-4">
                    <li>
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'dashboard' ? 'bg-blue-600 shadow-inner' : ''}`}
                        >
                            <LayoutDashboard className="mr-3" size={20} /> Dashboard
                        </button>
                    </li>
                    {userProfile?.role === 'volunteer' && (
                        <>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('addStudent')}
                                    className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'addStudent' ? 'bg-blue-600 shadow-inner' : ''}`}
                                >
                                    <PlusCircle className="mr-3" size={20} /> Add Student
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('updateTopic')}
                                    className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'updateTopic' ? 'bg-blue-600 shadow-inner' : ''}`}
                                >
                                    <BookOpen className="mr-3" size={20} /> Update Topic
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('referral')}
                                    className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'referral' ? 'bg-blue-600 shadow-inner' : ''}`}
                                >
                                    <Share2 className="mr-3" size={20} /> Referral
                                </button>
                            </li>
                        </>
                    )}
                    {userProfile?.role === 'management' && (
                        <>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('markAttendance')}
                                    className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'markAttendance' ? 'bg-blue-600 shadow-inner' : ''}`}
                                >
                                    <ListTodo className="mr-3" size={20} /> Mark Attendance
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('manageSchedule')}
                                    className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'manageSchedule' ? 'bg-blue-600 shadow-inner' : ''}`}
                                >
                                    <Calendar className="mr-3" size={20} /> Manage Schedule
                                </button>
                            </li>
                        </>
                    )}
                    <li>
                        <button
                            onClick={() => setCurrentPage('leaderboard')}
                            className={`flex items-center w-full p-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 ${currentPage === 'leaderboard' ? 'bg-blue-600 shadow-inner' : ''}`}
                        >
                            <Award className="mr-3" size={20} /> Leaderboard
                        </button>
                    </li>
                </ul>
            </nav>
            <div className="mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 rounded-lg text-lg font-medium bg-red-600 hover:bg-red-700 transition-colors duration-200 shadow-md"
                >
                    <LogOut className="mr-3" size={20} /> Logout
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-6 lg:p-8">
            <div className="bg-white rounded-xl shadow-md p-6 lg:p-8 mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-800">
                    Welcome, {userProfile?.name || 'User'}!
                </h2>
                <div className="text-gray-600 text-sm">
                    User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded-md">{userProfile?.uid}</span>
                </div>
            </div>
            {children}
        </main>
    </div>
);

export default DashboardLayout;
