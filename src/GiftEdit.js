import React, { useState } from 'react';

function GiftEdit({ gift, onSuccess, onCancel }) {
  const [phone, setPhone] = useState(gift.phone || '');
  const [giftName, setGiftName] = useState(gift.gift_name || '');
  const [description, setDescription] = useState(gift.description || '');
  const [value, setValue] = useState(gift.value || '');
  const [dateGiven, setDateGiven] = useState(
    gift.date_given ? gift.date_given.substring(0, 10) : ''
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSuccess({
        id: gift.id,
        phone,
        gift_name: giftName,
        description,
        value,
        date_given: dateGiven,
        created_at: gift.created_at
      });
    } catch (err) {
      setError('Failed to update gift with error: ' + err.message);
    }

    setLoading(false);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit}>
      
      {/* Phone */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          value={phone}
          disabled
          required
        />
      </div>

      {/* Gift Name */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Gift Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={giftName}
          onChange={e => setGiftName(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Value */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Value</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={value}
          onChange={e => setValue(e.target.value)}
          required
        />
      </div>

      {/* Date Given */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Date Given</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={dateGiven}
          onChange={e => setDateGiven(e.target.value)}
          required
        />
      </div>

      {/* Error */}
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {/* Buttons */}
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

export default GiftEdit;