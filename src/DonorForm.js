import React, { useState } from 'react';

function DonorForm({ onSuccess }) {
	const API_URL = process.env.REACT_APP_API_URL;
	const [form, setForm] = useState({
		name: '',
		email: '',
		phone: '',
		date_of_birth: '',
		anniversary_date: '',
		pan_card: '',
		address_house: '',
		address_city: '',
		address_state: '',
		address_pin: '',
		cultivator_id: '',
		last_gift_details: ''
	});
	const [cultivators, setCultivators] = useState([]);
	const [wife, setWife] = useState({ name: '', date_of_birth: '' });
	const [children, setChildren] = useState([{ name: '', date_of_birth: '' }]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = e => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	React.useEffect(() => {
		const token = localStorage.getItem('token');
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
		fetchCultivators();
	}, [API_URL]);
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
		const token = localStorage.getItem('token');
		try {
			// Add donor
			const res = await fetch(`${API_URL}/api/donors`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form)
			});
			if (!res.ok) {
				const data = await res.json().catch(() => null);
				if (res.status === 409 && data && data.error) {
					throw new Error(data.error);
				}
				throw new Error('Failed to add donor');
			}
			const donor = await res.json();
			// Add wife
			if (wife.name && wife.date_of_birth) {
				await fetch(`${API_URL}/api/donors/${donor.id}/family-members`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({ name: wife.name, relation: 'wife', date_of_birth: wife.date_of_birth })
				});
			}
			// Add children
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
			onSuccess && onSuccess();
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
			<div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-6xl mx-3 sm:mx-4 relative flex flex-col" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
				<button type="button" onClick={() => onSuccess && onSuccess()} className="absolute top-4 right-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold shadow transition-all" aria-label="Close">Close</button>
				<form onSubmit={handleSubmit} className="w-full">
					<h3 className="text-2xl font-bold mb-6">Add Donor</h3>
					{error && <div className="text-red-500 mb-2">{error}</div>}
					<div className="flex flex-wrap gap-4 sm:gap-8 mb-6 w-full">
						{/* Personal Details */}
						<div className="flex-1 min-w-0 md:min-w-[320px] border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
							<h4 className="text-lg font-bold mb-4 text-blue-700">Personal Details</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
									<label className="block mb-2 font-semibold text-gray-700">PAN Card</label>
									<input name="pan_card" value={form.pan_card} onChange={handleChange} placeholder="PAN Card" className="border p-2 rounded w-full" />
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
									<input name="last_gift_details" value={form.last_gift_details} onChange={handleChange} placeholder="Last Gift Details" className="border p-2 rounded w-full" />
								</div>
							</div>
						</div>
						{/* Family Details */}
						<div className="flex-1 min-w-0 md:min-w-[320px] border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50 relative">
							<h4 className="text-lg font-bold mb-4 text-pink-700">Family Details</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
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
								<label className="block mb-2 font-semibold text-gray-700">Anniversary</label>
								<input name="anniversary_date" value={form.anniversary_date} onChange={handleChange} className="border p-2 rounded w-full" type="date" />
							</div>
							<div className="mt-4">
								<label className="block mb-2 font-semibold text-gray-700">Children</label>
								<div className="flex flex-wrap gap-2">
									{children.map((child, idx) => (
										<div key={idx} className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2 w-full">
											<input name="name" value={child.name} onChange={e => handleChildChange(idx, e)} placeholder="Child's Name" className="border p-2 rounded flex-1" />
											<input name="date_of_birth" value={child.date_of_birth} onChange={e => handleChildChange(idx, e)} placeholder="DOB" className="border p-2 rounded flex-1" type="date" />
											<div className="flex-shrink-0 flex items-center justify-center sm:w-12">
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
						</div>
						{/* Address Details */}
						<div className="flex-1 min-w-0 md:min-w-[320px] border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
							<h4 className="text-lg font-bold mb-4 text-green-700">Address Details</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
								<div>
									<label className="block mb-2 font-semibold text-gray-700">House No.</label>
									<input name="address_house" value={form.address_house} onChange={handleChange} placeholder="House No." className="border p-2 rounded w-full" />
								</div>
								<div>
									<label className="block mb-2 font-semibold text-gray-700">City</label>
									<input name="address_city" value={form.address_city} onChange={handleChange} placeholder="City" className="border p-2 rounded w-full" />
								</div>
								<div>
									<label className="block mb-2 font-semibold text-gray-700">State</label>
									<input name="address_state" value={form.address_state} onChange={handleChange} placeholder="State" className="border p-2 rounded w-full" />
								</div>
								<div>
									<label className="block mb-2 font-semibold text-gray-700">Pin</label>
									<input name="address_pin" value={form.address_pin} onChange={handleChange} placeholder="Pin" className="border p-2 rounded w-full" />
								</div>
							</div>
						</div>
					</div>
					<div className="flex gap-4 flex-wrap justify-end">
						<button type="submit" className="bg-green-600 text-white py-2 px-6 rounded font-semibold hover:bg-green-700 transition" disabled={loading}>
							{loading ? 'Adding...' : 'Add Donor'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default DonorForm;