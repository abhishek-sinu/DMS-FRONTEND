import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';
import DonationList from './DonationList';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('./DonationForm', () => () => null);
jest.mock('./DonationEdit', () => () => null);
jest.mock('./ImportDonations', () => () => <div>Import Donations</div>);
jest.mock('./receiptTemplate', () => ({ downloadDonationReceipt: jest.fn() }));
jest.mock('xlsx', () => ({ ...jest.requireActual('xlsx'), writeFile: jest.fn() }));

describe('Donation table export', () => {
  let container;
  let root;
  let originalFetch;
  let exportRequests;
  let failPage;
  let empty;
  const donation = {
    id: 1, receipt_number: '001', phone_number: '0123456789',
    transaction_date: '2026-10-17', instrument_number: '000123456789123456',
    donor_name: 'Test Donor', amount: '12.50', scheme_name: 'General',
    mode_of_payment: 'Cash',
  };

  beforeEach(async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    exportRequests = [];
    failPage = 0;
    empty = false;
    XLSX.writeFile.mockClear();
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn(async (url, options) => {
      if (url.includes('/api/temple-settings')) return { ok: true, json: async () => ({ data: {} }) };
      const params = new URL(url, 'http://localhost').searchParams;
      const page = Number(params.get('page'));
      if (params.get('limit') === '200') {
        exportRequests.push({ params, options });
        if (page === failPage) return { ok: false };
        return { ok: true, json: async () => ({
          items: empty ? [] : [{ ...donation, id: page, donor_name: page === 2 ? '=Unsafe, "Name"' : donation.donor_name }],
          pagination: { totalPages: empty ? 0 : 2 },
        }) };
      }
      return { ok: true, json: async () => ({
        items: [donation], pagination: { totalPages: 1, total: 1 },
      }) };
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<DonationList />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    global.fetch = originalFetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  async function clickExport(format) {
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === `Export ${format}`);
    await act(async () => button.click());
  }

  test.each(['XLS', 'CSV'])('exports all pages in %s with current search and table columns', async (format) => {
    await act(async () => Simulate.change(container.querySelector('input'), { target: { value: 'Cash & General' } }));
    await clickExport(format);
    expect(exportRequests).toHaveLength(2);
    exportRequests.forEach(({ params, options }, index) => {
      expect(params.get('page')).toBe(String(index + 1));
      expect(params.get('search')).toBe('Cash & General');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [workbook, filename, options] = XLSX.writeFile.mock.calls[0];
    expect(filename).toBe(`donations_filtered.${format.toLowerCase()}`);
    expect(options.bookType).toBe(format === 'XLS' ? 'biff8' : 'csv');
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Donations);
    expect(rows).toHaveLength(2);
    expect(Object.keys(rows[0])).toEqual([
      'Receipt Number', 'Phone Number', 'Transaction Date', 'Instrument Number',
      'Donor Name', 'Amount', 'Scheme Name', 'Mode Of Payment',
    ]);
    expect(rows[0]).toMatchObject({
      'Receipt Number': '001', 'Phone Number': '0123456789',
      'Instrument Number': '000123456789123456', 'Transaction Date': '17-10-2026', Amount: 12.5,
    });
    // Verify the chosen format can serialize and be read back as a real file.
    const bytes = XLSX.write(workbook, { ...options, type: 'buffer' });
    const roundTrip = XLSX.read(bytes, { type: 'buffer' });
    const exportedRows = XLSX.utils.sheet_to_json(roundTrip.Sheets[roundTrip.SheetNames[0]], { raw: false });
    expect(exportedRows).toHaveLength(2);
    expect(exportedRows[1]['Donor Name']).toBe(format === 'CSV' ? '\'=Unsafe, "Name"' : '=Unsafe, "Name"');
  });

  test('does not download a partial file when a later page fails', async () => {
    failPage = 2;
    await clickExport('CSV');
    expect(XLSX.writeFile).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toContain('Failed to fetch donations for export');
    expect(Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export CSV').disabled).toBe(false);
  });

  test('reports no matches without downloading an empty file', async () => {
    empty = true;
    await clickExport('XLS');
    expect(XLSX.writeFile).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toBe('No donations match the current search.');
  });
});
