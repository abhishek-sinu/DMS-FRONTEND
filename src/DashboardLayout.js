import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function DashboardLayout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>
    )},
    { to: '/donors', label: 'Donors', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { to: '/donations', label: 'Donations', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6M9 10h6M12 17l-3-4h4.5a2.5 2.5 0 000-5" /></svg>
    )},
    { to: '/cultivators', label: 'Cultivators', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { to: '/gifts', label: 'Gifts', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13l3-3m-3 3L9 5m-4 6h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
    )},
    { to: '/reports', label: 'Reports', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      {/* Top Header */}
      <header className="w-full text-white flex items-center justify-between px-6 py-0 shadow-lg z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)', minHeight: '60px' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-white/10 transition mr-1" title="Toggle sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <img src="/logo.png" alt="ISKCON" className="h-6 w-6 object-contain invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide leading-tight">ISKCON Donation Management</span>
              <span className="text-[10px] text-blue-200 tracking-wider uppercase font-medium leading-tight">Temple Administration System</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {(currentUser?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">{currentUser?.username || 'User'}</span>
              <span className="text-[10px] text-blue-200 leading-tight">{currentUser?.role_id === 1 ? 'Administrator' : 'User'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-semibold transition-all text-sm border border-white/20 hover:border-red-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 flex flex-col py-4 min-h-full shadow-xl border-r border-blue-900/20 relative`} style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #172554 100%)' }}>
          {/* Decorative top */}
          <div className="h-0.5 mx-3 mb-4 rounded-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)' }}></div>

          <nav className="flex-1 px-2">
            <ul className="space-y-1">
              {links.map(link => {
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group relative ${isActive
                        ? 'bg-white/15 text-white shadow-lg'
                        : 'text-blue-200 hover:bg-white/8 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? link.label : ''}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-400 rounded-r-full"></div>}
                      <span className={`flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-blue-300 group-hover:text-amber-300'} transition`}>{link.icon}</span>
                      {!sidebarCollapsed && <span className="text-sm">{link.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar footer */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-2">
              <div className="border-t border-white/10 pt-3 mt-2">
                <p className="text-[10px] text-blue-300/60 text-center leading-relaxed">Hare Kṛṣṇa</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
