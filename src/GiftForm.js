import React, { useState } from 'react';

function GiftForm({ onSuccess }) {
  const [phone, setPhone] = useState('');
  const [giftName, setGiftName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dateGiven, setDateGiven] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!phone || !giftName || !value || !dateGiven) {
      setError('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Invalid phone number');
      return;
    }

    if (value <= 0) {
      setError('Value must be positive');
      return;
    }

    setLoading(true);

    try {
      await onSuccess({
        phone: phone.trim(),
        gift_name: giftName.trim(),
        description: description.trim(),
        value: Number(value),
        date_given: dateGiven,
        created_at: new Date().toISOString()
      });

      // Reset form
      setPhone('');
      setGiftName('');
      setDescription('');
      setValue('');
      setDateGiven('');

    } catch (err) {
      setError('Failed to add gift');
    }

    setLoading(false);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit}>

      {/* Phone */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={phone}
          onChange={e => setPhone(e.target.value)}
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

      {/* Submit */}
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add Gift'}
      </button>
    </form>
  );
}

export default GiftForm;