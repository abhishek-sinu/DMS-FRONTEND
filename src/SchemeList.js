import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function SchemeList() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view schemes.');
      setLoading(false);
      return;
    }
    fetchSchemes();
  }, []);

  const fetchSchemes = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/schemes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSchemes(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch schemes');
        setLoading(false);
      });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError('Please enter a scheme name.');
      return;
    }
    setAdding(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/schemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.errors && data.errors[0]?.msg) || 'Failed to add scheme');
      }
      setNewName('');
      setSuccess('Scheme added successfully.');
      setCurrentPage(1);
      fetchSchemes();
      setTimeout(() => setSuccess(''), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteInput('');
    setError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteInput('');
  };

  const confirmDelete = () => {
    if (deleteInput !== 'delete') {
      setError('Deletion cancelled. Type "delete" to confirm.');
      return;
    }
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/schemes/${deleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          setSchemes(prev => prev.filter(s => s.id !== deleteId));
          setSuccess('Scheme deleted successfully.');
          setError('');
          setTimeout(() => setSuccess(''), 1500);
        } else {
          setError('Failed to delete scheme');
        }
        closeDeleteModal();
      })
      .catch(() => {
        setError('Failed to delete scheme');
        closeDeleteModal();
      });
  };

  if (loading) {
    return <div className="text-center mt-8">Loading schemes...</div>;
  }

  const filteredSchemes = search
    ? schemes.filter(s => s.name && s.name.toLowerCase().includes(search.toLowerCase()))
    : schemes;

  const totalPages = Math.ceil(filteredSchemes.length / pageSize) || 1;

  return (
    <DashboardLayout user={null}>
      <div className="max-w-4xl mx-auto mt-4 sm:mt-8 bg-white p-4 sm:p-6 rounded shadow" aria-labelledby="scheme-list-title">

        <h2 id="scheme-list-title" className="text-2xl font-bold mb-4">Schemes</h2>

        {error && <div className="text-center mb-2 text-red-500">{error}</div>}
        {success && <div className="text-center mb-2 text-green-600">{success}</div>}

        {/* Add Scheme */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter new scheme name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="border rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="New scheme name"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Scheme'}
          </button>
        </form>

        {/* Search + page size */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="border rounded px-3 py-2 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 sm:justify-end">
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
              <option value={schemes.length || 1}>All</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-[420px] border w-full" style={{ width: '100%' }} aria-label="Scheme List Table">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border w-16">#</th>
                <th className="py-2 px-4 border text-left">Scheme Name</th>
                <th className="py-2 px-4 border w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 px-4 border text-center text-gray-500">
                    No schemes found.
                  </td>
                </tr>
              )}
              {filteredSchemes
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((scheme, idx) => (
                  <tr key={scheme.id} className="focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <td className="py-2 px-4 border text-center">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2 px-4 border">{scheme.name}</td>
                    <td className="py-2 px-4 border">
                      <div className="flex justify-center">
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                          onClick={() => openDeleteModal(scheme.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSchemes.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSchemes.length)} of {filteredSchemes.length}
            </span>

            <div className="flex gap-1 flex-wrap">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border disabled:opacity-40">First</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border disabled:opacity-40">Prev</button>

              {(() => {
                const windowSize = 10;
                let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
                let end = Math.min(totalPages, start + windowSize - 1);
                if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
                  >{page}</button>
                ));
              })()}

              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border disabled:opacity-40">Next</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 border disabled:opacity-40">Last</button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4 text-center text-red-600">Confirm Deletion</h3>
              <p className="mb-4 text-center">
                Type <span className="font-mono font-bold text-red-500">delete</span> to confirm deletion of this scheme.
              </p>
              <input
                className="border p-2 rounded w-full mb-4 focus:ring-2 focus:ring-red-400"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type 'delete' here"
                autoFocus
              />
              <div className="flex justify-center space-x-4">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default SchemeList;
