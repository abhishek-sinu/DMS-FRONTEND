import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';
import SchemeList from './SchemeList';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('xlsx', () => ({ ...jest.requireActual('xlsx'), writeFile: jest.fn() }));

describe('Scheme XLS export', () => {
  let root;
  let container;
  let originalFetch;
  const schemes = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: `Seva ${index + 1}` }));

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    localStorage.setItem('token', 'test-token');
    XLSX.writeFile.mockClear();
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: schemes }) }));
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

  async function exportXls() {
    await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export XLS').click());
  }

  test('exports every page with numbering and scheme names in a real XLS workbook', async () => {
    await act(async () => root.render(<SchemeList />));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(10);
    await exportXls();
    const [workbook, filename, options] = XLSX.writeFile.mock.calls[0];
    expect(filename).toBe('schemes.xls');
    expect(options.bookType).toBe('biff8');
    const bytes = XLSX.write(workbook, { ...options, type: 'buffer' });
    const parsed = XLSX.read(bytes, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(parsed.Sheets.Schemes);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({ '#': 1, 'Scheme Name': 'Seva 1' });
    expect(rows[11]).toEqual({ '#': 12, 'Scheme Name': 'Seva 12' });
  });

  test('respects the current search', async () => {
    await act(async () => root.render(<SchemeList />));
    await act(async () => Simulate.change(container.querySelector('input[placeholder="Search schemes..."]'), {
      target: { value: 'seva 12' },
    }));
    await exportXls();
    const [workbook, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toBe('schemes_filtered.xls');
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Schemes)).toEqual([{ '#': 1, 'Scheme Name': 'Seva 12' }]);
  });

  test('reports no matching rows without downloading', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    await act(async () => root.render(<SchemeList />));
    await exportXls();
    expect(XLSX.writeFile).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toContain('No schemes match');
  });

  test('disables exporting when the list API fails', async () => {
    global.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Database unavailable' }) });
    await act(async () => root.render(<SchemeList />));
    expect(container.textContent).toContain('Database unavailable');
    expect(Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Export XLS').disabled).toBe(true);
  });

  test('surfaces file generation errors', async () => {
    XLSX.writeFile.mockImplementationOnce(() => { throw new Error('Download failed'); });
    await act(async () => root.render(<SchemeList />));
    await exportXls();
    expect(container.querySelector('[role="alert"]').textContent).toBe('Download failed');
  });
});
