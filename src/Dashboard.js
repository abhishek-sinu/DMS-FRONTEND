import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
function Dashboard() {
	const API_URL = process.env.REACT_APP_API_URL;
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [modalType, setModalType] = useState(null);
	const [modalData, setModalData] = useState([]);
	const [modalLoading, setModalLoading] = useState(false);
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [donorDetails, setDonorDetails] = useState(null);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (token) {
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				setUser(payload);
			} catch {
				setUser(null);
			}
			// Fetch live dashboard stats
			fetch(`${API_URL}/api/dashboard/stats`, {
				headers: { Authorization: `Bearer ${token}` }
			})
				.then(res => res.json())
				.then(data => { setStats(data); setLoading(false); })
				.catch(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, []);

	if (!user) {
		return <div className="min-h-screen flex items-center justify-center text-xl">Not logged in</div>;
	}

	const openModal = (type) => {
		setModalType(type);
		setDetailsModalOpen(false);
		setDonorDetails(null);
		setModalLoading(true);
		const token = localStorage.getItem('token');
		const endpoint = type === 'birthdays' ? 'upcoming-birthdays' : 'upcoming-anniversaries';
		fetch(`${API_URL}/api/dashboard/${endpoint}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => { setModalData(Array.isArray(data) ? data : []); setModalLoading(false); })
			.catch(() => { setModalData([]); setModalLoading(false); });
	};

	const openDonorDetails = (donorId) => {
		if (!donorId) return;
		setDetailsModalOpen(true);
		setDetailsLoading(true);
		setDonorDetails(null);
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/donors/${donorId}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => { setDonorDetails(data); setDetailsLoading(false); })
			.catch(() => { setDetailsLoading(false); });
	};

	return (
		<DashboardLayout user={user}>
			{/* Welcome Banner */}
			<div className="mb-8 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
				<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5"></div>
				<div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5"></div>
				<div className="relative z-10">
					<div className="flex items-center gap-3 mb-2">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
							{(user.username || 'U')[0].toUpperCase()}
						</div>
						<div>
							<h1 className="text-2xl font-bold">Welcome back, {user.username}!</h1>
							<p className="text-blue-200 text-sm">Manage donors, donations, cultivators and gifts from your dashboard.</p>
						</div>
					</div>
				</div>
				{/* Marquee */}
				<div className="mt-5 overflow-hidden rounded-xl bg-white/10 py-2.5 px-4 backdrop-blur-sm border border-white/10">
					<div className="animate-marquee whitespace-nowrap text-amber-200 font-semibold text-sm tracking-wide">
						🪷 Hare Kṛṣṇa Hare Kṛṣṇa Kṛṣṇa Kṛṣṇa Hare Hare &nbsp;|&nbsp; Hare Rāma Hare Rāma Rāma Rāma Hare Hare 🪷
						&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
						🪷 Hare Kṛṣṇa Hare Kṛṣṇa Kṛṣṇa Kṛṣṇa Hare Hare &nbsp;|&nbsp; Hare Rāma Hare Rāma Rāma Rāma Hare Hare 🪷
					</div>
					<style>{`
						@keyframes marquee {
							0% { transform: translateX(0%); }
							100% { transform: translateX(-50%); }
						}
						.animate-marquee {
							display: inline-block;
							animation: marquee 18s linear infinite;
						}
					`}</style>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="flex flex-col items-center gap-3">
						<svg className="animate-spin w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
						<span className="text-gray-400 font-medium">Loading dashboard...</span>
					</div>
				</div>
			) : !stats ? (
				<div className="text-center text-red-500 py-8 bg-red-50 rounded-xl border border-red-200">Failed to load dashboard data.</div>
			) : (
				<>
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
						<div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center gap-4 border border-gray-100 group cursor-pointer" onClick={() => navigate('/donors')}>
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							</div>
							<div>
								<span className="text-3xl font-extrabold text-gray-800">{stats.totalDonors}</span>
								<p className="text-sm text-gray-500 font-medium mt-0.5">Total Donors</p>
							</div>
						</div>
						<div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center gap-4 border border-gray-100 group cursor-pointer" onClick={() => navigate('/donations')}>
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6M9 10h6M12 17l-3-4h4.5a2.5 2.5 0 000-5" /></svg>
							</div>
							<div>
								<span className="text-xl font-extrabold text-gray-800 block max-w-[160px] truncate" title={stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}>
									₹{stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</span>
								<p className="text-sm text-gray-500 font-medium mt-0.5">Total Donations</p>
							</div>
						</div>
						<div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center gap-4 border border-gray-100 group cursor-pointer" onClick={() => navigate('/donations')}>
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
							</div>
							<div>
								<span className="text-3xl font-extrabold text-gray-800">{stats.totalRecords}</span>
								<p className="text-sm text-gray-500 font-medium mt-0.5">Donation Records</p>
							</div>
						</div>
						<div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex items-center gap-4 border border-gray-100 group cursor-pointer" onClick={() => navigate('/cultivators')}>
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
							</div>
							<div>
								<span className="text-3xl font-extrabold text-gray-800">{stats.totalCultivators}</span>
								<p className="text-sm text-gray-500 font-medium mt-0.5">Total Cultivators</p>
							</div>
						</div>
					</div>

					{/* Engagement Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-blue-100" onClick={() => openModal('birthdays')}>
							<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
								<span className="text-3xl">🎂</span>
							</div>
							<div className="flex-1">
								<span className="text-4xl font-extrabold text-blue-700">{stats.upcomingBirthdays}</span>
								<p className="text-gray-600 font-medium mt-1">Upcoming Birthdays (30 days)</p>
								<span className="text-xs text-blue-500 font-semibold mt-1 inline-flex items-center gap-1">
									View details
									<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
								</span>
							</div>
						</div>
						<div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-md p-6 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-pink-100" onClick={() => openModal('anniversaries')}>
							<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
								<span className="text-3xl">💍</span>
							</div>
							<div className="flex-1">
								<span className="text-4xl font-extrabold text-pink-700">{stats.upcomingAnniversaries}</span>
								<p className="text-gray-600 font-medium mt-1">Upcoming Anniversaries (30 days)</p>
								<span className="text-xs text-pink-500 font-semibold mt-1 inline-flex items-center gap-1">
									View details
									<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
								</span>
							</div>
						</div>
					</div>

					{/* Recent Donations - Full Width */}
					<div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8">
						<div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
							<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							<h3 className="text-lg font-bold text-gray-800">Recent Donations</h3>
						</div>
						<div className="p-5">
							{stats.recentDonations && stats.recentDonations.length > 0 ? (
								<table className="w-full text-sm">
									<thead>
										<tr className="text-gray-500 text-xs uppercase tracking-wider">
											<th className="px-3 py-2 text-left">Donor</th>
											<th className="px-3 py-2 text-right">Amount</th>
											<th className="px-3 py-2 text-left">Date</th>
											<th className="px-3 py-2 text-left">Mode</th>
										</tr>
									</thead>
									<tbody>
										{stats.recentDonations.map((d, i) => (
											<tr key={i} className="border-t border-gray-50 hover:bg-emerald-50/50 transition">
												<td className="px-3 py-3 font-medium text-gray-800">{d.donor_name || '-'}</td>
												<td className="px-3 py-3 text-right font-bold text-emerald-600">₹{parseFloat(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
												<td className="px-3 py-3 text-gray-500">{d.transaction_date ? new Date(d.transaction_date).toLocaleDateString('en-IN') : '-'}</td>
												<td className="px-3 py-3">
													<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">{d.mode_of_payment || '-'}</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<div className="text-gray-400 text-center py-6">No data</div>
							)}
						</div>
					</div>
				</>
			)}

			{/* Birthday / Anniversary Modal */}
			{modalType && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-lg max-h-[80vh] overflow-hidden">
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: modalType === 'birthdays' ? 'linear-gradient(135deg, #eff6ff, #eef2ff)' : 'linear-gradient(135deg, #fdf2f8, #fce7f3)' }}>
							<h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
								<span className="text-2xl">{modalType === 'birthdays' ? '🎂' : '💍'}</span>
								{modalType === 'birthdays' ? 'Upcoming Birthdays' : 'Upcoming Anniversaries'}
							</h3>
							<button onClick={() => setModalType(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition">&times;</button>
						</div>
						<div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
							{modalLoading ? (
								<div className="flex items-center justify-center py-10">
									<svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
								</div>
							) : modalData.length === 0 ? (
								<div className="text-center text-gray-400 py-10">No upcoming {modalType} in the next 30 days.</div>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="text-gray-500 text-xs uppercase tracking-wider">
											<th className="px-3 py-2 text-left">#</th>
											{modalType === 'birthdays' ? (
												<>
													<th className="px-3 py-2 text-left">Donor</th>
													<th className="px-3 py-2 text-left">Family Member</th>
													<th className="px-3 py-2 text-left">Relation</th>
													<th className="px-3 py-2 text-left">Phone</th>
													<th className="px-3 py-2 text-left">DOB</th>
													<th className="px-3 py-2 text-left">Action</th>
												</>
											) : (
												<>
													<th className="px-3 py-2 text-left">Name</th>
													<th className="px-3 py-2 text-left">Phone</th>
													<th className="px-3 py-2 text-left">Anniversary</th>
													<th className="px-3 py-2 text-left">Action</th>
												</>
											)}
										</tr>
									</thead>
									<tbody>
										{modalData.map((d, i) => (
											<tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition">
												<td className="px-3 py-3">{i + 1}</td>
												{modalType === 'birthdays' ? (
													<>
														<td className="px-3 py-3 font-medium text-gray-800">{d.donor_name || '-'}</td>
														<td className="px-3 py-3 text-gray-700">{d.person_type === 'family' ? (d.person_name || '-') : '-'}</td>
														<td className="px-3 py-3 text-gray-500 capitalize">{d.person_type === 'family' ? (d.relationship || '-') : '-'}</td>
														<td className="px-3 py-3 text-gray-500">{d.phone || '-'}</td>
														<td className="px-3 py-3">{d.birthday ? new Date(d.birthday).toLocaleDateString('en-IN') : '-'}</td>
														<td className="px-3 py-3">
															<button
																onClick={() => openDonorDetails(d.donor_id)}
																className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
															>
																View
															</button>
														</td>
													</>
												) : (
													<>
														<td className="px-3 py-3 font-medium text-gray-800">{d.name}</td>
														<td className="px-3 py-3 text-gray-500">{d.phone || '-'}</td>
														<td className="px-3 py-3">{d.anniversary_date ? new Date(d.anniversary_date).toLocaleDateString('en-IN') : '-'}</td>
														<td className="px-3 py-3">
															<button
																onClick={() => openDonorDetails(d.donor_id)}
																className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
															>
																View
															</button>
														</td>
													</>
												)}
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
				</div>
			)}

				{detailsModalOpen && (
					<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
						<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-50">
								<h3 className="text-lg font-bold text-gray-800">Donor Complete Details</h3>
								<button onClick={() => setDetailsModalOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition">&times;</button>
							</div>
							<div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 64px)' }}>
								{detailsLoading ? (
									<div className="text-center text-gray-500 py-8">Loading details...</div>
								) : !donorDetails ? (
									<div className="text-center text-red-500 py-8">Failed to load donor details.</div>
								) : (
									<>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
											<div><span className="font-semibold text-gray-600">Name:</span> <span className="text-gray-800">{donorDetails.name || '-'}</span></div>
											<div><span className="font-semibold text-gray-600">Phone:</span> <span className="text-gray-800">{donorDetails.phone || '-'}</span></div>
											<div><span className="font-semibold text-gray-600">Email:</span> <span className="text-gray-800">{donorDetails.email || '-'}</span></div>
											<div><span className="font-semibold text-gray-600">Date of Birth:</span> <span className="text-gray-800">{donorDetails.date_of_birth ? new Date(donorDetails.date_of_birth).toLocaleDateString('en-IN') : '-'}</span></div>
											<div><span className="font-semibold text-gray-600">Anniversary:</span> <span className="text-gray-800">{donorDetails.anniversary_date ? new Date(donorDetails.anniversary_date).toLocaleDateString('en-IN') : '-'}</span></div>
											<div><span className="font-semibold text-gray-600">Address:</span> <span className="text-gray-800">{donorDetails.address || '-'}</span></div>
										</div>

										<div>
											<h4 className="text-base font-bold text-gray-800 mb-3">Family Members</h4>
											{Array.isArray(donorDetails.family_members) && donorDetails.family_members.length > 0 ? (
												<table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
													<thead className="bg-gray-50">
														<tr>
															<th className="px-3 py-2 text-left">Name</th>
															<th className="px-3 py-2 text-left">Relation</th>
															<th className="px-3 py-2 text-left">DOB</th>
														</tr>
													</thead>
													<tbody>
														{donorDetails.family_members.map(member => (
															<tr key={member.id} className="border-t border-gray-100">
																<td className="px-3 py-2">{member.name || '-'}</td>
																<td className="px-3 py-2 capitalize">{member.relation || '-'}</td>
																<td className="px-3 py-2">{member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('en-IN') : '-'}</td>
															</tr>
														))}
													</tbody>
												</table>
											) : (
												<div className="text-sm text-gray-500">No family members added.</div>
											)}
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				)}
		</DashboardLayout>
	);
}

export default Dashboard;