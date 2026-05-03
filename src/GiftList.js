import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import GiftForm from './GiftForm';
import GiftEdit from './GiftEdit';
import ImportGifts from './ImportGifts';

function isAuthenticated() {
  return !!localStorage.getItem('token'); 
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
      if (!res.ok) throw new Error('Failed to add gift');
      setShowAdd(false);
      fetchGifts();
    } catch (err) {
      setError('Failed to add gift: ' + err.message);
      setLoading(false);
    }
  };

  const handleEdit = async ({ id, phone, gift_name, description, value, date_given }) => {
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
        body: JSON.stringify({ phone, gift_name, description, value, date_given })
      });
      if (!res.ok) throw new Error('Failed to update gift');
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

return (
  <DashboardLayout user={null}>
    <div className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded shadow" aria-labelledby="gift-list-title">
      
      <h2 id="gift-list-title" className="text-2xl font-bold mb-4">Gift List</h2>

      {error && <div className="text-center mb-2 text-red-500">{error}</div>}
      {deleteSuccess && <div className="text-center mb-2 text-green-600">{deleteSuccess}</div>}

      {/* Top Actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition"
          onClick={() => setShowAdd(true)}
          aria-label="Add Gift"
        >
          Add Gift
        </button>

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
      {showAdd && (
        <GiftForm
          onSuccess={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editGift && (
        <GiftEdit
          gift={editGift}
          onSuccess={handleEdit}
          onCancel={() => setEditGift(null)}
        />
      )}

      {/* Table */}
      <table className="min-w-full border mt-4" style={{ width: '100%' }} aria-label="Gift List Table">
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
          {(gifts || [])
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
                  {gift.date_given
                    ? new Date(gift.date_given).toLocaleDateString('en-IN')
                    : '-'}
                </td>

                {/* Actions */}
                <td className="py-2 px-4 border">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                    
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

      {/* Pagination */}
      {gifts.length > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, gifts.length)} of {gifts.length}
          </span>

          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border">First</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border">Prev</button>

            {Array.from({ length: Math.ceil(gifts.length / pageSize) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
              >{page}</button>
            ))}

            <button disabled={currentPage === Math.ceil(gifts.length / pageSize)} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border">Next</button>
            <button disabled={currentPage === Math.ceil(gifts.length / pageSize)} onClick={() => setCurrentPage(Math.ceil(gifts.length / pageSize))} className="px-3 py-1 border">Last</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn">
            
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