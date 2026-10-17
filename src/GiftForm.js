import React, { useEffect, useState } from 'react';

function GiftForm({ onSuccess }) {
  const [phone, setPhone] = useState('');
  const [giftName, setGiftName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dateGiven, setDateGiven] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [donorSuggestions, setDonorSuggestions] = useState([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [donorSearchError, setDonorSearchError] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    const search = phone.trim();
    setDonorSuggestions([]);
    setDonorSearchError('');
    setDonorSearchLoading(false);
    if (!phoneFocused || search.length < 3 || selectedDonor) return;

    let active = true;
    const controller = new AbortController();
    setDonorSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/donors?search=${encodeURIComponent(search)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load donor suggestions. Please try again.');
        const donors = await res.json();
        if (!Array.isArray(donors)) throw new Error('Invalid donor search response. Please try again.');
        if (active) {
          setDonorSuggestions(donors.filter(donor => donor.phone && String(donor.phone).includes(search)));
        }
      } catch (err) {
        if (active) setDonorSearchError(err.message || 'Failed to load donor suggestions.');
      } finally {
        if (active) setDonorSearchLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [phone, phoneFocused, selectedDonor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!phone || !giftName || !value || !dateGiven) {
      setError('Please fill all required fields');
      return;
    }

    if (!/^0?\d{10}$/.test(phone.trim())) {
      setError('Enter a 10-digit phone number, optionally prefixed with 0.');
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
      setSelectedDonor(null);
      setGiftName('');
      setDescription('');
      setValue('');
      setDateGiven('');

    } catch (err) {
      setError(err.message || 'Failed to add gift');
    }

    setLoading(false);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit}>

      {/* Phone */}
      <div className="mb-2" onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPhoneFocused(false);
      }}>
        <label htmlFor="gift-phone" className="block text-sm font-medium mb-1">Phone</label>
        <input
          id="gift-phone"
          type="tel"
          autoComplete="off"
          aria-describedby="gift-phone-status"
          className="w-full border rounded px-3 py-2"
          value={phone}
          onFocus={() => setPhoneFocused(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') setPhoneFocused(false);
          }}
          onChange={e => {
            setPhone(e.target.value);
            setSelectedDonor(null);
            setPhoneFocused(true);
          }}
          required
        />
        <div id="gift-phone-status" role="status" className="text-sm mt-1">
          {selectedDonor ? (
            <span className="text-green-700">Selected donor: {selectedDonor.name}</span>
          ) : phoneFocused && (
            phone.trim().length < 3 ? (
              <span className="text-gray-500">Type at least 3 digits to find a donor.</span>
            ) : donorSearchLoading ? (
              <span className="text-gray-500">Searching donors...</span>
            ) : donorSearchError ? (
              <span className="text-red-500">{donorSearchError}</span>
            ) : donorSuggestions.length === 0 ? (
              <span className="text-gray-500">No matching donors found.</span>
            ) : null
          )}
        </div>
        {phoneFocused && !selectedDonor && donorSuggestions.length > 0 && (
          <ul aria-label="Matching donors" className="mt-1 border rounded max-h-40 overflow-y-auto">
            {donorSuggestions.map(donor => (
              <li key={donor.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50"
                  onClick={() => {
                    setPhone(String(donor.phone));
                    setSelectedDonor(donor);
                    setPhoneFocused(false);
                  }}
                >
                  {donor.name} - {donor.phone}
                </button>
              </li>
            ))}
          </ul>
        )}
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
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Adding...
          </span>
        ) : 'Add Gift'}
      </button>
    </form>
  );
}

export default GiftForm;