import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportCultivators({ onImport }) {
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
      const headerMap = {
        'name': 'name', 'Name': 'name',
        'phone': 'phone', 'Phone': 'phone',
        'Phone Number': 'phone', 'phone_number': 'phone',
      };
      const rows = rawRows.map(row => {
        const mapped = {};
        for (const key of Object.keys(row)) {
          const dbCol = headerMap[key] || headerMap[key.trim()] || key.toLowerCase().replace(/\s+/g, '_');
          if (dbCol !== 'id') mapped[dbCol] = row[key];
        }
        return mapped;
      });
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cultivators/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cultivators: rows })
      });
      const result = await res.json();
      setImportResult(result);
      if (onImport) onImport();
    } catch (err) {
      setImportResult({ message: 'Import failed', error: err.message });
    }
    setLoading(false);
    e.target.value = '';
  };

  const downloadSample = () => {
    const sampleData = [
      { 'Name': 'Gouranga Prabhu', 'Phone': '9876543210' },
      { 'Name': 'Hari Prabhu', 'Phone': '9876543211' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cultivators');
    XLSX.writeFile(wb, 'sample_cultivators.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition"
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import (Excel)'}
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
            <span className={importResult.failed ? 'text-yellow-700 font-semibold' : 'text-green-700 font-semibold'}>
              {importResult.message}
            </span>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">&times;</button>
          </div>
          {importResult.details && importResult.details.length > 0 && (
            <div className="max-h-40 overflow-y-auto mt-2 text-sm">
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
