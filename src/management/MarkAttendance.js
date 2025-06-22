// src/management/MarkAttendance.js
import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../FirebaseContext';
import LoadingSpinner from '../components/LoadingSpinner';

const MarkAttendance = ({ userProfile, allUsers, attendanceRecords }) => {
    const { db, showMessage } = useContext(FirebaseContext);
    const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCamp, setSelectedCamp] = useState('Camp 1');
    const [loading, setLoading] = useState(false);

    const volunteers = allUsers.filter(u => u.role === 'volunteer');

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!selectedVolunteerId || !selectedDate) {
            showMessage('Please select a volunteer and a date.', 'error');
            setLoading(false);
            return;
        }

        try {
            const appId = process.env.REACT_APP_APP_UNIQUE_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-ldl-portal-app';
            const attendanceRef = collection(db, `artifacts/${appId}/public/data/attendance`);
            const userProfileRef = doc(db, `artifacts/${appId}/users/${selectedVolunteerId}/userProfile`, selectedVolunteerId);

            // Check if attendance already exists for this volunteer, date, and camp
            const q = query(attendanceRef,
                where('volunteerId', '==', selectedVolunteerId),
                where('camp', '==', selectedCamp)
            );
            const querySnapshot = await getDocs(q);
            const attendanceExists = querySnapshot.docs.some(doc => {
                const docDate = new Date(doc.data().date.seconds * 1000).toISOString().split('T')[0];
                return docDate === selectedDate;
            });


            if (attendanceExists) {
                showMessage('Attendance already marked for this volunteer, date, and camp.', 'error');
                setLoading(false);
                return;
            }

            // Add new attendance record
            await addDoc(attendanceRef, {
                volunteerId: selectedVolunteerId,
                camp: selectedCamp,
                date: new Date(selectedDate),
                attendedBy: userProfile.uid,
                markedAt: new Date()
            });

            // Update volunteer's total attendance days
            const volunteerDoc = await getDoc(userProfileRef);
            if (volunteerDoc.exists()) {
                const currentAttendance = volunteerDoc.data().totalAttendanceDays || 0;
                await updateDoc(userProfileRef, {
                    totalAttendanceDays: currentAttendance + 1
                });

                // Check for referral reward
                const referredBy = volunteerDoc.data().referredBy;
                if (referredBy && (currentAttendance + 1) === 30) {
                    const referrerProfileRef = doc(db, `artifacts/${appId}/users/${referredBy}/userProfile`, referredBy);
                    const referrerDoc = await getDoc(referrerProfileRef);
                    if (referrerDoc.exists()) {
                        const referrerData = referrerDoc.data();
                        const currentReferralCount = referrerData.referralCount || 0;
                        const currentRewards = referrerData.rewards || [];
                        await updateDoc(referrerProfileRef, {
                            referralCount: currentReferralCount + 1,
                            rewards: [...currentRewards, `Referral Bonus for ${volunteerDoc.data().name} reaching 30 days attendance`]
                        });
                        showMessage(`Referral bonus awarded to ${referrerData.name}!`, 'success');
                    }
                }
            }

            showMessage('Attendance marked successfully!', 'success');
        } catch (error) {
            console.error("Error marking attendance:", error);
            showMessage('Failed to mark attendance. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg mx-auto border-r-4 border-purple-500">
            {loading && <LoadingSpinner />}
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Mark Volunteer Attendance</h3>
            <form onSubmit={handleMarkAttendance} className="space-y-6">
                <div>
                    <label htmlFor="volunteerSelect" className="block text-gray-700 text-lg font-medium mb-2">Select Volunteer</label>
                    <select
                        id="volunteerSelect"
                        value={selectedVolunteerId}
                        onChange={(e) => setSelectedVolunteerId(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm bg-white"
                    >
                        <option value="">-- Select a Volunteer --</option>
                        {volunteers.map(volunteer => (
                            <option key={volunteer.uid} value={volunteer.uid}>{volunteer.name} ({volunteer.email})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="attendanceDate" className="block text-gray-700 text-lg font-medium mb-2">Date</label>
                    <input
                        type="date"
                        id="attendanceDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="attendanceCamp" className="block text-gray-700 text-lg font-medium mb-2">Camp</label>
                    <select
                        id="attendanceCamp"
                        value={selectedCamp}
                        onChange={(e) => setSelectedCamp(e.target.value)}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg shadow-sm bg-white"
                    >
                        <option value="Camp 1">Camp 1</option>
                        <option value="Camp 2">Camp 2</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 text-xl"
                >
                    Mark Attendance
                </button>
            </form>
        </div>
    );
};

export default MarkAttendance;
