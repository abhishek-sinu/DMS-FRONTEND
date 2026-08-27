import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
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
  const [scheme, setScheme] = useState('');
  const [reportMode, setReportMode] = useState('individual');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view reports.');
      setLoading(false);
      return;
    }
    fetchReportData();
  }, [dateFrom, dateTo, amountMin, amountMax, scheme, reportMode, currentPage, pageSize]);

  const fetchReportData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      mode: reportMode,
      page: String(currentPage),
      limit: String(pageSize)
    });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (amountMin !== '') params.set('amountMin', amountMin);
    if (amountMax !== '') params.set('amountMax', amountMax);
    if (scheme) params.set('scheme', scheme);

    fetch(`${API_URL}/api/report/donations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDonations(Array.isArray(data?.items) ? data.items : []);
        setTotalPages(Math.max(1, data?.pagination?.totalPages || 1));
        setTotalRecords(data?.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch report data');
        setLoading(false);
      });
  };
  const visibleRows = donations;
  const totalAmount = visibleRows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (amountMin !== '') params.set('amountMin', amountMin);
    if (amountMax !== '') params.set('amountMax', amountMax);
    if (scheme) params.set('scheme', scheme);
    params.set('mode', reportMode);

    fetch(`${API_URL}/api/report/donations/${type}?${params.toString()}`, {
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
            <label className="block text-sm font-semibold text-gray-600 mb-1">Mode</label>
            <select
              value={reportMode}
              onChange={e => { setReportMode(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="individual">Individual Donations</option>
              <option value="aggregate">Aggregate by Phone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Min Amount</label>
            <input
              type="number"
              value={amountMin}
              onChange={e => { setAmountMin(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="₹ Min"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Max Amount</label>
            <input
              type="number"
              value={amountMax}
              onChange={e => { setAmountMax(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="₹ Max"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Scheme</label>
            <input
              type="text"
              value={scheme}
              onChange={e => { setScheme(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 text-sm w-32"
              placeholder="Scheme name"
            />
          </div>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); setScheme(''); setCurrentPage(1); }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-semibold"
          >Clear Filters</button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <div className="w-full sm:w-auto sm:ml-auto flex gap-2 flex-wrap sm:flex-nowrap">
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
            <div className="text-sm text-gray-500 font-semibold">
              {reportMode === 'aggregate' ? 'Total Phones' : 'Total Donations'}
            </div>
            <div className="text-2xl font-bold text-blue-700">{totalRecords}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-sm text-gray-500 font-semibold">Page Amount</div>
            <div className="text-2xl font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-sm text-gray-500 font-semibold">
              {reportMode === 'aggregate' ? 'Page Avg Per Phone' : 'Page Average Donation'}
            </div>
            <div className="text-2xl font-bold text-purple-700">
              ₹{visibleRows.length ? (totalAmount / visibleRows.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}></div>
              </div>
              <p className="text-blue-700 font-semibold text-base tracking-wide animate-pulse">Loading report...</p>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No donations found for the selected filters.</div>
          ) : (
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  {reportMode === 'aggregate' ? (
                    <>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Donor</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">Total Amount</th>
                      <th className="px-4 py-3 text-left">Donations</th>
                      <th className="px-4 py-3 text-left">First Date</th>
                      <th className="px-4 py-3 text-left">Last Date</th>
                      <th className="px-4 py-3 text-left">Cultivator</th>
                      <th className="px-4 py-3 text-left">Schemes</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Donor</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">Cultivator</th>
                      <th className="px-4 py-3 text-left">Scheme</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((d, i) => (
                  reportMode === 'aggregate' ? (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{d.donor_name || '-'}</td>
                      <td className="px-4 py-2">{d.donor_phone || '-'}</td>
                      <td className="px-4 py-2 font-semibold text-green-700">₹{parseFloat(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2">{d.donation_count || 0}</td>
                      <td className="px-4 py-2">{formatDate(d.first_date)}</td>
                      <td className="px-4 py-2">{formatDate(d.last_date)}</td>
                      <td className="px-4 py-2">{d.cultivator_name || '-'}</td>
                      <td className="px-4 py-2">{d.scheme_names || '-'}</td>
                    </tr>
                  ) : (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{d.donor_name || '-'}</td>
                      <td className="px-4 py-2 font-semibold text-green-700">₹{parseFloat(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2">{formatDate(d.donation_date || d.transaction_date || d.created_at)}</td>
                      <td className="px-4 py-2">{d.donor_phone || '-'}</td>
                      <td className="px-4 py-2">{d.cultivator_name || '-'}</td>
                      <td className="px-4 py-2">{d.scheme_name || '-'}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
            </span>
            <div className="flex gap-1 flex-wrap">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">First</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Prev</button>
              {(() => {
                const windowSize = 10;
                let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
                let end = Math.min(totalPages, start + windowSize - 1);
                if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>{page}</button>
                ));
              })()}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Next</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Last</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ReportList;