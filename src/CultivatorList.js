import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import CultivatorForm from './CultivatorForm';
import CultivatorEdit from './CultivatorEdit';
import ImportCultivators from './ImportCultivators';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function CultivatorList() {
  const [cultivators, setCultivators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editCultivator, setEditCultivator] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteCultivatorId, setDeleteCultivatorId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleExport = (type) => {
    setExportError('');
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/cultivators/export/${type}`, {
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
        a.download = `cultivators.${type === 'xls' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setExportError(`Failed to export as ${type.toUpperCase()}`));
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view cultivators.');
      setLoading(false);
      return;
    }
    fetchCultivators();
  }, []);

  const fetchCultivators = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/cultivators`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCultivators(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch cultivators');
        setLoading(false);
      });
  };

  const handleAdd = async ({ name, phone }) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cultivators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      if (!res.ok) throw new Error('Failed to add cultivator');
      setShowAdd(false);
      fetchCultivators();
    } catch (err) {
      setError('Failed to add cultivator');
      setLoading(false);
    }
  };

  const handleEdit = async ({ id, name, phone }) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cultivators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      if (!res.ok) throw new Error('Failed to update cultivator');
      setEditCultivator(null);
      fetchCultivators();
    } catch (err) {
      setError('Failed to update cultivator');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cultivators/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete cultivator');
      setDeleteCultivatorId(null);
      fetchCultivators();
    } catch (err) {
      setError('Failed to delete cultivator');
    }
    setDeleteLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">Cultivators</h2>
        </div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Cultivator">Add Cultivator</button>
          <button onClick={() => handleExport('xls')} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">Export Excel</button>
          <button onClick={() => handleExport('pdf')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">Export PDF</button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={cultivators.length}>All</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>
        <div className="mb-4">
          <ImportCultivators onImport={fetchCultivators} />
        </div>
        {exportError && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{exportError}</div>}
        {showAdd && <CultivatorForm onSuccess={handleAdd} />}
        {editCultivator && <CultivatorEdit cultivator={editCultivator} onSuccess={handleEdit} onCancel={() => setEditCultivator(null)} />}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-sm" style={{ width: '100%' }}>
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="py-3 px-5 border-b font-semibold">Name</th>
                <th className="py-3 px-5 border-b font-semibold">Phone Number</th>
                <th className="py-3 px-5 border-b font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cultivators.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(cultivator => (
                <tr key={cultivator.id} className="hover:bg-blue-100 transition">
                  <td className="py-3 px-5 border-b font-medium text-gray-900">{cultivator.name}</td>
                  <td className="py-3 px-5 border-b text-gray-700">{cultivator.phone || '-'}</td>
                  <td className="py-3 px-5 border-b">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        aria-label={`Edit cultivator ${cultivator.name}`}
                        onClick={() => setEditCultivator(cultivator)}
                      >Edit</button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                        aria-label={`Delete cultivator ${cultivator.name}`}
                        onClick={() => setDeleteCultivatorId(cultivator.id)}
                      >Delete</button>
                    </div>
                    {deleteCultivatorId === cultivator.id && (
                      <div className="mt-2">
                        <span>Are you sure? </span>
                        <button
                          className="bg-red-700 text-white px-3 py-1 rounded mr-2"
                          onClick={() => handleDelete(cultivator.id)}
                          disabled={deleteLoading}
                        >{deleteLoading ? 'Deleting...' : 'Yes, Delete'}</button>
                        <button
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                          onClick={() => setDeleteCultivatorId(null)}
                        >Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {cultivators.length > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, cultivators.length)} of {cultivators.length}
            </span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">First</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Prev</button>
              {Array.from({ length: Math.ceil(cultivators.length / pageSize) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}>{page}</button>
              ))}
              <button disabled={currentPage === Math.ceil(cultivators.length / pageSize)} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Next</button>
              <button disabled={currentPage === Math.ceil(cultivators.length / pageSize)} onClick={() => setCurrentPage(Math.ceil(cultivators.length / pageSize))} className="px-3 py-1 rounded border text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition">Last</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CultivatorList;
