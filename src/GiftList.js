import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import GiftForm from './GiftForm';
import GiftEdit from './GiftEdit';
import ImportGifts from './ImportGifts';

function isAuthenticated() {
  return !!localStorage.getItem('token'); 
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function GiftList() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editGift, setEditGift] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const [exportError, setExportError] = useState('');

  // Fetch gifts
  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to view gifts.');
      setLoading(false);
      return;
    }
    fetchGifts();
  }, []);

  const fetchGifts = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    console.log('Fetching gifts with token:', token);

    fetch(`${process.env.REACT_APP_API_URL}/api/gifts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setGifts(data.data || []);//data
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch gifts');
        setLoading(false);
      });
  };

const handleAdd = async ({ phone, gift_name, description, value, date_given }) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, gift_name, description, value, date_given, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add gift');
      setShowAdd(false);
      fetchGifts();
    } catch (err) {
      setError('Failed to add gift: ' + err.message);
      setLoading(false);
      throw err;
    }
  };

  const handleEdit = async ({ id, phone, gift_name, description, value, date_given, created_at }) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gifts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, gift_name, description, value, date_given, created_at })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update gift');
      setEditGift(null);
      fetchGifts();
    } catch (err) {
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };

  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');

  const openDeleteModal = (id) => {
		console.log('openDeleteModal called with id:', id);
		setDeleteId(id);
		setDeleteInput('');
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
		fetch(`${process.env.REACT_APP_API_URL}/api/gifts/${deleteId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => {
				if (res.ok) {
					setDeleteSuccess('Gift successfully deleted.');
					setError('');
					setGifts(prev => prev.filter(g => g.id !== deleteId));
					setDeleteSuccess('');
				} else {
					setError('Failed to delete gift');
				}
				closeDeleteModal();
			})
			.catch(() => {
				setError('Failed to delete gift');
				closeDeleteModal();
			});
	};


	if (loading) {
		return <div className="text-center mt-8">Loading gifts...</div>;
	}

const filteredGifts = search
  ? gifts.filter(g => ['phone', 'gift_name', 'description'].some(k => g[k] && g[k].toString().toLowerCase().includes(search.toLowerCase())))
  : gifts;

return (
  <DashboardLayout user={null}>
    <div className="max-w-6xl mx-auto mt-4 sm:mt-8 bg-white p-4 sm:p-6 rounded shadow" aria-labelledby="gift-list-title">
      
      <h2 id="gift-list-title" className="text-2xl font-bold mb-4">Gift List</h2>

      {error && <div className="text-center mb-2 text-red-500">{error}</div>}
      {deleteSuccess && <div className="text-center mb-2 text-green-600">{deleteSuccess}</div>}

      {/* Top Actions */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition"
          onClick={() => setShowAdd(true)}
          aria-label="Add Gift"
        >
          Add Gift
        </button>
        <input
          type="text"
          placeholder="Search by phone, gift name..."
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
            <option value={gifts.length}>All</option>
          </select>
          <span className="text-sm text-gray-500">per page</span>
        </div>
      </div>

      {/* Import */}
      <div className="mb-4">
        <ImportGifts onImport={fetchGifts} />
      </div>

      {/* Forms */}

      {/* Add Gift Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-5 sm:p-8 rounded-lg shadow-lg w-full max-w-lg mx-3 sm:mx-4 relative flex flex-col" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold shadow transition-all" aria-label="Close">Close</button>
            <GiftForm
              onSuccess={handleAdd}
            />
          </div>
        </div>
      )}

      {/* Edit Gift Modal */}
      {editGift && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-5 sm:p-8 rounded-lg shadow-lg w-full max-w-lg mx-3 sm:mx-4 relative flex flex-col" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <button type="button" onClick={() => setEditGift(null)} className="absolute top-4 right-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold shadow transition-all" aria-label="Close">Close</button>
            <GiftEdit
              gift={editGift}
              onSuccess={handleEdit}
              onCancel={() => setEditGift(null)}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto mt-4">
      <table className="min-w-[760px] border w-full" style={{ width: '100%' }} aria-label="Gift List Table">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Phone</th>
            <th className="py-2 px-4 border">Gift Description</th>
            <th className="py-2 px-4 border">Value</th>
            <th className="py-2 px-4 border">Date</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>

        <tbody>
          {(filteredGifts || [])
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((gift, idx) => (
              <tr
                key={gift.id}
                tabIndex={0}
                aria-label={`Gift row ${(currentPage - 1) * pageSize + idx + 1}`}
                className="focus:outline-none focus:ring-2 focus:ring-blue-400"
              >

                {/* Phone */}
                <td className="py-2 px-4 border">
                  {gift.phone}
                </td>

                {/* Gift Description */}
                <td className="py-2 px-4 border">
                  {gift.gift_name}
                  {gift.description && (
                    <div className="text-xs text-gray-500">{gift.description}</div>
                  )}
                </td>

                {/* Value */}
                <td className="py-2 px-4 border">
                  ₹ {Number(gift.value).toLocaleString()}
                </td>

                {/* Date */}
                <td className="py-2 px-4 border">
                  {formatDate(gift.date_given)}
                </td>

                {/* Actions */}
                <td className="py-2 px-4 border">
                  <div className="flex flex-wrap gap-2 justify-center items-center">
                    
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      onClick={() => setEditGift(gift)}
                    >
                      Edit
                    </button>

                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      onClick={() => openDeleteModal(gift.id)}
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
      {filteredGifts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <span className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredGifts.length)} of {filteredGifts.length}
          </span>

          <div className="flex gap-1 flex-wrap">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border">First</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border">Prev</button>

            {(() => {
              const totalPages = Math.ceil(filteredGifts.length / pageSize);
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

            <button disabled={currentPage === Math.ceil(filteredGifts.length / pageSize)} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border">Next</button>
            <button disabled={currentPage === Math.ceil(filteredGifts.length / pageSize)} onClick={() => setCurrentPage(Math.ceil(filteredGifts.length / pageSize))} className="px-3 py-1 border">Last</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md mx-4 animate-fadeIn">
            
            <h3 className="text-xl font-bold mb-4 text-center text-red-600">
              Confirm Deletion
            </h3>

            <p className="mb-4 text-center">
              Type <span className="font-mono font-bold text-red-500">delete</span> to confirm deletion of this gift.
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
export default GiftList;