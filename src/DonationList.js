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

	const handleDelete = (id) => {
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/donations/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => {
				if (res.ok) {
					fetchDonations();
				} else {
					setError('Failed to delete donation');
				}
			})
			.catch(() => setError('Failed to delete donation'));
	};

	if (loading) {
		return <div className="text-center mt-8">Loading donations...</div>;
	}

	if (error) {
		return <div className="text-center mt-8 text-red-500">{error}</div>;
	}

	return (
		   <DashboardLayout user={null}>
			   <div className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded shadow" aria-labelledby="donation-list-title">
				<h2 id="donation-list-title" className="text-2xl font-bold mb-4">Donation List</h2>
				<button className="mb-4 bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Donation">Add Donation</button>
				{showAdd && <DonationForm onSuccess={() => { setShowAdd(false); fetchDonations(); }} />}
				{editId && <DonationEdit donationId={editId} onSuccess={() => { setEditId(null); fetchDonations(); }} onCancel={() => setEditId(null)} />}
				   <table className="min-w-full border mt-4" style={{ width: '100%' }} aria-label="Donation List Table">
					<thead>
						<tr className="bg-gray-100">
							<th className="py-2 px-4 border" scope="col">Donor ID</th>
							<th className="py-2 px-4 border" scope="col">Amount</th>
							<th className="py-2 px-4 border" scope="col">Date</th>
							<th className="py-2 px-4 border" scope="col">Type</th>
							<th className="py-2 px-4 border" scope="col">Purpose</th>
							<th className="py-2 px-4 border" scope="col">Receipt</th>
							<th className="py-2 px-4 border" scope="col">Actions</th>
						</tr>
					</thead>
					<tbody>
						{donations.map((donation, idx) => (
							<tr key={donation.id} tabIndex={0} aria-label={`Donation row ${idx + 1}`}
								className="focus:outline-none focus:ring-2 focus:ring-blue-400">
								<td className="py-2 px-4 border">{donation.donor_id}</td>
								<td className="py-2 px-4 border">{donation.amount}</td>
								<td className="py-2 px-4 border">{donation.donation_date}</td>
								<td className="py-2 px-4 border">{donation.donation_type}</td>
								<td className="py-2 px-4 border">{donation.purpose}</td>
								<td className="py-2 px-4 border">{donation.receipt_number}</td>
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
											   onClick={() => handleDelete(donation.id)}
										   >Delete</button>
									   </div>
								   </td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</DashboardLayout>
	);
}

export default DonationList;