
import React, { useState } from 'react';

const DonationForm = ({ onSuccess, onCancel }) => {
	const [form, setForm] = useState({
		receipt_number: '',
		phone_number: '',
		transaction_date: '',
		instrument_number: '',
		donor_name: '',
		amount: '',
		scheme_name: '',
		mode_of_payment: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

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
							<label className="block mb-1 font-semibold text-gray-700">Amount</label>
							<input name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" type="number" min="0" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Scheme Name</label>
							<input name="scheme_name" value={form.scheme_name} onChange={handleChange} placeholder="Scheme Name" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Mode Of Payment</label>
							<input name="mode_of_payment" value={form.mode_of_payment} onChange={handleChange} placeholder="Mode Of Payment" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
						</div>
					</div>
					{error && <div className="text-red-500 mt-2 text-center">{error}</div>}
					<div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8 sm:justify-end">
						<button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition" disabled={loading}>
							{loading ? 'Submitting...' : 'Submit'}
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
