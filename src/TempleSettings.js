import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

const FIELDS = [
  { key: 'name', label: 'Temple / Trust Name', textarea: true },
  { key: 'founder', label: 'Founder Acharya Line', textarea: true },
  { key: 'head_office', label: 'Head Office Line', textarea: true },
  { key: 'address', label: 'Temple Address', textarea: true },
  { key: 'phones', label: 'Phone Numbers' },
  { key: 'email', label: 'Email' },
  { key: 'registration', label: 'Registration / PAN Line', textarea: true },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'bank', label: 'Bank' },
  { key: 'branch', label: 'Branch' },
];

const EMPTY = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});

function TempleSettings() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [settings, setSettings] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Read the current user's role from the JWT to gate editing (admins only).
  let role = null;
  try {
    const token = localStorage.getItem('token');
    if (token) role = JSON.parse(atob(token.split('.')[1]))?.role_id ?? null;
  } catch { role = null; }
  const isAdmin = role === 1;

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view temple settings.');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/temple-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const next = { ...EMPTY };
          FIELDS.forEach(f => { next[f.key] = data.data[f.key] ?? ''; });
          setSettings(next);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load temple settings.');
        setLoading(false);
      });
  }, [API_URL]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/temple-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.errors && data.errors[0]?.msg) || 'Failed to save settings');
      }
      setSuccess('Temple settings saved successfully.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={null}>
        <div className="text-center mt-8 text-gray-500">Loading temple settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={null}>
      <div className="max-w-3xl mx-auto mt-4 sm:mt-8 bg-white p-4 sm:p-6 rounded-2xl shadow" aria-labelledby="temple-settings-title">
        <div className="flex items-center gap-3 mb-1">
          <h2 id="temple-settings-title" className="text-2xl font-bold text-gray-800">Temple Settings</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          These details are printed on donation receipts. Update them here and they will be used the next time a receipt is generated.
        </p>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-3 text-green-600 text-sm font-semibold">{success}</div>
        )}
        {!isAdmin && (
          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
            You have read-only access. Only administrators can save changes.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block mb-1.5 text-sm font-semibold text-gray-600 tracking-wide" htmlFor={`field-${f.key}`}>
                {f.label}
              </label>
              {f.textarea ? (
                <textarea
                  id={`field-${f.key}`}
                  value={settings[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                />
              ) : (
                <input
                  id={`field-${f.key}`}
                  type="text"
                  value={settings[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  disabled={!isAdmin}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                />
              )}
            </div>
          ))}

          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-green-600 text-white py-2.5 px-6 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}

export default TempleSettings;
