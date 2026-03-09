import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
function Dashboard() {
	const [user, setUser] = useState(null);
	// Example stats, replace with real API calls
	const [stats, setStats] = useState({
		donors: 120,
		donations: 350,
		totalAmount: 125000,
		birthdays: 5,
		anniversaries: 2,
		milestones: 3,
	});

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (token) {
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				setUser(payload);
			} catch {
				setUser(null);
			}
		}
	}, []);

	if (!user) {
		return <div className="min-h-screen flex items-center justify-center text-xl">Not logged in</div>;
	}

	return (
		<DashboardLayout user={user}>
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-blue-700">Welcome, {user.username}!</h1>
				<p className="text-lg text-gray-600">Manage donors, donations, and engagement activities from your dashboard.</p>
			</div>
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
				<div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-2xl font-bold text-blue-700">{stats.donors}</span>
					<span className="text-gray-600 mt-2">Total Donors</span>
				</div>
				<div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-2xl font-bold text-green-700">₹{stats.totalAmount.toLocaleString()}</span>
					<span className="text-gray-600 mt-2">Total Donations</span>
				</div>
				<div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-2xl font-bold text-purple-700">{stats.donations}</span>
					<span className="text-gray-600 mt-2">Donation Records</span>
				</div>
			</div>
			{/* Engagement & Alerts */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-blue-100 rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-xl font-bold text-blue-700">{stats.birthdays}</span>
					<span className="text-gray-700 mt-2">Upcoming Birthdays</span>
				</div>
				<div className="bg-pink-100 rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-xl font-bold text-pink-700">{stats.anniversaries}</span>
					<span className="text-gray-700 mt-2">Upcoming Anniversaries</span>
				</div>
				<div className="bg-yellow-100 rounded-xl shadow p-6 flex flex-col items-center">
					<span className="text-xl font-bold text-yellow-700">{stats.milestones}</span>
					<span className="text-gray-700 mt-2">Donor Milestones</span>
				</div>
			</div>
		</DashboardLayout>
	);
}

export default Dashboard;