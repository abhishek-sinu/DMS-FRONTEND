import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportGifts({ onImport }) {
  const fileInputRef = useRef();
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);

      // Header mapping
      const headerMap = {
        'phone': 'phone',
        'Phone': 'phone',
        'Phone Number': 'phone',

        'gift_name': 'gift_name',
        'Gift Name': 'gift_name',
        'Gift': 'gift_name',

        'description': 'description',
        'Description': 'description',

        'value': 'value',
        'Value': 'value',
        'Amount': 'value',

        'date_given': 'date_given',
        'Date Given': 'date_given',
        'Date': 'date_given',

        'created_at': 'created_at',
        'Created At': 'created_at'
      };

      // Normalize rows
      const rows = rawRows.map(row => {
        const mapped = {};

        for (const key of Object.keys(row)) {
          const dbCol =
            headerMap[key] ||
            headerMap[key.trim()] ||
            key.toLowerCase().replace(/\s+/g, '_');

          if (dbCol !== 'id') {
            mapped[dbCol] = row[key];
          }
        }

        // Default created_at if missing
        if (!mapped.created_at) {
          mapped.created_at = new Date().toISOString();
        }

        return mapped;
      });

      console.log('--- ImportGifts: Raw rows ---', rawRows);
      console.log('--- ImportGifts: Mapped rows ---', rows);

      // Send to backend
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/gifts/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ gifts: rows })
        }
      );

      console.log('--- ImportGifts: Response status ---', res.status);

      const result = await res.json();
      console.log('--- ImportGifts: Response body ---', result);

      setImportResult(result);
      if (onImport) onImport();

    } catch (err) {
      console.error('--- ImportGifts: Error ---', err);
      setImportResult({ message: 'Import failed', error: err.message });
    }

    setLoading(false);
    e.target.value = '';
  };

  // Sample Excel download
  const downloadSample = () => {
    const sampleData = [
      {
        'Phone': '9876543210',
        'Gift Name': 'Gold-Plated Idol',
        'Description': 'Gift for VIP donor',
        'Value': 25000,
        'Date Given': '2024-01-10',
        'Created At': '2024-01-10'
      },
      {
        'Phone': '9876543211',
        'Gift Name': 'Silver Puja Thali',
        'Description': 'Gift for major donor',
        'Value': 18000,
        'Date Given': '2024-01-15',
        'Created At': '2024-01-15'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gifts');
    XLSX.writeFile(wb, 'sample_gifts.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition"
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import Gifts (Excel)'}
        </button>

        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition text-sm"
          onClick={downloadSample}
        >
          Download Sample
        </button>

        <input
          type="file"
          accept=".xls,.xlsx"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {importResult && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {importResult.message}
            </span>
            <button
              onClick={() => setImportResult(null)}
              className="text-gray-400 hover:text-gray-700 text-lg font-bold"
            >
              ×
            </button>
          </div>

          {importResult.details && importResult.details.length > 0 && (
            <div className="max-h-40 overflow-y-auto overflow-x-auto mt-2 text-sm">
              <table className="min-w-[520px] border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 border">Row</th>
                    <th className="py-1 px-2 border">Status</th>
                    <th className="py-1 px-2 border">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.details.map((r, i) => (
                    <tr
                      key={i}
                      className={
                        r.status === 'failed'
                          ? 'bg-red-100'
                          : r.status === 'skipped'
                          ? 'bg-yellow-100'
                          : ''
                      }
                    >
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