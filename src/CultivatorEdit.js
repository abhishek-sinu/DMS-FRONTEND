import React, { useState } from 'react';

function CultivatorEdit({ cultivator, onSuccess, onCancel }) {
  const [name, setName] = useState(cultivator.name);
  const [phone, setPhone] = useState(cultivator.phone || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSuccess({ id: cultivator.id, name, phone });
    } catch (err) {
      setError('Failed to update cultivator');
    }
    setLoading(false);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit}>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CultivatorEdit;
