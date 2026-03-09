import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const API_URL = process.env.REACT_APP_API_URL;
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			const res = await fetch(`${API_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if (res.ok && data.success) {
				localStorage.setItem('token', data.token);
				navigate('/dashboard');
			} else {
				setError(data.error || 'Login failed');
			}
		} catch (err) {
			setError('Server error');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500">
			<div className="bg-white/90 shadow-xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center">
				<h2 className="text-3xl font-extrabold mb-6 text-blue-700">ISKCON Donation Management</h2>
				<form className="w-full" onSubmit={handleSubmit}>
					{error && <div className="mb-4 text-red-500 text-center font-semibold">{error}</div>}
					<div className="mb-4">
						<label className="block mb-2 text-sm font-medium text-blue-700">Username</label>
						<input className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter your username" />
					</div>
					<div className="mb-6">
						<label className="block mb-2 text-sm font-medium text-blue-700">Password</label>
						<input type="password" className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
					</div>
					<button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-lg shadow">Login</button>
				</form>
				<div className="mt-6 w-full flex justify-center">
					<span className="text-sm text-gray-600">New user?</span>
					<Link to="/signup" className="ml-2 text-green-600 font-semibold hover:underline">Sign Up</Link>
				</div>
			</div>
		</div>
	);
}

export default Login;