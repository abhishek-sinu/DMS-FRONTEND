import React, { useState } from 'react';

function DonorForm({ onSuccess }) {
	const API_URL = process.env.REACT_APP_API_URL;
	const [form, setForm] = useState({
		name: '',
		email: '',
		phone: '',
		date_of_birth: '',
		anniversary_date: ''
	});
	const [wife, setWife] = useState({ name: '', date_of_birth: '' });
	const [children, setChildren] = useState([{ name: '', date_of_birth: '' }]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

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
			if (!res.ok) throw new Error('Failed to add donor');
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

	// Modal overlay - landscape layout
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
			<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl relative">
				<button type="button" onClick={() => onSuccess && onSuccess()} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-xl font-bold" aria-label="Close">×</button>
				<form onSubmit={handleSubmit}>
					<h3 className="text-2xl font-bold mb-6">Add Donor</h3>
					{error && <div className="text-red-500 mb-2">{error}</div>}
					<div className="flex gap-8 mb-6">
						{/* Donor main info */}
						<div className="flex-1">
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
							</div>
						</div>
						{/* Wife info and Anniversary */}
						<div className="flex-1">
							<h4 className="text-lg font-semibold mb-2">Wife</h4>
							<div className="grid grid-cols-2 gap-4 mb-4">
								<input name="name" value={wife.name} onChange={handleWifeChange} placeholder="Wife's Name" className="border p-2 rounded" />
								<input name="date_of_birth" value={wife.date_of_birth} onChange={handleWifeChange} placeholder="DOB" className="border p-2 rounded" type="date" />
							</div>
							<div>
								<label className="block mb-2 font-semibold text-gray-700">Anniversary</label>
								<input name="anniversary_date" value={form.anniversary_date} onChange={handleChange} className="border p-2 rounded w-full" type="date" />
							</div>
						</div>
						{/* Children info */}
						<div className="flex-1">
							<h4 className="text-lg font-semibold mb-2">Children</h4>
							{children.map((child, idx) => (
								<div key={idx} className="grid grid-cols-2 gap-4 mb-2 items-center">
									<input name="name" value={child.name} onChange={e => handleChildChange(idx, e)} placeholder="Child's Name" className="border p-2 rounded" />
									<input name="date_of_birth" value={child.date_of_birth} onChange={e => handleChildChange(idx, e)} placeholder="DOB" className="border p-2 rounded" type="date" />
									<button type="button" className="text-red-500 font-bold ml-2" onClick={() => removeChild(idx)} disabled={children.length === 1}>Remove</button>
								</div>
							))}
							<button type="button" className="bg-blue-500 text-white px-3 py-1 rounded mt-2 font-semibold" onClick={addChild}>Add Child</button>
						</div>
					</div>
					<button type="submit" className="bg-green-600 text-white py-2 px-6 rounded font-semibold hover:bg-green-700 transition" disabled={loading}>
						{loading ? 'Adding...' : 'Add Donor'}
					</button>
				</form>
			</div>
		</div>
	);
}

export default DonorForm;