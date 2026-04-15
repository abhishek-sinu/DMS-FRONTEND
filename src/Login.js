import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const API_URL = process.env.REACT_APP_API_URL;
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			console.log('[LOGIN] Submitting:', { username });
			const res = await fetch(`${API_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if ( (res.ok && data.success) ) {
				localStorage.setItem('token', data.token);
				navigate('/dashboard');
			} else {
				setError(data.error || 'Login failed');
			}
		} catch (err) {
			setError('Server error '+err);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)' }}>
			{/* Decorative background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 bg-white"></div>
				<div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10 bg-white"></div>
				<div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 bg-white"></div>
			</div>

			<div className="relative z-10 w-full max-w-md mx-4">
				{/* Card */}
				<div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
					{/* Top accent bar */}
					<div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)' }}></div>

					<div className="px-10 pt-10 pb-8">
						{/* Logo & Branding */}
						<div className="flex flex-col items-center mb-8">
							<div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-lg border-2 border-blue-200">
								<img src="/logo.png" alt="ISKCON Logo" className="w-16 h-16 object-contain" />
							</div>
							<h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Donation Management</h1>
							<p className="text-sm text-gray-400 mt-1 font-medium">ISKCON Temple Administration</p>
						</div>

						{/* Error */}
						{error && (
							<div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl px-4 py-3">
								<svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
								{error}
							</div>
						)}

						{/* Form */}
						<form onSubmit={handleSubmit}>
							<div className="mb-5">
								<label className="block mb-1.5 text-sm font-semibold text-gray-600 tracking-wide">Username</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
									</span>
									<input
										className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
										value={username}
										onChange={e => setUsername(e.target.value)}
										required
										placeholder="Enter your username"
										autoComplete="username"
									/>
								</div>
							</div>
							<div className="mb-6">
								<label className="block mb-1.5 text-sm font-semibold text-gray-600 tracking-wide">Password</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
									</span>
									<input
										type="password"
										className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
										value={password}
										onChange={e => setPassword(e.target.value)}
										required
										placeholder="Enter your password"
										autoComplete="current-password"
									/>
								</div>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="w-full text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
								style={{ background: loading ? '#93a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
							>
								{loading ? (
									<span className="flex items-center justify-center gap-2">
										<svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
										Signing in...
									</span>
								) : 'Sign In'}
							</button>
						</form>

						{/* Divider */}
						<div className="flex items-center my-6">
							<div className="flex-1 h-px bg-gray-200"></div>
							<span className="px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
							<div className="flex-1 h-px bg-gray-200"></div>
						</div>

						{/* Sign Up Link */}
						<div className="text-center">
							<span className="text-sm text-gray-500">Don't have an account?</span>
							<Link to="/signup" className="ml-1.5 text-sm text-blue-600 font-bold hover:text-blue-800 hover:underline transition">Create Account</Link>
						</div>
					</div>

					{/* Footer */}
					<div className="bg-gray-50 px-10 py-4 text-center border-t border-gray-100">
						<p className="text-xs text-gray-400">Hare Krishna — Serving devotees with technology</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Login;

