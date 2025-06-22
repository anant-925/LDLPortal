// src/components/DashboardLayout.js
import React from 'react';
import { LayoutDashboard, PlusCircle, BookOpen, Share2, ListTodo, Calendar, Award, LogOut, User } from 'lucide-react';

const DashboardLayout = ({ userProfile, children, currentPage, setCurrentPage, handleLogout }) => (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-blue-50 font-inter">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-gradient-to-b from-blue-800 to-indigo-900 text-white p-6 flex flex-col shadow-2xl lg:min-h-screen rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none">
            <h1 className="text-4xl font-extrabold mb-10 text-center border-b-2 border-blue-600 pb-5">LDLPortal</h1>
            <nav className="flex-grow">
                <ul className="space-y-4">
                    <li>
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'dashboard' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                        >
                            <LayoutDashboard className="mr-4" size={24} /> Dashboard
                        </button>
                    </li>
                    {userProfile?.role === 'volunteer' && (
                        <>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('addStudent')}
                                    className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'addStudent' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                                >
                                    <PlusCircle className="mr-4" size={24} /> Add Student
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('updateTopic')}
                                    className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'updateTopic' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                                >
                                    <BookOpen className="mr-4" size={24} /> Update Topic
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('referral')}
                                    className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'referral' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                                >
                                    <Share2 className="mr-4" size={24} /> Referral
                                </button>
                            </li>
                        </>
                    )}
                    {userProfile?.role === 'management' && (
                        <>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('markAttendance')}
                                    className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'markAttendance' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                                >
                                    <ListTodo className="mr-4" size={24} /> Mark Attendance
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentPage('manageSchedule')}
                                    className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'manageSchedule' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                                >
                                    <Calendar className="mr-4" size={24} /> Manage Schedule
                                </button>
                            </li>
                        </>
                    )}
                    <li>
                        <button
                            onClick={() => setCurrentPage('leaderboard')}
                            className={`flex items-center w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-700 ${currentPage === 'leaderboard' ? 'bg-blue-700 shadow-lg text-blue-100' : 'text-blue-200 hover:text-white'}`}
                        >
                            <Award className="mr-4" size={24} /> Leaderboard
                        </button>
                    </li>
                </ul>
            </nav>
            <div className="mt-auto pt-6 border-t border-blue-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-4 rounded-xl text-lg font-medium bg-red-600 hover:bg-red-700 transition-colors duration-300 transform hover:scale-105 shadow-md"
                >
                    <LogOut className="mr-4" size={24} /> Logout
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-6 lg:p-10">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between border-b-4 border-blue-500">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-3 sm:mb-0">
                    Welcome, {userProfile?.name || 'User'}!
                </h2>
                <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full flex items-center shadow-inner">
                    <User size={16} className="mr-2" />
                    <span className="font-mono">{userProfile?.uid}</span>
                </div>
            </div>
            {children}
        </main>
    </div>
);

export default DashboardLayout;

