
import React, { useState, useEffect } from 'react';

const DONATION_FIELDS = ['receipt_number', 'transaction_date', 'instrument_number', 'amount', 'scheme_name', 'mode_of_payment', 'comments'];

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
		country: '',
		cultivator_id: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [schemes, setSchemes] = useState([]);
	const [cultivators, setCultivators] = useState([]);
	const [fetchingDonor, setFetchingDonor] = useState(false);
	const [fetchMsg, setFetchMsg] = useState('');
	const [donorLocked, setDonorLocked] = useState(false);
	const [cultivatorLocked, setCultivatorLocked] = useState(false);

	useEffect(() => {
		const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
		const token = localStorage.getItem('token');
		fetch(`${API_URL}/api/schemes`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {}
		})
			.then(res => res.json())
			.then(data => setSchemes(data.data || []))
			.catch(() => setSchemes([]));
		fetch(`${API_URL}/api/cultivators`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {}
		})
			.then(res => res.json())
			.then(data => setCultivators(Array.isArray(data) ? data : []))
			.catch(() => setCultivators([]));
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		// If phone number is changed after a donor was fetched, reset the locked state
		if (name === 'phone_number' && donorLocked) {
			setDonorLocked(false);
			setCultivatorLocked(false);
			setFetchMsg('');
			setForm(prev => ({
				...prev,
				phone_number: value,
				donor_name: '',
				initiated_name: '',
				address_line1: '',
				address_line2: '',
				post_office: '',
				city: '',
				district: '',
				state: '',
				pin_code: '',
				country: '',
				cultivator_id: ''
			}));
			return;
		}
		if (donorLocked && !DONATION_FIELDS.includes(name) && name !== 'cultivator_id') return;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const handleFetchDonor = async () => {
		const phone = form.phone_number.trim();
		if (!phone) { setFetchMsg('Please enter a phone number first.'); return; }
		setFetchingDonor(true);
		setFetchMsg('');
		try {
			const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
			const token = localStorage.getItem('token');
			const res = await fetch(`${API_URL}/api/donors/by-phone/${encodeURIComponent(phone)}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			});
			if (!res.ok) {
				setFetchMsg('No existing donor found for this phone number. You can fill in the details below.');
				setFetchingDonor(false);
				return;
			}
			const donor = await res.json();
			const hasCultivator = !!donor.cultivator_id;
			setForm(prev => ({
				...prev,
				donor_name: donor.name || '',
				initiated_name: donor.initiated_name || '',
				address_line1: donor.address_line1 || '',
				address_line2: donor.address_line2 || '',
				post_office: donor.post_office || '',
				city: donor.city || '',
				district: donor.district || '',
				state: donor.state || '',
				pin_code: donor.pin_code || '',
				country: donor.country || '',
				cultivator_id: donor.cultivator_id ? String(donor.cultivator_id) : ''
			}));
			setDonorLocked(true);
			setCultivatorLocked(hasCultivator);
			setFetchMsg(`Donor found: ${donor.name}${donor.initiated_name ? ' (' + donor.initiated_name + ')' : ''}${donor.cultivator_name ? ' · Cultivator: ' + donor.cultivator_name : ''}`);
		} catch {
			setFetchMsg('Error fetching donor details. Please try again.');
		}
		setFetchingDonor(false);
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

	const disabledCls = 'bg-gray-100 text-gray-500 cursor-not-allowed';
	const inputCls = (locked) => `border p-2 rounded w-full focus:ring-2 focus:ring-green-400 ${locked ? disabledCls : ''}`;

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
					{/* — Phone Number with Fetch — */}
					<div className="mb-4">
						<label className="block mb-1 font-semibold text-gray-700">Phone Number</label>
						<div className="flex gap-2">
							<input
								name="phone_number"
								value={form.phone_number}
								onChange={handleChange}
								placeholder="Phone Number"
								className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400"
								required
							/>
							<button
								type="button"
								onClick={handleFetchDonor}
								disabled={fetchingDonor}
								className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition whitespace-nowrap disabled:opacity-60"
							>
								{fetchingDonor ? 'Fetching…' : 'Fetch Donor'}
							</button>
						</div>
						{fetchMsg && (
							<div className={`mt-1 text-sm px-2 py-1 rounded ${donorLocked ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
								{fetchMsg}
							</div>
						)}
					</div>

					{/* — Donation Fields — */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
						<div>
							<label className="block mb-1 font-semibold text-gray-700">Receipt Number</label>
							<input name="receipt_number" value={form.receipt_number} onChange={handleChange} placeholder="Receipt Number" className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400" required />
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

					{/* — Donor Details (locked if existing donor) — */}
					<div className="mt-6 border-t pt-4">
						<div className="flex items-center gap-2 mb-3">
							<h3 className="text-lg font-bold text-pink-700">Donor Details</h3>
							{donorLocked && (
								<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Auto-filled · Read only</span>
							)}
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Donor Name</label>
								<input name="donor_name" value={form.donor_name} onChange={handleChange} placeholder="Donor Name" className={inputCls(donorLocked)} disabled={donorLocked} required />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Initiated Name (Optional)</label>
								<input name="initiated_name" value={form.initiated_name} onChange={handleChange} placeholder="Initiated Name" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>

							{/* Cultivator */}
							<div className="md:col-span-2">
								<label className="block mb-1 font-semibold text-gray-700">
									Cultivator
									{cultivatorLocked && <span className="ml-2 text-xs text-blue-600 font-normal">(set on donor record)</span>}
									{!cultivatorLocked && donorLocked && <span className="ml-2 text-xs text-amber-600 font-normal">(not set — you can assign one)</span>}
								</label>
								{cultivatorLocked ? (
									<input
										value={cultivators.find(c => String(c.id) === String(form.cultivator_id))?.name || form.cultivator_id || '—'}
										className={inputCls(true)}
										disabled
										readOnly
									/>
								) : (
									<select
										name="cultivator_id"
										value={form.cultivator_id}
										onChange={handleChange}
										className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400 bg-white"
									>
										<option value="">— Select Cultivator (optional) —</option>
										{cultivators.map(c => (
											<option key={c.id} value={c.id}>{c.name}</option>
										))}
									</select>
								)}
							</div>

							<div>
								<label className="block mb-1 font-semibold text-gray-700">Address Line 1</label>
								<input name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="Flat / Door / Building" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Address Line 2</label>
								<input name="address_line2" value={form.address_line2} onChange={handleChange} placeholder="Road / Street / Block / Sector" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Post Office</label>
								<input name="post_office" value={form.post_office} onChange={handleChange} placeholder="Post Office" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">City (Area / Locality)</label>
								<input name="city" value={form.city} onChange={handleChange} placeholder="City (Area / Locality)" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">District</label>
								<input name="district" value={form.district} onChange={handleChange} placeholder="District" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">State</label>
								<input name="state" value={form.state} onChange={handleChange} placeholder="State" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">PIN Code</label>
								<input name="pin_code" value={form.pin_code} onChange={handleChange} placeholder="PIN Code" maxLength={6} pattern="\d{6}" className={inputCls(donorLocked)} disabled={donorLocked} />
							</div>
							<div>
								<label className="block mb-1 font-semibold text-gray-700">Country</label>
								<input name="country" value={form.country} onChange={handleChange} placeholder="Country" className={inputCls(donorLocked)} disabled={donorLocked} />
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
