import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import CultivatorForm from './CultivatorForm';
import CultivatorEdit from './CultivatorEdit';

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
        <button className="mb-4 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => setShowAdd(true)} aria-label="Add Cultivator">Add Cultivator</button>
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
              {cultivators.map(cultivator => (
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
      </div>
    </DashboardLayout>
  );
}

export default CultivatorList;
