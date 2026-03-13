import React, { useState, useEffect } from 'react';

function formatDate(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return '';
	return d.toISOString().slice(0, 10);
}

function DonorEdit({ donor, onSuccess, onCancel }) {
	const API_URL = process.env.REACT_APP_API_URL;
	const [form, setForm] = useState({
		...donor,
		date_of_birth: formatDate(donor.date_of_birth),
		anniversary_date: formatDate(donor.anniversary_date)
	});
	const [wife, setWife] = useState({ name: '', date_of_birth: '' });
	const [children, setChildren] = useState([{ name: '', date_of_birth: '' }]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState('');
	const [cultivators, setCultivators] = useState([]);

	useEffect(() => {
		const token = localStorage.getItem('token');
		async function fetchDonorDetails() {
			try {
				const res = await fetch(`${API_URL}/api/donors/${donor.id}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (!res.ok) throw new Error('Failed to fetch donor details');
				const data = await res.json();
				setForm({
					...data,
					date_of_birth: formatDate(data.date_of_birth),
					anniversary_date: formatDate(data.anniversary_date)
				});
				const wifeMember = data.family_members?.find(m => m.relation === 'wife') || { name: '', date_of_birth: '' };
				setWife({ name: wifeMember.name || '', date_of_birth: formatDate(wifeMember.date_of_birth) });
				setChildren(
					(data.family_members?.filter(m => m.relation === 'child') || [{ name: '', date_of_birth: '' }])
						.map(child => ({ ...child, date_of_birth: formatDate(child.date_of_birth) }))
				);
			} catch (err) {
				setError(err.message);
			}
		}
		async function fetchCultivators() {
			try {
				const res = await fetch(`${API_URL}/api/cultivators`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (!res.ok) throw new Error('Failed to fetch cultivators');
				const data = await res.json();
				setCultivators(data);
			} catch (err) {
				setCultivators([]);
			}
		}
		fetchDonorDetails();
		fetchCultivators();
		}, [donor.id, API_URL]);

	const handleChange = e => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};
	const handleWifeChange = e => {
		setWife({ ...wife, [e.target.name]: e.target.value });
	};
	const handleChildChange = (idx, e) => {
		const updated = children.map((child, i) => i === idx ? { ...child, [e.target.name]: e.target.value } : child);
		setChildren(updated);
	};
	const addChild = () => setChildren([...children, { name: '', date_of_birth: '' }]);
	const removeChild = idx => setChildren(children.filter((_, i) => i !== idx));

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');
		const token = localStorage.getItem('token');
		try {
			// Update donor
			const res = await fetch(`${API_URL}/api/donors/${donor.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form)
			});
			if (!res.ok) throw new Error('Failed to update donor');
			// Update wife
			const wifeMember = donor.family_members?.find(m => m.relation === 'wife');
			if (wife.name && wife.date_of_birth) {
				if (wifeMember && wifeMember.id) {
					await fetch(`${API_URL}/api/donors/${donor.id}/family-members/${wifeMember.id}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						},
						body: JSON.stringify({ name: wife.name, relation: 'wife', date_of_birth: wife.date_of_birth })
					});
				} else {
					await fetch(`${API_URL}/api/donors/${donor.id}/family-members`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						},
						body: JSON.stringify({ name: wife.name, relation: 'wife', date_of_birth: wife.date_of_birth })
					});
				}
			} else if (wifeMember && wifeMember.id) {
				// Remove wife
				await fetch(`${API_URL}/api/donors/${donor.id}/family-members/${wifeMember.id}`, {
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` }
				});
			}
			// Update children
			const existingChildren = donor.family_members?.filter(m => m.relation === 'child') || [];
			// Remove all existing children
			for (const child of existingChildren) {
				await fetch(`${API_URL}/api/donors/${donor.id}/family-members/${child.id}`, {
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` }
				});
			}
			// Add new children
			for (const child of children) {
				if (child.name && child.date_of_birth) {
					await fetch(`${API_URL}/api/donors/${donor.id}/family-members`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						},
						body: JSON.stringify({ name: child.name, relation: 'child', date_of_birth: child.date_of_birth })
					});
				}
			}
			setLoading(false);
			setSuccess('Donor updated successfully!');
			setTimeout(() => {
				setSuccess('');
				onSuccess && onSuccess();
			}, 1500);
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};

	return (
		   <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
			   <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl relative flex flex-col" style={{ maxHeight: '90vh', minWidth: '900px', overflowY: 'auto' }}>
				<button type="button" onClick={onCancel} className="absolute top-4 right-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold shadow transition-all" aria-label="Close">Close</button>
				   <form onSubmit={handleSubmit} className="w-full">
					   <h3 className="text-2xl font-bold mb-6">Edit Donor</h3>
					   {error && <div className="text-red-500 mb-2">{error}</div>}
					   {success && <div className="text-green-600 mb-2 font-semibold">{success}</div>}
					   <div className="flex flex-wrap gap-8 mb-6 w-full">
						   {/* Donor Details Section */}
						   <div className="flex-1 min-w-[450px] border border-gray-300 rounded-lg p-6 bg-gray-50">
							   <h4 className="text-lg font-bold mb-4 text-blue-700">Donor Details</h4>
							   <div className="grid grid-cols-2 gap-6">
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Name</label>
									   <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded w-full" required />
								   </div>
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Email</label>
									   <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded w-full" required type="email" />
								   </div>
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Phone</label>
									   <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="border p-2 rounded w-full" required />
								   </div>
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Date of Birth</label>
									   <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="border p-2 rounded w-full" required type="date" />
								   </div>
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Anniversary</label>
									   <input name="anniversary_date" value={form.anniversary_date} onChange={handleChange} className="border p-2 rounded w-full" type="date" />
								   </div>
							   </div>
						   </div>
						   {/* Donor Family Details Section */}
						   <div className="flex-1 min-w-[450px] border border-gray-300 rounded-lg p-6 bg-gray-50">
							   <h4 className="text-lg font-bold mb-4 text-blue-700">Donor Family Details</h4>
							   <div className="grid grid-cols-2 gap-6 mb-4">
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Wife's Name</label>
									   <input name="name" value={wife.name} onChange={handleWifeChange} placeholder="Wife's Name" className="border p-2 rounded w-full" />
								   </div>
								   <div>
									   <label className="block mb-2 font-semibold text-gray-700">Wife DOB</label>
									   <input name="date_of_birth" value={wife.date_of_birth} onChange={handleWifeChange} placeholder="DOB" className="border p-2 rounded w-full" type="date" />
								   </div>
							   </div>
							   <div>
								   <label className="block mb-2 font-semibold text-gray-700">Children</label>
								   <div className="flex flex-wrap gap-2">
									   {children.map((child, idx) => (
										   <div key={idx} className="flex items-center mb-2 gap-2 w-full">
											   <input name="name" value={child.name} onChange={e => handleChildChange(idx, e)} placeholder="Child's Name" className="border p-2 rounded flex-1" />
											   <input name="date_of_birth" value={child.date_of_birth} onChange={e => handleChildChange(idx, e)} placeholder="DOB" className="border p-2 rounded flex-1" type="date" />
											   <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '48px' }}>
												   <button type="button" onClick={() => removeChild(idx)} disabled={children.length === 1} className="p-2 rounded-full bg-gray-200 hover:bg-red-500 group flex items-center justify-center">
													   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
													   </svg>
												   </button>
											   </div>
										   </div>
									   ))}
								   </div>
								   <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded mt-2 font-semibold" onClick={addChild}>Add Child</button>
							   </div>
							   {/* New Donor Fields Grouped Below */}
							   <div className="mt-8 border-t pt-6">
								   <h4 className="text-lg font-bold mb-4 text-pink-700">Additional Donor Details</h4>
								   <div className="grid grid-cols-2 gap-6">
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">PAN Card</label>
										   <input name="pan_card" value={form.pan_card || ''} onChange={handleChange} placeholder="PAN Card" className="border p-2 rounded w-full" />
									   </div>
									<div>
										<label className="block mb-2 font-semibold text-gray-700">Cultivator</label>
										<select
											name="cultivator_id"
											value={form.cultivator_id || ''}
											onChange={handleChange}
											className="border p-2 rounded w-full"
										>
											<option value="">Select Cultivator</option>
											{cultivators.map(c => (
												<option key={c.id} value={c.id}>{c.name}</option>
											))}
										</select>
									</div>
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">Last Gift Details</label>
										   <input name="last_gift_details" value={form.last_gift_details || ''} onChange={handleChange} placeholder="Last Gift Details" className="border p-2 rounded w-full" />
									   </div>
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">House No.</label>
										   <input name="address_house" value={form.address_house || ''} onChange={handleChange} placeholder="House No." className="border p-2 rounded w-full" />
									   </div>
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">City</label>
										   <input name="address_city" value={form.address_city || ''} onChange={handleChange} placeholder="City" className="border p-2 rounded w-full" />
									   </div>
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">State</label>
										   <input name="address_state" value={form.address_state || ''} onChange={handleChange} placeholder="State" className="border p-2 rounded w-full" />
									   </div>
									   <div>
										   <label className="block mb-2 font-semibold text-gray-700">Pin</label>
										   <input name="address_pin" value={form.address_pin || ''} onChange={handleChange} placeholder="Pin" className="border p-2 rounded w-full" />
									   </div>
								   </div>
							   </div>
						   </div>
					   </div>
					   <div className="flex gap-4 flex-wrap justify-end">
						   <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded font-semibold hover:bg-green-700 transition" disabled={loading}>
							   {loading ? 'Saving...' : 'Save Changes'}
						   </button>
						   <button type="button" className="bg-gray-400 text-white py-2 px-6 rounded font-semibold hover:bg-gray-500 transition" onClick={onCancel}>Cancel</button>
					   </div>
				   </form>
			</div>
		</div>
	);
}

export default DonorEdit;