import React, { useState } from 'react';

function CultivatorForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSuccess({ name, phone });
      setName('');
      setPhone('');
    } catch (err) {
      setError('Failed to add cultivator');
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
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add Cultivator'}
      </button>
    </form>
  );
}

export default CultivatorForm;
