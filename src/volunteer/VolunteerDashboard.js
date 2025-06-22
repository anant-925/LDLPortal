// src/volunteer/VolunteerDashboard.js
import React, { useContext } from 'react';
import { User, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { FirebaseContext } from '../FirebaseContext';

const VolunteerDashboard = ({ userProfile, students, attendanceRecords, schedules }) => {
    const { showMessage } = useContext(FirebaseContext);

    // Filter attendance for the current volunteer
    const volunteerAttendance = attendanceRecords.filter(rec => rec.volunteerId === userProfile?.uid);

    // Calculate total attendance days (should ideally come from userProfile, but can compute for display)
    const uniqueAttendanceDates = new Set(volunteerAttendance.map(rec => new Date(rec.date.seconds * 1000).toDateString()));
    const totalAttendanceDays = userProfile?.totalAttendanceDays || uniqueAttendanceDates.size;

    // Calendar Data preparation
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

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
        const dateKey = `${day}-${currentMonth}-${currentYear}`;
        return markedDates.has(dateKey);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Volunteer Stats */}
            <div className="bg-white p-6 rounded-xl shadow-md col-span-full mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><User className="mr-3 text-blue-600" /> Your Contributions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
                        <p className="text-4xl font-bold text-blue-600">{totalAttendanceDays}</p>
                        <p className="text-gray-600 mt-2">Days Attended</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow-inner">
                        <p className="text-4xl font-bold text-green-600">{students.filter(s => s.volunteerId === userProfile?.uid).length}</p>
                        <p className="text-gray-600 mt-2">Students Taught</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow-inner">
                        <p className="text-4xl font-bold text-purple-600">{userProfile?.topicsCanTeach?.length || 0}</p>
                        <p className="text-gray-600 mt-2">Topics You Teach</p>
                    </div>
                </div>
            </div>

            {/* Students Taught */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><GraduationCap className="mr-3 text-blue-600" /> Students Taught</h3>
                {students.filter(s => s.volunteerId === userProfile?.uid).length > 0 ? (
                    <ul className="space-y-3">
                        {students.filter(s => s.volunteerId === userProfile?.uid).map((student, index) => (
                            <li key={student.id || index} className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
                                <User size={18} className="mr-2 text-gray-500" />
                                <span className="font-medium text-gray-700">{student.studentName}</span>
                                <span className="ml-auto text-sm text-gray-500">
                                    {student.camp} - {student.topicsTaught?.join(', ') || 'No topics'}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">No students added yet.</p>
                )}
            </div>

            {/* Attendance Calendar */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-3 text-blue-600" /> Your Attendance (Current Month)</h3>
                <div className="text-center font-bold text-lg mb-4 text-gray-700">
                    {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="font-semibold text-gray-600 p-2 border-b border-gray-200">
                            {day}
                        </div>
                    ))}
                    {calendarDates.map((day, index) => (
                        <div
                            key={index}
                            className={`p-2 rounded-md transition-all duration-150 ${day ? 'text-gray-800' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} ${isDateMarked(day) ? 'bg-blue-200 font-bold text-blue-800 ring-2 ring-blue-500 shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {day || ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Topics You Can Teach */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-full">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><BookOpen className="mr-3 text-blue-600" /> Topics You Can Teach</h3>
                {userProfile?.topicsCanTeach?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {userProfile.topicsCanTeach.map((topic, index) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium text-sm shadow-sm">
                                {topic}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No topics specified. Please contact management.</p>
                )}
            </div>
        </div>
    );
};

export default VolunteerDashboard;
