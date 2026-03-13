import React, { useEffect, useState } from 'react';
import DonorForm from './DonorForm';
import DonorEdit from './DonorEdit';
import DashboardLayout from './DashboardLayout';
import { Link } from 'react-router-dom';

function isAuthenticated() {
	return !!localStorage.getItem('token');
}

function DonorList() {
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const API_URL = process.env.REACT_APP_API_URL;
	const [donors, setDonors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editDonor, setEditDonor] = useState(null);
	const [showAdd, setShowAdd] = useState(false);
	const [deleteDonorId, setDeleteDonorId] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Utility to format date as 'DD Month yyyy'
	function formatDateDisplay(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		if (isNaN(date)) return dateString;
		const day = date.getDate().toString().padStart(2, '0');
		const month = date.toLocaleString('default', { month: 'long' });
		const year = date.getFullYear();
		return `${day} ${month} ${year}`;
	}

	useEffect(() => {
		if (!isAuthenticated()) {
			setError('You must be logged in to view donors.');
			setLoading(false);
			return;
		}
		fetchDonors();
	}, []);

	const fetchDonors = () => {
		setLoading(true);
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/donors`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setDonors(data);
				setLoading(false);
			})
			.catch(() => {
				setError('Failed to load donors');
				setLoading(false);
			});
	};

	const handleDelete = async () => {
		if (!deleteDonorId) return;
		setDeleteLoading(true);
		const token = localStorage.getItem('token');
		await fetch(`${API_URL}/api/donors/${deleteDonorId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});
		setDeleteLoading(false);
		setDeleteDonorId(null);
		setDeleteConfirmText('');
		fetchDonors();
	};

	if (loading) return <div className="text-center mt-8">Loading donors...</div>;
	if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

	return (
		<DashboardLayout user={null}>
			<div className="max-w-6xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-200" aria-labelledby="donor-list-title">
				<div className="flex items-center justify-between mb-6">
					<h2 id="donor-list-title" className="text-3xl font-extrabold text-blue-700 tracking-tight">Donor List</h2>
					<Link to="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow">Back to Dashboard</Link>
				</div>
				<button className="mb-4 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Donor">Add Donor</button>
				{showAdd && <DonorForm onSuccess={() => { setShowAdd(false); fetchDonors(); }} />}
				{editDonor && <DonorEdit donor={editDonor} onSuccess={() => { setEditDonor(null); fetchDonors(); }} onCancel={() => setEditDonor(null)} />}
				<div className="overflow-x-auto mt-6">
					<table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-sm" style={{ width: '100%' }}>
						<thead>
							<tr className="bg-blue-50 text-blue-900">
								<th className="py-3 px-5 border-b font-semibold">Name</th>
								<th className="py-3 px-5 border-b font-semibold">Email</th>
								<th className="py-3 px-5 border-b font-semibold">Phone</th>
								<th className="py-3 px-5 border-b font-semibold">DOB</th>
								<th className="py-3 px-5 border-b font-semibold">Anniversary</th>
								<th className="py-3 px-5 border-b font-semibold">PAN Card</th>
								<th className="py-3 px-5 border-b font-semibold">Cultivator</th>
								<th className="py-3 px-5 border-b font-semibold">Last Gift</th>
                                
								<th className="py-3 px-5 border-b font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{donors.map((donor, idx) => (
								<React.Fragment key={donor.id}>
									<tr className="hover:bg-blue-100 transition">
										<td className="py-3 px-5 border-b font-medium text-gray-900">{donor.name}</td>
										<td className="py-3 px-5 border-b text-gray-700">{donor.email}</td>
										<td className="py-3 px-5 border-b text-gray-700">{donor.phone}</td>
										<td className="py-3 px-5 border-b text-gray-700">{formatDateDisplay(donor.date_of_birth)}</td>
										<td className="py-3 px-5 border-b text-gray-700">{formatDateDisplay(donor.anniversary_date)}</td>
										<td className="py-3 px-5 border-b text-gray-700">{donor.pan_card || '-'}</td>
										<td className="py-3 px-5 border-b text-gray-700">{donor.cultivator_name || '-'}</td>
										<td className="py-3 px-5 border-b text-gray-700">{donor.last_gift_details || '-'}</td>
                                        
										<td className="py-3 px-5 border-b">
											<div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
												<button
													className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
													aria-label={`Edit donor ${donor.name}`}
													onClick={() => setEditDonor(donor)}
												>Edit</button>
												<button
													className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
													aria-label={`Delete donor ${donor.name}`}
													onClick={() => setDeleteDonorId(donor.id)}
												>Delete</button>
											</div>
										</td>
									</tr>
									{/* Family members row */}
									{donor.family_members && donor.family_members.length > 0 && (
										<tr>
											<td colSpan={6} className="bg-gray-50 border-b px-5 py-2">
												<div className="text-sm text-gray-700">
													<strong>Family Members:</strong>
													<ul className="ml-4 mt-2">
														{donor.family_members.map((member, i) => (
															<li key={member.id} className="mb-1">
																{member.relation === 'wife' ? 'Wife' : 'Child'}: <span className="font-semibold">{member.name}</span> (DOB: {formatDateDisplay(member.date_of_birth)})
															</li>
														))}
													</ul>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							))}
						</tbody>
					</table>
				</div>
			</div>
		{/* Delete confirmation modal */}
		{deleteDonorId && (
			<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
				<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
					<h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
					<p className="mb-4">Are you sure you want to delete this donor?</p>
					<p className="mb-2 text-gray-700">Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">delete donor</span> to confirm:</p>
					<input
						type="text"
						className="border p-2 rounded w-full mb-6"
						value={deleteConfirmText}
						onChange={e => setDeleteConfirmText(e.target.value)}
						placeholder="delete donor"
						autoFocus
					/>
					<div className="flex gap-4 justify-end">
						<button
							className="bg-red-600 text-white py-2 px-6 rounded font-semibold hover:bg-red-700 transition"
							onClick={handleDelete}
							disabled={deleteLoading || deleteConfirmText.trim().toLowerCase() !== 'delete donor'}
						>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
						<button
							className="bg-gray-400 text-white py-2 px-6 rounded font-semibold hover:bg-gray-500 transition"
							onClick={() => { setDeleteDonorId(null); setDeleteConfirmText(''); }}
						>Cancel</button>
					</div>
				</div>
			</div>
		)}
		</DashboardLayout>
	);
}

export default DonorList;