import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';
import ImportDonations from './ImportDonations';

test('donation import sends scheme and comments and displays updated count', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
        'Receipt Number': 'R1', 'Phone Number': '123', 'Mode Of Payment': 'cash',
        'Scheme Name': 'New scheme', Comments: 'Updated comment',
    }]), 'Donations');
    const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ updated: 1 }) }));
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
        await act(async () => root.render(<ImportDonations />));
        const input = container.querySelector('input[type="file"]');
        Object.defineProperty(input, 'files', { value: [{ arrayBuffer: async () => data }] });
        await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
        expect(JSON.parse(global.fetch.mock.calls[0][1].body).donations[0]).toEqual({
            receipt_number: 'R1', phone_number: '123', mode_of_payment: 'cash',
            scheme_name: 'New scheme', comments: 'Updated comment',
        });
        expect(container.textContent).toContain('1 updated');
    } finally {
        await act(async () => root.unmount());
        container.remove();
        global.fetch = originalFetch;
        delete global.IS_REACT_ACT_ENVIRONMENT;
    }
});
