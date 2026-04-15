import React, { useState } from 'react';

function Signup() {
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role_id, setRoleId] = useState(2); // Default to user
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		try {
			const res = await fetch(`${API_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password, role_id })
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setSuccess('Registration successful! You can now log in.');
				setUsername('');
				setEmail('');
				setPassword('');
			} else {
				setError(data.error || 'Signup failed');
			}
		} catch (err) {
			setError('Server error '+ err + ' at ' + API_URL);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<form className="bg-white p-8 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
				<h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
				{error && <div className="mb-4 text-red-500">{error}</div>}
				{success && <div className="mb-4 text-green-500">{success}</div>}
				<div className="mb-4">
					<label className="block mb-2 text-sm font-medium">Username</label>
					<input className="w-full border rounded px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} required />
				</div>
				<div className="mb-4">
					<label className="block mb-2 text-sm font-medium">Email</label>
					<input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required />
				</div>
				<div className="mb-6">
					<label className="block mb-2 text-sm font-medium">Password</label>
					<input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} required />
				</div>
				<button className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition">Sign Up</button>
			</form>
		</div>
	);
}

export default Signup;