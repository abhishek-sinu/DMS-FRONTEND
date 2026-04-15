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
      <div className="max-w-7xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-3xl font-bold mb-6">Gifts</h2>

        {/* Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setShowAdd(true)} className="bg-green-600 text-white px-4 py-2 rounded">
            Add Gift
          </button>

          <button onClick={() => handleExport('xls')} className="bg-green-700 text-white px-4 py-2 rounded">
            Export Excel
          </button>

          <button onClick={() => handleExport('pdf')} className="bg-red-600 text-white px-4 py-2 rounded">
            Export PDF
          </button>
        </div>

        {/* Import */}
        <ImportGifts onImport={fetchGifts} />

        {/* Forms */}
        {showAdd && <GiftForm onSuccess={handleAdd} />}
        {editGift && (
          <GiftEdit
            gift={editGift}
            onSuccess={handleEdit}
            onCancel={() => setEditGift(null)}
          />
        )}

        {/* Table */}
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th>Phone</th>
              <th>Gift</th>
              <th>Description</th>
              <th>Value</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {gifts
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(gift => (
                <tr key={gift.id}>
                  <td>{gift.phone}</td>
                  <td>{gift.gift_name}</td>
                  <td>{gift.description}</td>
                  <td>{gift.value}</td>
                  <td>{gift.date_given}</td>

                  <td>
                    <button onClick={() => setEditGift(gift)}>Edit</button>
                    <button onClick={() => setDeleteGiftId(gift.id)}>Delete</button>

                    {deleteGiftId === gift.id && (
                      <div>
                        <span>Confirm?</span>
                        <button onClick={() => handleDelete(gift.id)}>Yes</button>
                        <button onClick={() => setDeleteGiftId(null)}>Cancel</button>
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