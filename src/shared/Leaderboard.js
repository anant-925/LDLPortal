import React, { useEffect } from 'react';
import { Award, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Leaderboard = ({ allUsers }) => {

    // Log the allUsers prop received by the Leaderboard component
    useEffect(() => {
        console.log("Leaderboard: allUsers prop received:", allUsers);
        // Also log specific details about each user in allUsers to check totalAttendanceDays
        allUsers.forEach(user => {
            console.log(`  Leaderboard User: ${user.name || user.email || user.uid}, Role: ${user.role}, Total Attendance Days: ${user.totalAttendanceDays}`);
        });
    }, [allUsers]); // This useEffect will run whenever allUsers changes

    // Filter for volunteers and sort by totalAttendanceDays (descending)
    // If totalAttendanceDays are equal, sort by name (ascending)
    const sortedVolunteers = [...allUsers]
        .filter(user => user.role === 'volunteer')
        .sort((a, b) => {
            const attendanceA = a.totalAttendanceDays || 0;
            const attendanceB = b.totalAttendanceDays || 0;

            if (attendanceB !== attendanceA) {
                return attendanceB - attendanceA; // Sort by attendance descending
            }
            return (a.name || '').localeCompare(b.name || ''); // Then by name ascending
        });

    // Prepare data for the chart - Top 10 volunteers
    const chartData = sortedVolunteers.slice(0, 10).map(user => ({
        name: user.name || user.email || 'N/A',
        "Days Attended": user.totalAttendanceDays || 0
    }));

    // Determine rank badge based on position in sorted list
    const getRankBadge = (index) => {
        if (index === 0) return 'Gold Elite!';
        if (index === 1) return 'Silver Achiever!';
        if (index === 2) return 'Bronze Star!';
        return '';
    };

    const getCardColors = (index) => {
        if (index === 0) return 'from-amber-400 to-amber-600'; // Gold
        if (index === 1) return 'from-gray-300 to-gray-500'; // Silver
        if (index === 2) return 'from-orange-300 to-orange-500'; // Bronze
        return 'from-white to-gray-50'; // Default - changed to provide a light background
    };

    const getTextColorForDays = (index) => {
        // Use a dark color that's visible on the lighter backgrounds
        // and also stands out on the gradient ones if needed.
        if (index === 0) return 'text-blue-900'; // Darker blue for Gold
        if (index === 1) return 'text-blue-800'; // Darker blue for Silver
        if (index === 2) return 'text-blue-700'; // Darker blue for Bronze
        return 'text-gray-800'; // Dark gray for default white/gray background
    };

    return (
        <div className="p-8 bg-white rounded-2xl shadow-xl w-full mx-auto border-l-4 border-yellow-500">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 flex items-center justify-center">
                <Award className="mr-4 text-yellow-500" size={32} /> Volunteer Leaderboard
            </h2>

            {sortedVolunteers.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                    <p className="text-gray-600 text-xl font-medium">No volunteers found or no attendance recorded yet.</p>
                    <p className="text-gray-500 mt-2">Check back later or ensure volunteers have logged attendance.</p>
                </div>
            ) : (
                <>
                    {/* Bar Chart for Top 10 */}
                    {chartData.length > 0 && (
                        <div className="mb-10 p-6 bg-gray-50 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Top 10 Volunteers (Days Attended)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="name" stroke="#555" />
                                    <YAxis stroke="#555" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
                                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#555' }}
                                    />
                                    <Bar dataKey="Days Attended" fill="#8884d8" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="space-y-4">
                        {sortedVolunteers.map((user, index) => (
                            <div
                                key={user.uid}
                                className={`flex items-center p-6 rounded-2xl shadow-lg border border-gray-200
                                bg-gradient-to-r ${getCardColors(index)} transform hover:scale-[1.01] transition-transform duration-200 ease-out`}
                            >
                                <span className="text-3xl font-extrabold text-gray-800 mr-6 w-10 text-center">
                                    {index + 1}.
                                </span>
                                <div className="flex-grow">
                                    <p className="text-xl font-bold text-gray-900">{user.name || 'N/A'}</p>
                                    <p className="text-md text-gray-700">{user.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-3xl font-extrabold ${getTextColorForDays(index)}`}> {/* Applied new text color class here */}
                                        {user.totalAttendanceDays || 0} Days
                                    </p>
                                    <p className="text-lg font-semibold text-gray-700"> {/* Changed badge text to darker for visibility */}
                                        {getRankBadge(index)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaderboard;
