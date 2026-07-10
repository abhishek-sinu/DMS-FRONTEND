import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 500;

export default function ImportDonations({ onImport }) {
  const fileInputRef = useRef();
  const lastRows = useRef([]);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

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
          if (dbCol !== 'id') {
            let value = row[key];
            // Special handling for transaction_date: convert to YYYY-MM-DD for MySQL
            if (dbCol === 'transaction_date' && value != null && value !== '') {
              if (typeof value === 'number') {
                // Excel serial date: epoch is 1899-12-30
                const excelEpoch = new Date(1899, 11, 30);
                const d = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                value = `${year}-${month}-${day}`;
              } else if (typeof value === 'string') {
                // Handle DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD
                let match = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
                if (match) {
                  value = `${match[3]}-${match[2]}-${match[1]}`;
                }
                // If already YYYY-MM-DD, leave as-is
              }
            }
            mapped[dbCol] = value;
          }
        }
        return mapped;
      });
      lastRows.current = rows;
      const token = localStorage.getItem('token');

      // Split into batches to handle lakhs of records without hitting payload/timeout limits
      const batches = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        batches.push(rows.slice(i, i + BATCH_SIZE));
      }

      let totalInserted = 0, totalFailed = 0, totalSkipped = 0, totalNewDonors = 0;
      const allDetails = [];
      let rowOffset = 0;

      for (let b = 0; b < batches.length; b++) {
        setBatchProgress({ current: b + 1, total: batches.length });
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/donations/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ donations: batches[b] })
        });
        const result = await res.json();
        totalInserted += result.inserted || 0;
        totalFailed += result.failed || 0;
        totalSkipped += result.skipped || 0;
        totalNewDonors += result.newDonors || 0;
        if (result.details) {
          allDetails.push(...result.details.map(d => ({ ...d, row: d.row + rowOffset })));
        }
        rowOffset += batches[b].length;
      }

      setBatchProgress(null);
      const parts = [];
      if (totalInserted > 0) parts.push(`${totalInserted} inserted`);
      if (totalNewDonors > 0) parts.push(`${totalNewDonors} new donor(s) created`);
      if (totalSkipped > 0) parts.push(`${totalSkipped} skipped (missing receipt/phone)`);
      if (totalFailed > 0) parts.push(`${totalFailed} failed`);
      const message = rows.length === 0 ? 'No rows found.' : parts.length ? parts.join(', ') + '.' : 'No rows processed.';

      const aggregated = { message, inserted: totalInserted, failed: totalFailed, skipped: totalSkipped, newDonors: totalNewDonors, details: allDetails };
      setImportResult(aggregated);
      if (onImport) onImport();
    } catch (err) {
      setImportResult({ message: 'Import failed', error: err.message });
    }
    setLoading(false);
  };

  const downloadFailedRows = () => {
    if (!importResult || !importResult.details) return;
    const notInserted = importResult.details.filter(r => r.status !== 'inserted');
    if (notInserted.length === 0) return;
    const exportData = notInserted.map(r => {
      const original = lastRows.current[r.row - 1] || {};
      return {
        'Row #': r.row,
        'Receipt Number': original.receipt_number || '',
        'Phone Number': original.phone_number || '',
        'Transaction Date': original.transaction_date || '',
        'Instrument Number': original.instrument_number || '',
        'Donor Name': original.donor_name || '',
        'Amount': original.amount || '',
        'Scheme Name': original.scheme_name || '',
        'Mode Of Payment': original.mode_of_payment || '',
        'Status': r.status,
        'Reason': r.reason || 'Skipped',
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Not Inserted');
    XLSX.writeFile(wb, 'donations_not_inserted.xlsx');
  };

  const downloadSample = () => {
    const sampleData = [
      {
        'Receipt Number': 'R001',
        'Phone Number': '9876543210',
        'Transaction Date': '2026-04-01',
        'Instrument Number': 'INST1001',
        'Donor Name': 'John Doe',
        'Amount': 2000,
        'Scheme Name': 'Scheme A1',
        'Mode Of Payment': 'online',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');
    XLSX.writeFile(wb, 'sample_donations.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition"
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
        >
          {loading
            ? batchProgress
              ? `Importing... (${batchProgress.current}/${batchProgress.total})`
              : 'Importing...'
            : 'Import Donations (Excel)'}
        </button>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded font-semibold hover:bg-blue-600 transition text-sm"
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
            <span className={
              importResult.failed
                ? 'text-red-700 font-semibold'
                : importResult.skipped
                ? 'text-yellow-700 font-semibold'
                : 'text-green-700 font-semibold'
            }>
              {importResult.message}
            </span>
            <div className="flex items-center gap-2">
              {(importResult.failed > 0 || importResult.skipped > 0) && (
                <button
                  onClick={downloadFailedRows}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded font-semibold transition"
                  title="Download all skipped/failed rows as Excel"
                >
                  Download Not-Inserted Rows
                </button>
              )}
              <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">&times;</button>
            </div>
          </div>
          {importResult.details && importResult.details.length > 0 && (
            <>
              {importResult.skipped > 0 && (
                <div className="mt-2 text-sm text-yellow-700 font-medium">
                  {importResult.skipped} row(s) were skipped because they are missing Receipt Number or Phone Number.
                </div>
              )}
              {importResult.newDonors > 0 && (
                <div className="mt-2 text-sm text-blue-700 font-medium">
                  {importResult.newDonors} new donor(s) were automatically added to the Donor table.
                </div>
              )}
              <div className="max-h-40 overflow-y-auto overflow-x-auto mt-2 text-sm">
                <table className="min-w-[520px] border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border">Row</th>
                      <th className="py-1 px-2 border">Status</th>
                      <th className="py-1 px-2 border">New Donor</th>
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
                        <td className="py-1 px-2 border capitalize">{r.status}</td>
                        <td className="py-1 px-2 border text-center">
                          {r.donorCreated ? <span className="text-blue-600 font-semibold">Yes</span> : '-'}
                        </td>
                        <td className="py-1 px-2 border">{r.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
