import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import * as XLSX from 'xlsx';
import ImportDonors from './ImportDonors';

test('donor import maps address heading variants and preserves text PIN codes', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
        {
            Phone: '9876543210', 'Address line 1': 'House 12', 'ADDRESS LINE 2': 'Temple Road',
            'post office': 'Central PO', CITY: 'Hyderabad', District: 'District', STATE: 'Telangana',
            Pincode: '012345', COUNTRY: 'India', DOB: '15/01/1990', Anniversary: '20/06/2015',
        },
        {
            Phone: '9876543211', Address: 'Full Address', 'address house': 'Legacy House',
            'ADDRESS CITY': 'Legacy City', 'Address state': 'Legacy State', 'address pin': '023456',
        },
        {
            Phone: '9876543212', 'Address Line 1 (Flat / Door / Building)': 'Building 3',
            'Address Line 2 (Road / Street / Block / Sector)': 'Sector 4', 'Post Office': 'New PO',
            'City (Area / Locality)': 'New City', District: 'New District', State: 'New State',
            'PIN Code (6 Digits)': '034567', Country: 'India',
            'Date of Birth': '1991-02-16', 'Anniversary Date': '2016-07-21',
        },
    ]), 'Donors');
    const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ json: async () => ({ inserted: 0, updated: 3, failed: 0 }) }));
    global.IS_REACT_ACT_ENVIRONMENT = true;
    const onImport = jest.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
        await act(async () => root.render(<ImportDonors onImport={onImport} />));
        const input = container.querySelector('input[type="file"]');
        Object.defineProperty(input, 'files', { value: [{ arrayBuffer: async () => data }] });
        await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(payload.donors[0]).toEqual({
            phone: '9876543210', address_line1: 'House 12', address_line2: 'Temple Road',
            post_office: 'Central PO', city: 'Hyderabad', district: 'District', state: 'Telangana',
            pin_code: '012345', country: 'India', date_of_birth: '15/01/1990', anniversary_date: '20/06/2015',
        });
        expect(payload.donors[1]).toEqual({
            phone: '9876543211', address: 'Full Address', address_house: 'Legacy House',
            address_city: 'Legacy City', address_state: 'Legacy State', address_pin: '023456',
        });
        expect(payload.donors[2]).toEqual({
            phone: '9876543212', address_line1: 'Building 3', address_line2: 'Sector 4',
            post_office: 'New PO', city: 'New City', district: 'New District', state: 'New State',
            pin_code: '034567', country: 'India', date_of_birth: '1991-02-16', anniversary_date: '2016-07-21',
        });
        expect(onImport).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('3 updated (existing phone match)');
    } finally {
        await act(async () => root.unmount());
        container.remove();
        global.fetch = originalFetch;
        delete global.IS_REACT_ACT_ENVIRONMENT;
    }
});
