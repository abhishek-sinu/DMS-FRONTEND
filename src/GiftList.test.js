import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import GiftList from './GiftList';
import { Simulate } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('./ImportGifts', () => () => null);
jest.mock('xlsx', () => ({ ...jest.requireActual('xlsx'), writeFile: jest.fn() }));

describe('Gift list loading', () => {
  let container;
  let root;
  let originalFetch;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    XLSX.writeFile.mockClear();
    localStorage.setItem('token', 'test-token');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    global.fetch = originalFetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  test('renders saved gifts and preserves leading-zero phones', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
      data: [{ id: 3, phone: '07032241086', gift_name: 'Test Gift', value: '200.00', date_given: '2026-10-17' }],
    }) }));
    await act(async () => root.render(<GiftList />));
    expect(container.querySelector('tbody').textContent).toContain('07032241086');
    expect(container.querySelector('tbody').textContent).toContain('Test Gift');
  });

  test('shows server errors rather than silently displaying an empty table', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({
      error: 'Internal Server Error', message: 'Database unavailable',
    }) }));
    await act(async () => root.render(<GiftList />));
    expect(container.textContent).toContain('Failed to fetch gifts: Database unavailable');
  });

  test('reports invalid response shapes', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }));
    await act(async () => root.render(<GiftList />));
    expect(container.textContent).toContain('Invalid gift list response');
  });

  test.each(['XLS', 'CSV'])('exports all matching gifts across pages as %s', async (format) => {
    const gifts = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1, phone: '07032241086', gift_name: `Test Gift ${index}`,
      description: '=Special, "gift"', value: '200.50', date_given: '2026-10-17',
    }));
    gifts.push({ id: 99, phone: '9876543210', gift_name: 'Unrelated', value: '5' });
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: gifts }) }));
    await act(async () => root.render(<GiftList />));
    await act(async () => Simulate.change(container.querySelector('input'), { target: { value: 'Test Gift' } }));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(10);
    await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === `Export ${format}`).click());
    const [workbook, filename, options] = XLSX.writeFile.mock.calls[0];
    expect(filename).toBe(`gifts_filtered.${format.toLowerCase()}`);
    expect(options.bookType).toBe(format === 'XLS' ? 'biff8' : 'csv');
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Gifts);
    expect(rows).toHaveLength(12);
    expect(Object.keys(rows[0])).toEqual(['Phone', 'Gift Name', 'Description', 'Value', 'Date Given']);
    expect(rows[0]).toMatchObject({ Phone: '07032241086', Value: 200.5, 'Date Given': '17-10-2026' });
    const bytes = XLSX.write(workbook, { ...options, type: 'buffer' });
    const parsed = XLSX.read(bytes, { type: 'buffer' });
    const roundTrip = XLSX.utils.sheet_to_json(parsed.Sheets[parsed.SheetNames[0]], { raw: false });
    expect(roundTrip).toHaveLength(12);
    expect(roundTrip[0].Description).toBe(format === 'CSV' ? '\'=Special, "gift"' : '=Special, "gift"');
    if (format === 'XLS') expect(roundTrip[0].Phone).toBe('07032241086');
  });

  test('reports empty search results without downloading', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }));
    await act(async () => root.render(<GiftList />));
    await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export CSV').click());
    expect(XLSX.writeFile).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toBe('No gifts match the current search.');
  });

  test('shows export failures', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({
      data: [{ id: 3, phone: '07032241086', gift_name: 'Gift', value: 200 }],
    }) }));
    XLSX.writeFile.mockImplementationOnce(() => { throw new Error('Download failed'); });
    await act(async () => root.render(<GiftList />));
    await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export XLS').click());
    expect(container.querySelector('[role="alert"]').textContent).toBe('Download failed');
  });
});
