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
  const [deleteGiftId, setDeleteGiftId] = useState(null);
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
        setGifts(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch gifts');
        setLoading(false);
      });
  };

  // ADD
  const handleAdd = async (gift) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gift)
      });

      if (!res.ok) throw new Error();
      setShowAdd(false);
      fetchGifts();

    } catch {
      setError('Failed to add gift');
      setLoading(false);
    }
  };

  // EDIT
  const handleEdit = async (gift) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gifts/${gift.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gift)
      });

      if (!res.ok) throw new Error();
      setEditGift(null);
      fetchGifts();

    } catch {
      setError('Failed to update gift');
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    setDeleteLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gifts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error();
      setDeleteGiftId(null);
      fetchGifts();

    } catch {
      setError('Failed to delete gift');
    }

    setDeleteLoading(false);
  };

  // EXPORT
  const handleExport = (type) => {
    setExportError('');
    const token = localStorage.getItem('token');

    fetch(`${process.env.REACT_APP_API_URL}/api/gifts/export/${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gifts.${type === 'xls' ? 'xlsx' : 'pdf'}`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setExportError('Export failed'));
  };

  return (
    <DashboardLayout>
      <div className="overflow-x-auto mt-6">
  <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-sm" style={{ width: '100%' }}>
    
    {/* Table Header */}
    <thead>
      <tr className="bg-blue-50 text-blue-900">
        <th className="py-3 px-5 border-b font-semibold">Phone</th>
        <th className="py-3 px-5 border-b font-semibold">Gift Description</th>
        <th className="py-3 px-5 border-b font-semibold">Value</th>
        <th className="py-3 px-5 border-b font-semibold">Date</th>
        <th className="py-3 px-5 border-b font-semibold">Actions</th>
      </tr>
    </thead>

    {/* Table Body */}
    <tbody>
      {(gifts || [])
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .map(gift => (
          <tr key={gift.id} className="hover:bg-blue-100 transition">
            
            {/* Phone */}
            <td className="py-3 px-5 border-b text-gray-700">
              {gift.phone || '-'}
            </td>

            {/* Gift Description */}
            <td className="py-3 px-5 border-b font-medium text-gray-900">
              {gift.gift_name}
              {gift.description && (
                <div className="text-xs text-gray-500">{gift.description}</div>
              )}
            </td>

            {/* Value */}
            <td className="py-3 px-5 border-b text-gray-700">
              ₹ {gift.value}
            </td>

            {/* Date */}
            <td className="py-3 px-5 border-b text-gray-700">
              {gift.date_given ? gift.date_given.substring(0, 10) : '-'}
            </td>

            {/* Actions */}
            <td className="py-3 px-5 border-b">
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-blue-700 transition"
                  onClick={() => setEditGift(gift)}
                >
                  Edit
                </button>

                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm font-semibold hover:bg-red-700 transition"
                  onClick={() => setDeleteGiftId(gift.id)}
                >
                  Delete
                </button>

              </div>

              {/* Delete Confirmation */}
              {deleteGiftId === gift.id && (
                <div className="mt-2">
                  <span>Are you sure? </span>

                  <button
                    className="bg-red-700 text-white px-3 py-1 rounded mr-2"
                    onClick={() => handleDelete(gift.id)}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>

                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded"
                    onClick={() => setDeleteGiftId(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </td>

          </tr>
        ))}
    </tbody>

  </table>

        {/* Pagination */}
        {gifts.length > pageSize && (
          <div className="mt-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span className="mx-2">Page {currentPage}</span>
            <button
              disabled={currentPage === Math.ceil(gifts.length / pageSize)}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}

        {error && <div className="text-red-500 mt-2">{error}</div>}
        {exportError && <div className="text-red-500 mt-2">{exportError}</div>}
      </div>
    </DashboardLayout>
  );
}

export default GiftList;