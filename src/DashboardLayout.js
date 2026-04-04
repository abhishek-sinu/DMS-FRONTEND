import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function DashboardLayout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Get user info from token if not passed as prop
  let currentUser = user;
  if (!currentUser) {
    try {
      const token = localStorage.getItem('token');
      if (token) currentUser = JSON.parse(atob(token.split('.')[1]));
    } catch { currentUser = null; }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Sidebar links
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/donors', label: 'Donors', icon: '👥' },
    { to: '/donations', label: 'Donations', icon: '💰' },
    { to: '/cultivators', label: 'Cultivators', icon: '🌱' },
    { to: '/reports', label: 'Reports', icon: '📊' },
    { to: '/engagement', label: 'Engagement', icon: '📧' },
    { to: '/import', label: 'Bulk Import', icon: '📁' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Header */}
      <header className="w-full bg-blue-800 text-white flex items-center justify-between px-6 py-3 shadow-md z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🙏</span>
          <span className="text-xl font-bold tracking-wide">ISKCON Donation Management</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Welcome, <span className="font-bold">{currentUser?.username || 'User'}</span>
            <span className="ml-1 text-blue-200">({currentUser?.role_id === 1 ? 'Admin' : 'User'})</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded font-semibold transition text-sm"
          >Logout</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-blue-700 text-white flex flex-col py-6 px-4 min-h-full shadow-lg">
          <nav className="flex-1">
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded font-semibold transition ${location.pathname === link.to ? 'bg-blue-900 text-white' : 'hover:bg-blue-600 text-blue-100'}`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
