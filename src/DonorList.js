import React, { useEffect, useState } from 'react';
import DonorForm from './DonorForm';
import DonorEdit from './DonorEdit';
import DashboardLayout from './DashboardLayout';
import ImportDonors from './ImportDonors';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

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
	const [totalPages, setTotalPages] = useState(1);
	const [totalRecords, setTotalRecords] = useState(0);
	const [search, setSearch] = useState('');
	const [dobFrom, setDobFrom] = useState('');
	const [dobTo, setDobTo] = useState('');
	const [anniversaryFrom, setAnniversaryFrom] = useState('');
	const [anniversaryTo, setAnniversaryTo] = useState('');
	const [exportingPdf, setExportingPdf] = useState(false);

	// Compare month-day only (ignores year) for birthday/anniversary filters
	// Parse month number (1-12) from "YYYY-MM" (month input) or full date string
	function getMonthNum(dateStr) {
		if (!dateStr) return null;
		if (/^\d{4}-\d{2}$/.test(dateStr)) return parseInt(dateStr.split('-')[1], 10);
		const d = new Date(dateStr);
		if (isNaN(d)) return null;
		return d.getMonth() + 1;
	}

	// Utility to format date as DD-MM-YYYY
	function formatDateDisplay(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		if (isNaN(date)) return dateString;
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	}

	useEffect(() => {
		if (!isAuthenticated()) {
			setError('You must be logged in to view donors.');
			setLoading(false);
			return;
		}
		fetchDonors();
	}, [currentPage, pageSize, search, dobFrom, dobTo, anniversaryFrom, anniversaryTo]);

	const fetchDonors = () => {
		setLoading(true);
		const token = localStorage.getItem('token');
		const params = new URLSearchParams({
			paginated: '1',
			page: String(currentPage),
			limit: String(pageSize),
		});
		if (search) params.set('search', search);
		if (dobFrom) params.set('dobFrom', dobFrom);
		if (dobTo) params.set('dobTo', dobTo);
		if (anniversaryFrom) params.set('anniversaryFrom', anniversaryFrom);
		if (anniversaryTo) params.set('anniversaryTo', anniversaryTo);

		fetch(`${API_URL}/api/donors?${params.toString()}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setDonors(Array.isArray(data?.items) ? data.items : []);
				setTotalPages(Math.max(1, data?.pagination?.totalPages || 1));
				setTotalRecords(data?.pagination?.total || 0);
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

	if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

	const filteredDonors = donors;

	const hasFilter = dobFrom || dobTo || anniversaryFrom || anniversaryTo;

	const handleExportExcel = () => {
		const rows = filteredDonors.map(d => ({
			'Name': d.name || '',
			'Email': d.email || '',
			'Phone': d.phone || '',
			'Date of Birth': formatDateDisplay(d.date_of_birth),
			'Anniversary': formatDateDisplay(d.anniversary_date),
			'PAN Card': d.pan_card || '',
			'Cultivator': d.cultivator_name || '',
			'Address': d.address || '',
			'City': d.city || '',
			'State': d.state || '',
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Donors');
		XLSX.writeFile(wb, 'donors_filtered.xlsx');
	};

	const handleExportPdf = () => {
		setExportingPdf(true);
		const token = localStorage.getItem('token');
		const params = new URLSearchParams();
		if (dobFrom) params.set('dobFrom', dobFrom);
		if (dobTo) params.set('dobTo', dobTo);
		if (anniversaryFrom) params.set('anniversaryFrom', anniversaryFrom);
		if (anniversaryTo) params.set('anniversaryTo', anniversaryTo);
		if (search) params.set('search', search);
		fetch(`${API_URL}/api/donors/export/pdf?${params.toString()}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => { if (!res.ok) throw new Error('Export failed'); return res.blob(); })
			.then(blob => {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url; a.download = 'donors_filtered.pdf';
				document.body.appendChild(a); a.click(); a.remove();
				window.URL.revokeObjectURL(url);
			})
			.catch(() => setError('Failed to export PDF'))
			.finally(() => setExportingPdf(false));
	};

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
							<option value={200}>200</option>
						</select>
						<span className="text-sm text-gray-500">per page</span>
					</div>
				</div>
				<div className="mb-4">
					<ImportDonors onImport={fetchDonors} />
				</div>
				{/* Birthday & Anniversary Filter Panel */}
				<div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 mb-4">
					<div className="flex flex-wrap gap-4 items-end">
						<div>
							<label className="block text-xs font-semibold text-blue-700 mb-1">🎂 Birthday From</label>
							<input type="month" value={dobFrom} onChange={e => { setDobFrom(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-300" />
						</div>
						<div>
							<label className="block text-xs font-semibold text-blue-700 mb-1">🎂 Birthday To</label>
							<input type="month" value={dobTo} onChange={e => { setDobTo(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-300" />
						</div>
						<div>
							<label className="block text-xs font-semibold text-pink-700 mb-1">💍 Anniversary From</label>
							<input type="month" value={anniversaryFrom} onChange={e => { setAnniversaryFrom(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-pink-300" />
						</div>
						<div>
							<label className="block text-xs font-semibold text-pink-700 mb-1">💍 Anniversary To</label>
							<input type="month" value={anniversaryTo} onChange={e => { setAnniversaryTo(e.target.value); setCurrentPage(1); }} className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-pink-300" />
						</div>
						{hasFilter && (
							<button onClick={() => { setDobFrom(''); setDobTo(''); setAnniversaryFrom(''); setAnniversaryTo(''); setCurrentPage(1); }} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded font-semibold transition mt-4">
								✕ Clear Filters
							</button>
						)}
						<div className="flex gap-2 mt-4 ml-auto">
							<button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-1.5 rounded font-semibold text-sm hover:bg-green-700 transition flex items-center gap-1.5">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
								Excel
							</button>
							<button onClick={handleExportPdf} disabled={exportingPdf} className="bg-red-600 text-white px-4 py-1.5 rounded font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-1.5">
								{exportingPdf ? (
									<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Exporting...</>
								) : (
									<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>PDF</>
								)}
							</button>
						</div>
					</div>
					{hasFilter && (
						<p className="text-xs text-blue-600 mt-2 font-medium">{totalRecords} donor{totalRecords !== 1 ? 's' : ''} match the current filter</p>
					)}
				</div>
				{showAdd && <DonorForm onSuccess={() => { setShowAdd(false); fetchDonors(); }} />}
				{editDonor && <DonorEdit donor={editDonor} onSuccess={() => { setEditDonor(null); fetchDonors(); }} onCancel={() => setEditDonor(null)} />}
				{loading && (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="relative w-16 h-16">
							<div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
							<div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
							<div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}></div>
						</div>
						<p className="text-blue-700 font-semibold text-base tracking-wide animate-pulse">Loading donors...</p>
					</div>
				)}
				{!loading && <div className="overflow-x-auto mt-6">
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
							{filteredDonors.map((donor, idx) => (
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
				</div>}
				{/* Pagination Controls */}
				{totalRecords > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
						<span className="text-sm text-gray-600">
							Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
						</span>
						<div className="flex gap-1 flex-wrap">
							<button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">First</button>
							<button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Prev</button>
							{(() => {
								const totalPagesLocal = totalPages;
								const windowSize = 10;
								let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
								let end = Math.min(totalPagesLocal, start + windowSize - 1);
								if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
								return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
									<button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>{page}</button>
								));
							})()}
							<button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Next</button>
							<button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Last</button>
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
