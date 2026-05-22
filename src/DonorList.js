import React, { useEffect, useState } from 'react';
import DonorForm from './DonorForm';
import DonorEdit from './DonorEdit';
import DashboardLayout from './DashboardLayout';
import ImportDonors from './ImportDonors';
import { Link } from 'react-router-dom';

function isAuthenticated() {
	return !!localStorage.getItem('token');
}

function DonorList() {
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const API_URL = process.env.REACT_APP_API_URL;
	const [donors, setDonors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [initialLoad, setInitialLoad] = useState(true);
	const [error, setError] = useState('');
	const [editDonor, setEditDonor] = useState(null);
	const [showAdd, setShowAdd] = useState(false);
	const [deleteDonorId, setDeleteDonorId] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [search, setSearch] = useState('');

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
				setInitialLoad(false);
			})
			.catch(() => {
				setError('Failed to load donors');
				setLoading(false);
				setInitialLoad(false);
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

	if (loading && initialLoad) return <div className="text-center mt-8">Loading donors...</div>;
	if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

	const filteredDonors = search
		? donors.filter(d => ['name', 'email', 'phone', 'pan_card'].some(k => d[k] && d[k].toString().toLowerCase().includes(search.toLowerCase())))
		: donors;

	return (
		<DashboardLayout user={null}>
			<div className="max-w-full mx-auto mt-4 sm:mt-10 bg-white p-4 sm:p-8 rounded-xl shadow-lg border border-gray-200" aria-labelledby="donor-list-title">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
					<h2 id="donor-list-title" className="text-3xl font-extrabold text-blue-700 tracking-tight">Donor List</h2>
					<Link to="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow text-center">Back to Dashboard</Link>
				</div>
				<div className="flex items-center gap-2 mb-4 flex-wrap">
					<button className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Donor">Add Donor</button>
					<input
						type="text"
						placeholder="Search by name, email, phone, PAN..."
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
							<option value={donors.length}>All</option>
						</select>
						<span className="text-sm text-gray-500">per page</span>
					</div>
				</div>
				<div className="mb-4">
					<ImportDonors onImport={fetchDonors} />
				</div>
				{showAdd && <DonorForm onSuccess={() => { setShowAdd(false); fetchDonors(); }} />}
				{editDonor && <DonorEdit donor={editDonor} onSuccess={() => { setEditDonor(null); fetchDonors(); }} onCancel={() => setEditDonor(null)} />}
				<div className="overflow-x-auto mt-6">
					<table className="min-w-[980px] w-full border border-gray-300 rounded-lg shadow-sm text-sm" style={{ width: '100%' }}>
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
							{filteredDonors.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((donor, idx) => (
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
											<div className="flex flex-wrap gap-2 justify-center items-center">
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
											<td colSpan={9} className="bg-gray-50 border-b px-5 py-2">
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
				{/* Pagination Controls */}
				{filteredDonors.length > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
						<span className="text-sm text-gray-600">
							Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredDonors.length)} of {filteredDonors.length}
						</span>
						<div className="flex gap-1 flex-wrap">
							<button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">First</button>
							<button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Prev</button>
							{(() => {
								const totalPages = Math.ceil(filteredDonors.length / pageSize);
								const windowSize = 10;
								let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
								let end = Math.min(totalPages, start + windowSize - 1);
								if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
								return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
									<button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>{page}</button>
								));
							})()}
							<button disabled={currentPage === Math.ceil(filteredDonors.length / pageSize)} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Next</button>
							<button disabled={currentPage === Math.ceil(filteredDonors.length / pageSize)} onClick={() => setCurrentPage(Math.ceil(filteredDonors.length / pageSize))} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Last</button>
						</div>
					</div>
				)}
			</div>
		{/* Delete confirmation modal */}
		{deleteDonorId && (
			<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
				<div className="bg-white p-5 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-4 relative">
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