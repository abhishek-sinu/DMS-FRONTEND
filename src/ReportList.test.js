import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import ReportList from './ReportList';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);

test('scheme dropdown loads available schemes and filters reports and exports', async () => {
    const originalFetch = global.fetch;
    const originalCreateURL = URL.createObjectURL;
    const originalRevokeURL = URL.revokeObjectURL;
    const downloadClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
    URL.createObjectURL = jest.fn(() => 'blob:report');
    URL.revokeObjectURL = jest.fn();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn(async url => {
        if (url.includes('/api/report/schemes')) return { ok: true, json: async () => ({ data: [{ id: 1, name: 'General' }, { id: 2, name: 'Life Member' }] }) };
        if (url.includes('/csv')) return { ok: true, blob: async () => new Blob(['report']) };
        return { ok: true, json: async () => ({ items: [], pagination: { total: 0, totalPages: 1 } }) };
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
        await act(async () => root.render(<ReportList />));
        const select = container.querySelector('#report-scheme');
        expect(Array.from(select.options).map(option => option.textContent)).toEqual(['All Schemes', 'General', 'Life Member']);
        expect(global.fetch.mock.calls.find(([url]) => url.includes('/api/report/schemes'))[1].headers.Authorization).toBe('Bearer test-token');
        await act(async () => Simulate.change(select, { target: { value: 'Life Member' } }));
        let request = global.fetch.mock.calls.filter(([url]) => url.includes('/api/report/donations?')).at(-1)[0];
        expect(new URL(request, 'http://localhost').searchParams.get('scheme')).toBe('Life Member');
        expect(new URL(request, 'http://localhost').searchParams.get('schemeMatch')).toBe('exact');
        await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Export CSV').click());
        request = global.fetch.mock.calls.find(([url]) => url.includes('/api/report/donations/csv'))[0];
        expect(new URL(request, 'http://localhost').searchParams.get('scheme')).toBe('Life Member');
        expect(new URL(request, 'http://localhost').searchParams.get('schemeMatch')).toBe('exact');
        await act(async () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Clear Filters').click());
        expect(select.value).toBe('');
        request = global.fetch.mock.calls.filter(([url]) => url.includes('/api/report/donations?')).at(-1)[0];
        expect(new URL(request, 'http://localhost').searchParams.has('scheme')).toBe(false);
    } finally {
        await act(async () => root.unmount());
        container.remove();
        localStorage.clear();
        global.fetch = originalFetch;
        URL.createObjectURL = originalCreateURL;
        URL.revokeObjectURL = originalRevokeURL;
        downloadClick.mockRestore();
        delete global.IS_REACT_ACT_ENVIRONMENT;
    }
});
