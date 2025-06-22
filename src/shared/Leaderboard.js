// src/shared/Leaderboard.js
import React from 'react';
import { Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Leaderboard = ({ allUsers }) => {
    // Filter for volunteers and sort by totalAttendanceDays in descending order
    const sortedVolunteers = [...allUsers]
        .filter(user => user.role === 'volunteer')
        .sort((a, b) => (b.totalAttendanceDays || 0) - (a.totalAttendanceDays || 0));

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-4xl mx-auto border-b-4 border-amber-500">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center">
                <Award className="mr-3 text-amber-600" size={32} /> Elite Volunteer Leaderboard
            </h3>

            {sortedVolunteers.length > 0 ? (
                <>
                    <div className="mb-10 p-4 bg-gray-50 rounded-xl shadow-inner">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Top 10 Attendance Overview</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={sortedVolunteers.slice(0, 10)} // Show top 10 in chart
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="name" tick={{ fill: '#4B5563', fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} label={{ value: 'Days Attended', angle: -90, position: 'insideLeft', fill: '#4B5563' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '10px' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#333' }}
                                    itemStyle={{ color: '#3B82F6' }}
                                    formatter={(value) => [`${value} Days`, 'Attendance']}
                                />
                                <Bar dataKey="totalAttendanceDays" fill="#3B82F6" barSize={40} radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-5">
                        {sortedVolunteers.map((volunteer, index) => (
                            <div
                                key={volunteer.uid}
                                className={`flex items-center p-5 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.01]
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-4 border-yellow-300 shadow-2xl' :
                                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-4 border-gray-200 shadow-xl' :
                                      index === 2 ? 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 border-4 border-amber-100 shadow-lg' :
                                      'bg-gray-100 border border-gray-200 text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                <span className={`font-extrabold text-2xl w-12 flex-shrink-0 text-center ${index < 3 ? 'text-shadow-md' : ''}`}>
                                    {index + 1}.
                                </span>
                                <div className="ml-5 flex-grow">
                                    <p className="font-bold text-xl leading-tight">{volunteer.name}</p>
                                    <p className={`text-sm ${index < 3 ? 'text-white text-opacity-80' : 'text-gray-600'}`}>{volunteer.email}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className={`text-3xl font-extrabold ${index < 3 ? 'text-white' : 'text-blue-700'}`}>{volunteer.totalAttendanceDays || 0} Days</p>
                                    {index < 3 && (
                                        <p className="text-base font-semibold mt-1">
                                            {index === 0 && <span className="text-yellow-200">🏆 Gold Elite!</span>}
                                            {index === 1 && <span className="text-gray-100">🥈 Silver Achiever!</span>}
                                            {index === 2 && <span className="text-amber-100">🥉 Bronze Star!</span>}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-gray-500 italic text-center p-8 bg-gray-50 rounded-xl">No volunteer data available yet. Encourage sign-ups and attendance!</p>
            )}
        </div>
    );
};

export default Leaderboard;
