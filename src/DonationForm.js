
import React, { useState, useEffect } from 'react';

const DonationForm = ({ onSuccess, onCancel }) => {
	const [form, setForm] = useState({
		receipt_number: '',
		phone_number: '',
		transaction_date: '',
		instrument_number: '',
		donor_name: '',
		initiated_name: '',
		amount: '',
		scheme_name: '',
		mode_of_payment: '',
		comments: '',
		address_line1: '',
		address_line2: '',
		post_office: '',
		city: '',
		district: '',
		state: '',
		pin_code: '',
		country: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [schemes, setSchemes] = useState([]);

	useEffect(() => {
		const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/schemes`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {}
		})
			.then(res => res.json())
			.then(data => setSchemes(data.data || []))
			.catch(() => setSchemes([]));
	}, []);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/api/donations`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(form)
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to submit donation');
			}
			setLoading(false);
			if (onSuccess) onSuccess();
		} catch (err) {
			setError(err.message || 'Failed to submit donation');
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4">
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-5 sm:p-8 animate-fadeIn max-h-[92vh] overflow-y-auto">
				<button
					onClick={onCancel}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
					aria-label="Close"
				>×</button>
				<h2 className="text-2xl font-bold mb-6 text-center">Add Donation</h2>
				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Receipt Number</label>
							<input name="receipt_number" value={form.receipt_number} onChange={handleChange} placeholder="Receipt Number" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Phone Number</label>
							<input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Phone Number" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Transaction Date</label>
							<input name="transaction_date" value={form.transaction_date} onChange={handleChange} placeholder="YYYY-MM-DD" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Instrument Number</label>
							<input name="instrument_number" value={form.instrument_number} onChange={handleChange} placeholder="Instrument Number" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Donor Name</label>
							<input name="donor_name" value={form.donor_name} onChange={handleChange} placeholder="Donor Name" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Initiated Name (Optional)</label>
							<input name="initiated_name" value={form.initiated_name} onChange={handleChange} placeholder="Initiated Name" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Amount</label>
							<input name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" type="number" min="0" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Scheme Name</label>
							<select name="scheme_name" value={form.scheme_name} onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400 bg-white" required>
								<option value="">Select Scheme</option>
								{schemes.map(s => (
									<option key={s.id} value={s.name}>{s.name}</option>
								))}
							</select>
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Mode Of Payment</label>
							<input name="mode_of_payment" value={form.mode_of_payment} onChange={handleChange} placeholder="Mode Of Payment" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
					</div>
					<div className="mt-2">
						<label className="block mb-1 font-semibold text-gray-700">Comments</label>
						<textarea name="comments" value={form.comments} onChange={handleChange} placeholder="Comments" rows={2} className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
					</div>
					<div className="mt-6 border-t pt-4">
						<h3 className="text-lg font-bold mb-3 text-pink-700">Donor Address (used if donor is new)</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Address Line 1 (Flat / Door / Building)</label>
								<input name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="Flat / Door / Building" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Address Line 2 (Road / Street / Block / Sector)</label>
								<input name="address_line2" value={form.address_line2} onChange={handleChange} placeholder="Road / Street / Block / Sector" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Post Office</label>
								<input name="post_office" value={form.post_office} onChange={handleChange} placeholder="Post Office" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">City (Area / Locality)</label>
								<input name="city" value={form.city} onChange={handleChange} placeholder="City (Area / Locality)" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">District</label>
								<input name="district" value={form.district} onChange={handleChange} placeholder="District" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">State</label>
								<input name="state" value={form.state} onChange={handleChange} placeholder="State" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">PIN Code (6 Digits)</label>
								<input name="pin_code" value={form.pin_code} onChange={handleChange} placeholder="PIN Code" maxLength={6} pattern="\d{6}" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Country</label>
								<input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" />
							</div>
						</div>
					</div>
					{error && <div className="text-red-500 mt-2 text-center">{error}</div>}
					<div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8 sm:justify-end">
						<button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60" disabled={loading}>
							{loading ? (
								<span className="flex items-center gap-2">
									<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
									Submitting...
								</span>
							) : 'Submit'}
						</button>
						<button type="button" className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-400 transition" onClick={onCancel}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default DonationForm;
