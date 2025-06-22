// src/shared/Leaderboard.js
import React from 'react';
import { Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Leaderboard = ({ allUsers }) => {
    // Filter for volunteers and sort by totalAttendanceDays in descending order
    const sortedVolunteers = [...allUsers]
        .filter(user => user.role === 'volunteer')
        .sort((a, b) => (b.totalAttendanceDays || 0) - (a.totalAttendanceDays || 0));

    return (
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center flex items-center justify-center">
                <Award className="mr-3 text-blue-600" /> Volunteer Leaderboard
            </h3>

            {sortedVolunteers.length > 0 ? (
                <>
                    <div className="mb-8">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={sortedVolunteers.slice(0, 10)} // Show top 10 in chart
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis dataKey="name" tick={{ fill: '#4B5563' }} />
                                <YAxis tick={{ fill: '#4B5563' }} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }} />
                                <Bar dataKey="totalAttendanceDays" fill="#3B82F6" barSize={30} radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        {sortedVolunteers.map((volunteer, index) => (
                            <div
                                key={volunteer.uid}
                                className={`flex items-center p-4 rounded-lg shadow-sm ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : index === 1 ? 'bg-gray-100 border-2 border-gray-300' : index === 2 ? 'bg-amber-100 border-2 border-amber-300' : 'bg-gray-50'}`}
                            >
                                <span className="font-bold text-lg w-8 flex-shrink-0">
                                    {index + 1}.
                                </span>
                                <div className="ml-4 flex-grow">
                                    <p className="font-semibold text-gray-800 text-lg">{volunteer.name}</p>
                                    <p className="text-sm text-gray-600">{volunteer.email}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xl font-bold text-blue-600">{volunteer.totalAttendanceDays || 0} Days</p>
                                    {index < 3 && (
                                        <p className="text-xs font-medium mt-1">
                                            {index === 0 && <span className="text-yellow-600">🏆 Gold Reward!</span>}
                                            {index === 1 && <span className="text-gray-600">🥈 Silver Reward!</span>}
                                            {index === 2 && <span className="text-amber-600">🥉 Bronze Reward!</span>}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-gray-500 italic text-center">No volunteer data available yet.</p>
            )}
        </div>
    );
};

export default Leaderboard;
