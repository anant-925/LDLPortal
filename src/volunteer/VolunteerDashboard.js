import React, { useState, useContext, useEffect } from 'react';
import { User, GraduationCap, Calendar, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { FirebaseContext } from '../FirebaseContext';

const VolunteerDashboard = ({ userProfile, students, attendanceRecords, schedules }) => {
    const { showMessage } = useContext(FirebaseContext);

    const [currentDate, setCurrentDate] = useState(new Date());

    const volunteerAttendance = attendanceRecords.filter(rec => rec.volunteerId === userProfile?.uid);
    const uniqueAttendanceDates = new Set(volunteerAttendance.map(rec => new Date(rec.date.seconds * 1000).toDateString()));
    const totalAttendanceDays = userProfile?.totalAttendanceDays || uniqueAttendanceDates.size;

    const displayMonth = currentDate.getMonth();
    const displayYear = currentDate.getFullYear();

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday

    const daysInMonth = getDaysInMonth(displayMonth, displayYear);
    const firstDay = getFirstDayOfMonth(displayMonth, displayYear);

    const calendarDates = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDates.push(null); // Empty slots for days before the 1st
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDates.push(i);
    }

    const markedDates = new Set(volunteerAttendance.map(rec => {
        const date = new Date(rec.date.seconds * 1000);
        return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    }));

    const isDateMarked = (day) => {
        if (!day) return false;
        const dateKey = `${day}-${displayMonth}-${displayYear}`;
        return markedDates.has(dateKey);
    };

    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        return day === today.getDate() && displayMonth === today.getMonth() && displayYear === today.getFullYear();
    };

    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Volunteer Stats */}
            <div className="bg-white p-8 rounded-2xl shadow-xl col-span-full mb-4 border-l-4 border-blue-500">
                <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center"><User className="mr-4 text-blue-600" size={28} /> Your Contributions Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200 transform hover:scale-105 transition-transform duration-200">
                        <p className="text-5xl font-extrabold text-blue-700">{totalAttendanceDays}</p>
                        <p className="text-lg text-gray-700 mt-3">Days Attended</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200 transform hover:scale-105 transition-transform duration-200">
                        <p className="text-5xl font-extrabold text-green-700">{students.filter(s => s.volunteerId === userProfile?.uid).length}</p>
                        <p className="text-lg text-gray-700 mt-3">Students Taught</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-200 transform hover:scale-105 transition-transform duration-200">
                        <p className="text-5xl font-extrabold text-purple-700">{userProfile?.topicsCanTeach?.length || 0}</p>
                        <p className="text-lg text-gray-700 mt-3">Topics You Teach</p>
                    </div>
                </div>
            </div>

            {/* Students Taught */}
            <div className="bg-white p-8 rounded-2xl shadow-xl lg:col-span-1 border-t-4 border-green-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><GraduationCap className="mr-3 text-green-600" size={24} /> Students Taught</h3>
                {students.filter(s => s.volunteerId === userProfile?.uid).length > 0 ? (
                    <ul className="space-y-4">
                        {students.filter(s => s.volunteerId === userProfile?.uid).map((student, index) => (
                            <li key={student.id || index} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                                <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                                    <User size={20} className="mr-2 text-gray-600" />
                                    <span className="font-semibold text-gray-800 text-lg">{student.studentName}</span>
                                </div>
                                <div className="ml-0 sm:ml-auto text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                                    {student.camp}
                                </div>
                                {student.topicsTaught && student.topicsTaught.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2 sm:mt-0 sm:ml-4 text-xs">
                                        {student.topicsTaught.map((topic, tIdx) => (
                                            <span key={tIdx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic text-center p-4 bg-gray-50 rounded-lg">No students added yet. Start adding to see your impact!</p>
                )}
            </div>

            {/* Attendance Calendar */}
            <div className="bg-white p-8 rounded-2xl shadow-xl lg:col-span-2 border-r-4 border-blue-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Calendar className="mr-3 text-blue-600" size={24} /> Your Attendance Calendar</h3>
                <div className="flex items-center justify-between font-bold text-2xl mb-6 text-gray-800 bg-blue-50 py-3 px-4 rounded-lg shadow-inner">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-blue-200 transition-colors duration-200">
                        <ChevronLeft size={24} className="text-blue-700" />
                    </button>
                    <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-blue-200 transition-colors duration-200">
                        <ChevronRight size={24} className="text-blue-700" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-3 text-center text-md">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="font-semibold text-gray-700 p-3 border-b-2 border-blue-200 bg-blue-100 rounded-md">
                            {day}
                        </div>
                    ))}
                    {calendarDates.map((day, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg transition-all duration-200 text-lg font-semibold
                            ${day ? 'text-gray-800' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
                            ${isDateMarked(day) ? 'bg-blue-300 text-blue-900 ring-4 ring-blue-500 shadow-lg transform scale-105' :
                              isToday(day) ? 'bg-indigo-200 text-indigo-900 ring-2 ring-indigo-400 font-bold' : // Highlight today
                              'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                            }`}
                        >
                            {day || ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Topics You Can Teach */}
            <div className="bg-white p-8 rounded-2xl shadow-xl col-span-full border-b-4 border-purple-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><BookOpen className="mr-3 text-purple-600" size={24} /> Your Teaching Expertise</h3>
                {userProfile?.topicsCanTeach?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {userProfile.topicsCanTeach.map((topic, index) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-5 py-2.5 rounded-full font-medium text-lg shadow-sm border border-purple-200">
                                {topic}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic text-center p-4 bg-gray-50 rounded-lg">No topics specified yet. Please contact management to add your teaching topics.</p>
                )}
            </div>
        </div>
    );
};

export default VolunteerDashboard;
