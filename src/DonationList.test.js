import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import DonationList from './DonationList';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('./DonationForm', () => () => null);
jest.mock('./DonationEdit', () => () => null);
jest.mock('./ImportDonations', () => () => <div>Import Donations</div>);
jest.mock('./receiptTemplate', () => ({ downloadDonationReceipt: jest.fn() }));

describe('Donation table export', () => {
  let container;
  let root;
  let originalFetch;
  let exportRequests;
  let downloadClick;
  let failure;
  let pending;
  let originalCreateURL;
  let originalRevokeURL;
  let empty;
  const donation = {
    id: 1, receipt_number: '001', phone_number: '0123456789',
    transaction_date: '2026-10-17', instrument_number: '000123456789123456',
    donor_name: 'Test Donor', amount: '12.50', scheme_name: 'General',
    mode_of_payment: 'Cash',
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    exportRequests = [];
    failure = false;
    pending = false;
    empty = false;
    originalCreateURL = URL.createObjectURL;
    originalRevokeURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:export');
    URL.revokeObjectURL = jest.fn();
    downloadClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn(async (url, options) => {
      if (url.includes('/api/temple-settings')) return { ok: true, json: async () => ({ data: {} }) };
      const params = new URL(url, 'http://localhost').searchParams;
      if (url.includes('/export/')) {
        exportRequests.push({ url, params, options });
        if (pending) return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
        if (failure || empty) return {
          ok: false, json: async () => ({
            error: empty
              ? 'No donations match the current search.' : 'Export failed. Please try again.'
          })
        };
        return { ok: true, blob: async () => new Blob(['exported file']) };
      }
      return {
        ok: true, json: async () => ({
          items: [donation], pagination: { totalPages: 1, total: 1 },
        })
      };
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<DonationList />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    container.remove();
    localStorage.clear();
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateURL;
    URL.revokeObjectURL = originalRevokeURL;
    downloadClick.mockRestore();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  async function clickExport(format) {
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === `Export ${format}`);
    await act(async () => button.click());
  }

  test.each(['XLSX', 'CSV'])('downloads %s with one authenticated request and current search', async (format) => {
    await act(async () => Simulate.change(container.querySelector('input'), { target: { value: 'Cash & General' } }));
    await clickExport(format);
    expect(exportRequests).toHaveLength(1);
    const { url, params, options } = exportRequests[0];
    expect(url).toContain(`/api/donations/export/${format.toLowerCase()}?`);
    expect(params.get('search')).toBe('Cash & General');
    expect(params.has('page')).toBe(false);
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(downloadClick).toHaveBeenCalledTimes(1);
    expect(downloadClick.mock.instances[0].download).toBe(`donations_filtered.${format.toLowerCase()}`);
    expect(container.querySelector('[role="status"]').textContent).toBe('Export downloaded.');
  });

  test('does not download a file when generation fails', async () => {
    failure = true;
    await clickExport('CSV');
    expect(downloadClick).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toContain('Export failed.');
    expect(Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export CSV').disabled).toBe(false);
  });

  test('reports no matches without downloading an empty file', async () => {
    empty = true;
    await clickExport('XLSX');
    expect(downloadClick).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toBe('No donations match the current search.');
  });

  test('cancels the request without downloading', async () => {
    pending = true;
    await clickExport('CSV');
    expect(container.querySelector('[role="status"]').textContent).toBe('Preparing export...');
    await act(async () => container.querySelector('[aria-label="Cancel export"]').click());
    expect(exportRequests[0].options.signal.aborted).toBe(true);
    expect(downloadClick).not.toHaveBeenCalled();
    expect(container.querySelector('[role="status"]').textContent).toBe('Export cancelled.');
  });

  test('shows byte download progress and saves only when the stream completes', async () => {
    let finish;
    const read = jest.fn()
      .mockResolvedValueOnce({ done: false, value: new Uint8Array([65, 66]) })
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const previousFetch = global.fetch;
    global.fetch = jest.fn((url, options) => url.includes('/export/') ? Promise.resolve({
      ok: true,
      body: { getReader: () => ({ read }) },
      headers: { get: name => name === 'Content-Length' ? '4' : 'text/csv' },
    }) : previousFetch(url, options));
    await clickExport('CSV');
    expect(container.querySelector('[role="status"]').textContent).toBe('Downloading 50%');
    expect(downloadClick).not.toHaveBeenCalled();
    await act(async () => finish({ done: true }));
    expect(downloadClick).toHaveBeenCalledTimes(1);
    act(() => jest.runOnlyPendingTimers());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  test('an interrupted download does not save a partial file', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn((url, options) => url.includes('/export/') ? Promise.resolve({
      ok: true,
      body: { getReader: () => ({ read: jest.fn().mockRejectedValue(new Error('Connection interrupted')) }) },
      headers: { get: () => null },
    }) : previousFetch(url, options));
    await clickExport('CSV');
    expect(downloadClick).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toBe('Connection interrupted');
  });
});
