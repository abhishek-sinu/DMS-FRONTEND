import React, { useState, useEffect } from 'react';
import DonationForm from './DonationForm';
import DonationEdit from './DonationEdit';
import DashboardLayout from './DashboardLayout';
import ImportDonations from './ImportDonations';
import { downloadDonationReceipt } from './receiptTemplate';

function isAuthenticated() {
	return !!localStorage.getItem('token');
}

function formatDate(dateStr) {
	if (!dateStr) return '-';
	const d = new Date(dateStr);
	if (isNaN(d)) return '-';
	return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function DonationList() {
	const API_URL = process.env.REACT_APP_API_URL;
	const [donations, setDonations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAdd, setShowAdd] = useState(false);
	const [editId, setEditId] = useState(null);
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalRecords, setTotalRecords] = useState(0);
	const [search, setSearch] = useState('');
	const [donorCache, setDonorCache] = useState({});
	const [templeSettings, setTempleSettings] = useState(null);

	const fetchDonations = () => {
		setLoading(true);
		const token = localStorage.getItem('token');
		const params = new URLSearchParams({
			paginated: '1',
			page: String(currentPage),
			limit: String(pageSize),
		});
		if (search) params.set('search', search);

		fetch(`${API_URL}/api/donations?${params.toString()}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setDonations(Array.isArray(data?.items) ? data.items : []);
				setTotalPages(Math.max(1, data?.pagination?.totalPages || 1));
				setTotalRecords(data?.pagination?.total || 0);
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
	}, [currentPage, pageSize, search]);

	// Load temple settings once so receipts use the saved temple details
	useEffect(() => {
		if (!isAuthenticated()) return;
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/temple-settings`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => setTempleSettings(data && data.data ? data.data : null))
			.catch(() => setTempleSettings(null));
	}, [API_URL]);

	const handleDownloadReceipt = async (donation) => {
		const normalize = (p) => (p ? String(p).replace(/\D/g, '') : '');
		const phoneKey = normalize(donation.phone_number);
		let donor = donorCache[phoneKey] || null;
		if (!donor && phoneKey) {
			const token = localStorage.getItem('token');
			try {
				const res = await fetch(`${API_URL}/api/donors/by-phone/${encodeURIComponent(phoneKey)}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (res.ok) {
					donor = await res.json();
					setDonorCache(prev => ({ ...prev, [phoneKey]: donor }));
				}
			} catch (_) {
				donor = null;
			}
		}
		downloadDonationReceipt(donation, donor, templeSettings);
	};

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


	const filteredDonations = donations;

	return (
		<DashboardLayout user={null}>
			<div className="max-w-6xl mx-auto mt-4 sm:mt-8 bg-white p-4 sm:p-6 rounded shadow" aria-labelledby="donation-list-title">
				<h2 id="donation-list-title" className="text-2xl font-bold mb-4">Donation List</h2>
				{error && <div className="text-center mb-2 text-red-500">{error}</div>}
				{deleteSuccess && <div className="text-center mb-2 text-green-600">{deleteSuccess}</div>}
				<div className="flex items-center gap-2 mb-4 flex-wrap">
					<button className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Donation">Add Donation</button>
					<input
						type="text"
						placeholder="Search by receipt no, phone, donor, scheme..."
						value={search}
						onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
						className="border rounded px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
					/>
					<div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 sm:justify-end">
						<label className="text-sm font-semibold text-gray-600">Show:</label>
						<select
							value={pageSize}
							onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
							className="border rounded px-2 py-1 text-sm"
						>
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={30}>30</option>
							<option value={50}>50</option>
							<option value={200}>200</option>
						</select>
						<span className="text-sm text-gray-500">per page</span>
					</div>
				</div>
				<div className="mb-4">
					<ImportDonations onImport={fetchDonations} />
				</div>
				{showAdd && <DonationForm onSuccess={() => { setShowAdd(false); fetchDonations(); }} onCancel={() => setShowAdd(false)} />}
				{editId && <DonationEdit donationId={editId} onSuccess={() => { setEditId(null); fetchDonations(); }} onCancel={() => setEditId(null)} />}
				{loading && (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="relative w-16 h-16">
							<div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
							<div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
							<div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}></div>
						</div>
						<p className="text-blue-700 font-semibold text-base tracking-wide animate-pulse">Loading donations...</p>
					</div>
				)}
				{!loading && <div className="overflow-x-auto mt-4">
				<table className="min-w-[1050px] border w-full" style={{ width: '100%' }} aria-label="Donation List Table">
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
						{filteredDonations.map((donation, idx) => (
							<tr key={donation.id} tabIndex={0} aria-label={`Donation row ${(currentPage - 1) * pageSize + idx + 1}`}
								className="focus:outline-none focus:ring-2 focus:ring-blue-400">
								<td className="py-2 px-4 border">{donation.receipt_number}</td>
								<td className="py-2 px-4 border">{donation.phone_number}</td>
								<td className="py-2 px-4 border">{formatDate(donation.transaction_date)}</td>
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
											className="bg-amber-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 hover:bg-amber-700 transition"
											aria-label={`Download receipt for donation ${donation.id}`}
											onClick={() => handleDownloadReceipt(donation)}
										>Receipt</button>
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
				</div>}

				{/* Pagination Controls */}
				{totalRecords > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
						<span className="text-sm text-gray-600">
							Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
						</span>
						<div className="flex gap-1 flex-wrap">
							<button
								disabled={currentPage === 1}
								onClick={() => setCurrentPage(1)}
								className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition"
							>First</button>
							<button
								disabled={currentPage === 1}
								onClick={() => setCurrentPage(p => p - 1)}
								className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition"
							>Prev</button>
								{(() => {
									const totalPagesLocal = totalPages;
									const windowSize = 10;
									let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
									let end = Math.min(totalPagesLocal, start + windowSize - 1);
									if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
									return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`px-3 py-1 rounded border text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
										>{page}</button>
									));
								})()}
							<button
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage(p => p + 1)}
								className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition"
							>Next</button>
							<button
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage(totalPages)}
								className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition"
							>Last</button>
						</div>
					</div>
				)}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md mx-4 animate-fadeIn">
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