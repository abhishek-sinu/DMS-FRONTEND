import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function DashboardLayout({ children, user }) {
  const location = useLocation();
  // Sidebar links
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/donors', label: 'Donors' },
    { to: '/donations', label: 'Donations' },
      { to: '/cultivators', label: 'Cultivators' },
    { to: '/reports', label: 'Reports' },
    { to: '/engagement', label: 'Engagement' },
    { to: '/import', label: 'Bulk Import' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-blue-700 text-white flex flex-col py-8 px-6 min-h-screen shadow-lg">
        <h2 className="text-2xl font-bold mb-8">Donation Management</h2>
        <nav className="flex-1">
          <ul className="space-y-4">
            {links.map(link => (
              <li key={link.to}>
                <Link to={link.to} className={`font-semibold hover:text-blue-200 ${location.pathname === link.to ? 'text-blue-200' : ''}`}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 text-sm">Logged in as <span className="font-bold">{user?.username || 'User'}</span> ({user?.role_id === 1 ? 'Admin' : 'User'})</div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}

export default DashboardLayout;
