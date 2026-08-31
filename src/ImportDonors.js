import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 500;

export default function ImportDonors({ onImport }) {
  const fileInputRef = useRef();
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
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);
      const headerMap = {
        'name': 'name',
        'Name': 'name',
        'initiated_name': 'initiated_name',
        'Initiated Name': 'initiated_name',
        'email': 'email',
        'Email': 'email',
        'phone': 'phone',
        'Phone': 'phone',
        'Phone Number': 'phone',
        'phone_number': 'phone',
        'date_of_birth': 'date_of_birth',
        'Date of Birth': 'date_of_birth',
        'DOB': 'date_of_birth',
        'dob': 'date_of_birth',
        'anniversary_date': 'anniversary_date',
        'Anniversary': 'anniversary_date',
        'Anniversary Date': 'anniversary_date',
        'pan_card': 'pan_card',
        'PAN Card': 'pan_card',
        'PAN': 'pan_card',
        'address_house': 'address_house',
        'Address House': 'address_house',
        'address_city': 'address_city',
        'Address City': 'address_city',
        'address_state': 'address_state',
        'Address State': 'address_state',
        'address_pin': 'address_pin',
        'Address Pin': 'address_pin',
        'address_line1': 'address_line1',
        'Address Line 1': 'address_line1',
        'address_line2': 'address_line2',
        'Address Line 2': 'address_line2',
        'post_office': 'post_office',
        'Post Office': 'post_office',
        'city': 'city',
        'City': 'city',
        'district': 'district',
        'District': 'district',
        'state': 'state',
        'State': 'state',
        'pin_code': 'pin_code',
        'PIN Code': 'pin_code',
        'PIN': 'pin_code',
        'country': 'country',
        'Country': 'country',
        'cultivator': 'cultivator',
        'Cultivator': 'cultivator',
        'cultivator_id': 'cultivator_id',
        'last_gift_details': 'last_gift_details',
        'Last Gift': 'last_gift_details',
        'Last Gift Details': 'last_gift_details',
      };
      const rows = rawRows.map(row => {
        const mapped = {};
        for (const key of Object.keys(row)) {
          const dbCol = headerMap[key] || headerMap[key.trim()] || key.toLowerCase().replace(/\s+/g, '_');
          if (dbCol !== 'id') {
            let val = row[key];
            // Convert Excel Date objects to YYYY-MM-DD strings
            if (val instanceof Date && !isNaN(val)) {
              val = val.toLocaleDateString('en-CA'); // produces YYYY-MM-DD
            }
            mapped[dbCol] = val;
          }
        }
        return mapped;
      });
      console.log('--- ImportDonors: Raw rows from Excel ---', rawRows);
      console.log('--- ImportDonors: Mapped rows ---', rows);
      const token = localStorage.getItem('token');

      // Split into batches to avoid 413 payload-too-large errors
      const batches = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        batches.push(rows.slice(i, i + BATCH_SIZE));
      }

      let totalInserted = 0, totalFailed = 0, totalUpdated = 0;
      const allDetails = [];
      let rowOffset = 0;

      for (let b = 0; b < batches.length; b++) {
        setBatchProgress({ current: b + 1, total: batches.length });
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/donors/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ donors: batches[b] })
        });
        console.log(`--- ImportDonors: Batch ${b + 1}/${batches.length} status ---`, res.status);
        const result = await res.json();
        totalInserted += result.inserted || 0;
        totalFailed += result.failed || 0;
        totalUpdated += result.updated || 0;
        if (result.details) {
          allDetails.push(...result.details.map(d => ({ ...d, row: d.row + rowOffset })));
        }
        rowOffset += batches[b].length;
      }

      setBatchProgress(null);
      const parts = [`${totalInserted} inserted`];
      if (totalUpdated > 0) parts.push(`${totalUpdated} updated (existing phone match)`);
      if (totalFailed > 0) parts.push(`${totalFailed} failed`);
      const message = rows.length === 0 ? 'No rows found.' :
        totalInserted === rows.length ? 'All rows inserted successfully.' :
        parts.join(', ') + '.';

      const aggregated = { message, inserted: totalInserted, failed: totalFailed, updated: totalUpdated, details: allDetails };
      console.log('--- ImportDonors: Aggregated result ---', aggregated);
      setImportResult(aggregated);
      if (onImport) onImport();
    } catch (err) {
      console.error('--- ImportDonors: Error ---', err);
      setImportResult({ message: 'Import failed', error: err.message });
    }
    setLoading(false);
    e.target.value = '';
  };

  const downloadSample = () => {
    const sampleData = [
      {
        'Name': 'John Doe',
        'Initiated Name': 'Janardana Das',
        'Email': 'john@example.com',
        'Phone': '9876543210',
        'Date of Birth': '1990-01-15',
        'Anniversary Date': '2015-06-20',
        'PAN Card': 'ABCDE1234F',
        'Address Line 1': '123, Sunrise Apartments',
        'Address Line 2': 'MG Road, Sector 5',
        'Post Office': 'Andheri',
        'City': 'Mumbai',
        'District': 'Mumbai Suburban',
        'State': 'Maharashtra',
        'PIN Code': '400001',
        'Country': 'India',
        'cultivator_id': 1,
        'Last Gift Details': 'Photo Frame',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donors');
    XLSX.writeFile(wb, 'sample_donors.xlsx');
  };

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition"
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
        >
          {loading
            ? batchProgress
              ? `Importing... (${batchProgress.current}/${batchProgress.total})`
              : 'Importing...'
            : 'Import Donors (Excel)'}
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
            <span className={(importResult.failed || importResult.updated) ? 'text-yellow-700 font-semibold' : 'text-green-700 font-semibold'}>
              {importResult.message}
            </span>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">&times;</button>
          </div>
          {importResult.details && importResult.details.filter(r => r.status === 'updated' || r.status === 'failed').length > 0 && (
            <div className="mt-2">
              {importResult.details.filter(r => r.status === 'updated').length > 0 && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-300 rounded text-blue-800 text-sm font-semibold">
                  Existing donors updated (matched by phone): Row {importResult.details.filter(r => r.status === 'updated').map(r => r.row).join(', ')}
                </div>
              )}
              {importResult.details.filter(r => r.status === 'failed').length > 0 && (
                <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-red-800 text-sm font-semibold">
                  Failed: {importResult.details.filter(r => r.status === 'failed').map(r => `Row ${r.row} — ${r.reason}`).join('; ')}
                </div>
              )}
              <div className="max-h-40 overflow-y-auto overflow-x-auto text-sm">
                <table className="min-w-[520px] border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border">Row</th>
                      <th className="py-1 px-2 border">Status</th>
                      <th className="py-1 px-2 border">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.details.filter(r => r.status !== 'inserted').map((r, i) => (
                      <tr key={i} className={r.status === 'failed' ? 'bg-red-100' : r.status === 'skipped' ? 'bg-yellow-100' : ''}>
                        <td className="py-1 px-2 border">{r.row}</td>
                        <td className="py-1 px-2 border">{r.status}</td>
                        <td className="py-1 px-2 border">{r.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}