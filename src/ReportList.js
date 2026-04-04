import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function ReportList() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view reports.');
      setLoading(false);
      return;
    }
    fetchDonations();
  }, []);

  const fetchDonations = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDonations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch report data');
        setLoading(false);
      });
  };

  const filtered = donations.filter(d => {
    const raw = d.transaction_date || d.donation_date || d.created_at;
    if (!raw) return true;
    const rowDate = new Date(raw);
    if (isNaN(rowDate)) return true;
    rowDate.setHours(0, 0, 0, 0);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (rowDate < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (rowDate > to) return false;
    }
    const amt = parseFloat(d.amount) || 0;
    if (amountMin !== '' && amt < parseFloat(amountMin)) return false;
    if (amountMax !== '' && amt > parseFloat(amountMax)) return false;
    return true;
  });

  const totalAmount = filtered.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/report/donations/${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations.${type === 'xls' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError(`Failed to export as ${type.toUpperCase()}`));
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">Reports</h1>

        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

        {/* Filters & Export */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Min Amount</label>
            <input
              type="number"
              value={amountMin}
              onChange={e => setAmountMin(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="₹ Min"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Max Amount</label>
            <input
              type="number"
              value={amountMax}
              onChange={e => setAmountMax(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="₹ Max"
            />
          </div>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-semibold"
          >Clear Filters</button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport('xls')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
            >Export Excel</button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold text-sm"
            >Export PDF</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-sm text-gray-500 font-semibold">Total Donations</div>
            <div className="text-2xl font-bold text-blue-700">{filtered.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-sm text-gray-500 font-semibold">Total Amount</div>
            <div className="text-2xl font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-sm text-gray-500 font-semibold">Average Donation</div>
            <div className="text-2xl font-bold text-purple-700">
              ₹{filtered.length ? (totalAmount / filtered.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No donations found for the selected filters.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Donor</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Mode of Payment</th>
                  <th className="px-4 py-3 text-left">Scheme</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{d.donor_name || d.donor_id || '-'}</td>
                    <td className="px-4 py-2 font-semibold text-green-700">₹{parseFloat(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2">{d.donation_date || d.transaction_date || d.created_at ? new Date(d.donation_date || d.transaction_date || d.created_at).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="px-4 py-2">{d.mode_of_payment || '-'}</td>
                    <td className="px-4 py-2">{d.scheme_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReportList;