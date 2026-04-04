import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportDonations({ onImport }) {
  const fileInputRef = useRef();
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setImportResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);
      // Map Excel column headers to DB column names
      const headerMap = {
        'id': 'id',
        'receipt_number': 'receipt_number',
        'phone_number': 'phone_number',
        'transaction_date': 'transaction_date',
        'instrument_number': 'instrument_number',
        'donor_name': 'donor_name',
        'amount': 'amount',
        'scheme_name': 'scheme_name',
        'mode_of_payment': 'mode_of_payment',
        // Common Excel-friendly header names
        'Receipt Number': 'receipt_number',
        'Phone Number': 'phone_number',
        'Transaction Date': 'transaction_date',
        'Instrument Number': 'instrument_number',
        'Donor Name': 'donor_name',
        'Amount': 'amount',
        'Scheme Name': 'scheme_name',
        'Mode Of Payment': 'mode_of_payment',
        'Mode of Payment': 'mode_of_payment',
      };
      const rows = rawRows.map(row => {
        const mapped = {};
        for (const key of Object.keys(row)) {
          const dbCol = headerMap[key] || headerMap[key.trim()] || key.toLowerCase().replace(/\s+/g, '_');
          if (dbCol !== 'id') mapped[dbCol] = row[key];
        }
        return mapped;
      });
      // Send to backend
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/donations/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ donations: rows })
      });
      const result = await res.json();
      setImportResult(result);
      if (onImport) onImport();
    } catch (err) {
      setImportResult({ message: 'Import failed', error: err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        className="bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition"
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
      >
        {loading ? 'Importing...' : 'Import Donations (Excel)'}
      </button>
      <input
        type="file"
        accept=".xls,.xlsx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {importResult && (
        <div className="mt-2">
          <div className={importResult.failed ? 'text-yellow-700' : 'text-green-700'}>
            {importResult.message}
          </div>
          {importResult.details && importResult.details.length > 0 && (
            <div className="max-h-40 overflow-y-auto mt-1 text-sm">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 border">Row</th>
                    <th className="py-1 px-2 border">Status</th>
                    <th className="py-1 px-2 border">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.details.map((r, i) => (
                    <tr key={i} className={r.status === 'failed' ? 'bg-red-100' : ''}>
                      <td className="py-1 px-2 border">{r.row}</td>
                      <td className="py-1 px-2 border">{r.status}</td>
                      <td className="py-1 px-2 border">{r.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
