import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';
import DonorList from './DonorList';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('./DonorEdit', () => () => null);
jest.mock('./DonorForm', () => () => null);
jest.mock('./ImportDonors', () => () => null);
jest.mock('react-router-dom', () => ({ Link: ({ children }) => <span>{children}</span> }), { virtual: true });
jest.mock('xlsx', () => ({
    utils: {
        json_to_sheet: jest.fn(() => ({})),
        book_new: jest.fn(() => ({})),
        book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
}));

test('Export Page includes all saved address formats and separate location columns', async () => {
    XLSX.utils.json_to_sheet.mockReturnValue({});
    XLSX.utils.book_new.mockReturnValue({});
    const donors = [
        {
            id: 1, name: 'Structured Donor', address_line1: 'House 12', address_line2: 'Temple Road',
            post_office: 'Central PO', city: 'Hyderabad', district: 'District', state: 'Telangana',
            pin_code: '012345', country: 'India',
        },
        {
            id: 2, name: 'Legacy Donor', address_house: 'Legacy House', address_city: 'Legacy City',
            address_state: 'Legacy State', address_pin: '023456',
        },
        { id: 3, name: 'Free-text Donor', address: 'House 7, Main Road' },
        { id: 4, name: 'No Address Donor' },
    ];
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ json: async () => ({ items: donors, pagination: { total: 4, totalPages: 1 } }) }));
    global.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.setItem('token', 'test-token');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
        await act(async () => root.render(<DonorList />));
        const button = Array.from(container.querySelectorAll('button')).find(element => element.textContent.trim() === 'Export Page');
        expect(button).toBeDefined();
        await act(async () => button.click());
        const rows = XLSX.utils.json_to_sheet.mock.calls[0][0];
        expect(rows[0]).toMatchObject({
            Address: 'House 12 , Temple Road , Central PO , Hyderabad , District , Telangana , 012345 , India',
            City: 'Hyderabad', State: 'Telangana', 'PIN Code': '012345',
        });
        expect(rows[1]).toMatchObject({
            Address: 'Legacy House , Legacy City , Legacy State , India , 023456',
            City: 'Legacy City', State: 'Legacy State', 'PIN Code': '023456',
        });
        expect(rows[2]).toMatchObject({ Address: 'House 7, Main Road', 'PIN Code': '' });
        expect(rows[3]).toMatchObject({ Address: '', City: '', State: '', 'PIN Code': '' });
        expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'donors_filtered.xlsx');
    } finally {
        await act(async () => root.unmount());
        container.remove();
        localStorage.clear();
        global.fetch = originalFetch;
        delete global.IS_REACT_ACT_ENVIRONMENT;
    }
});
