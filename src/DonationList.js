import React, { useState, useEffect } from 'react';
import DonationForm from './DonationForm';
import DonationEdit from './DonationEdit';
import DashboardLayout from './DashboardLayout';

function isAuthenticated() {
	return !!localStorage.getItem('token');
}

function DonationList() {
	const API_URL = process.env.REACT_APP_API_URL;
	const [donations, setDonations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAdd, setShowAdd] = useState(false);
	const [editId, setEditId] = useState(null);

	const fetchDonations = () => {
		setLoading(true);
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/donations`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setDonations(data);
				setLoading(false);
			})
			.catch(err => {
				setError('Failed to fetch donations');
				setLoading(false);
			});
	};

	useEffect(() => {
		if (!isAuthenticated()) {
			setError('You must be logged in to view donations.');
			setLoading(false);
			return;
		}
		fetchDonations();
	}, []);

	const [deleteSuccess, setDeleteSuccess] = useState('');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteInput, setDeleteInput] = useState('');

	const openDeleteModal = (id) => {
		console.log('openDeleteModal called with id:', id);
		setDeleteId(id);
		setDeleteInput('');
		setShowDeleteModal(true);
	};

	const closeDeleteModal = () => {
		setShowDeleteModal(false);
		setDeleteId(null);
		setDeleteInput('');
	};

	const confirmDelete = () => {
		if (deleteInput !== 'delete') {
			setError('Deletion cancelled. Type "delete" to confirm.');
			return;
		}
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/donations/${deleteId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => {
				if (res.ok) {
					setDeleteSuccess('Donation successfully deleted.');
					setError('');
					setDonations(prev => prev.filter(d => d.id !== deleteId));
					setDeleteSuccess('');
				} else {
					setError('Failed to delete donation');
				}
				closeDeleteModal();
			})
			.catch(() => {
				setError('Failed to delete donation');
				closeDeleteModal();
			});
	};


	if (loading) {
		return <div className="text-center mt-8">Loading donations...</div>;
	}

	return (
		<DashboardLayout user={null}>
			<div className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded shadow" aria-labelledby="donation-list-title">
				<h2 id="donation-list-title" className="text-2xl font-bold mb-4">Donation List</h2>
				{error && <div className="text-center mb-2 text-red-500">{error}</div>}
				{deleteSuccess && <div className="text-center mb-2 text-green-600">{deleteSuccess}</div>}
				<button className="mb-4 bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Donation">Add Donation</button>
				{showAdd && <DonationForm onSuccess={() => { setShowAdd(false); fetchDonations(); }} onCancel={() => setShowAdd(false)} />}
				{editId && <DonationEdit donationId={editId} onSuccess={() => { setEditId(null); fetchDonations(); }} onCancel={() => setEditId(null)} />}
				<table className="min-w-full border mt-4" style={{ width: '100%' }} aria-label="Donation List Table">
					<thead>
						<tr className="bg-gray-100">
							<th className="py-2 px-4 border" scope="col">Receipt Number</th>
							<th className="py-2 px-4 border" scope="col">Phone Number</th>
							<th className="py-2 px-4 border" scope="col">Transaction Date</th>
							<th className="py-2 px-4 border" scope="col">Instrument Number</th>
							<th className="py-2 px-4 border" scope="col">Donor Name</th>
							<th className="py-2 px-4 border" scope="col">Amount</th>
							<th className="py-2 px-4 border" scope="col">Scheme Name</th>
							<th className="py-2 px-4 border" scope="col">Mode Of Payment</th>
							<th className="py-2 px-4 border" scope="col">Actions</th>
						</tr>
					</thead>
					<tbody>
						{donations.map((donation, idx) => (
							<tr key={donation.id} tabIndex={0} aria-label={`Donation row ${idx + 1}`}
								className="focus:outline-none focus:ring-2 focus:ring-blue-400">
								<td className="py-2 px-4 border">{donation.receipt_number}</td>
								<td className="py-2 px-4 border">{donation.phone_number}</td>
								<td className="py-2 px-4 border">{donation.transaction_date}</td>
								<td className="py-2 px-4 border">{donation.instrument_number}</td>
								<td className="py-2 px-4 border">{donation.donor_name}</td>
								<td className="py-2 px-4 border">{donation.amount}</td>
								<td className="py-2 px-4 border">{donation.scheme_name}</td>
								<td className="py-2 px-4 border">{donation.mode_of_payment}</td>
								<td className="py-2 px-4 border">
									<div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
										<button
											className="bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-700 transition"
											aria-label={`Edit donation ${donation.id}`}
											onClick={() => setEditId(donation.id)}
										>Edit</button>
										<button
											className="bg-red-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400 hover:bg-red-700 transition"
											aria-label={`Delete donation ${donation.id}`}
											onClick={() => openDeleteModal(donation.id)}
										>Delete</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn">
						<h3 className="text-xl font-bold mb-4 text-center text-red-600">Confirm Deletion</h3>
						<p className="mb-4 text-center">Type <span className="font-mono font-bold text-red-500">delete</span> to confirm deletion of this donation.</p>
						<input
							className="border p-2 rounded w-full mb-4 focus:ring-2 focus:ring-red-400"
							value={deleteInput}
							onChange={e => setDeleteInput(e.target.value)}
							placeholder="Type 'delete' here"
							autoFocus
						/>
						<div className="flex justify-center space-x-4">
							<button
								className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
								onClick={closeDeleteModal}
							>Cancel</button>
							<button
								className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition"
								onClick={confirmDelete}
							>Delete</button>
						</div>
					</div>
				</div>
			)}
			</div>
		</DashboardLayout>
	);
}

export default DonationList;