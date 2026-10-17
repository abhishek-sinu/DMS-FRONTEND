import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Dashboard from './Dashboard';

jest.mock('./DashboardLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });

const addressCases = [
  ['structured', {
    address: 'Old address',
    address_line1: 'Flat 12',
    address_line2: 'Temple Road',
    post_office: 'Central PO',
    city: 'Hyderabad',
    district: 'Hyderabad District',
    state: 'Telangana',
    pin_code: '500001',
    country: 'India',
  }, 'Flat 12 , Temple Road , Central PO , Hyderabad , Hyderabad District , Telangana , 500001 , India'],
  ['legacy', {
    address_house: 'House 5',
    address_city: 'Hyderabad',
    address_state: 'Telangana',
    address_pin: '500002',
  }, 'House 5 , Hyderabad , Telangana , India , 500002'],
  ['free-text', { address: '10 Old Street' }, '10 Old Street'],
  ['partial', { address_line2: 'Temple Road', city: 'Hyderabad' }, 'Temple Road , Hyderabad'],
  ['missing', { address: null, address_line1: '', city: null }, '-'],
];

describe.each(['birthdays', 'anniversaries'])('Dashboard %s donor details', (type) => {
  let container;
  let root;
  let originalFetch;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    localStorage.setItem('token', `header.${btoa(JSON.stringify({ username: 'Tester', role_id: 1 }))}.signature`);
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

  test.each(addressCases)('shows the %s address after clicking View', async (_label, address, expected) => {
    global.fetch = jest.fn(async (url) => {
      if (url.endsWith('/api/dashboard/stats')) {
        return { ok: true, json: async () => ({ totalAmount: 0, upcomingBirthdays: 1, upcomingAnniversaries: 1 }) };
      }
      if (url.endsWith(`/api/dashboard/upcoming-${type}`)) {
        return { ok: true, json: async () => [{
          donor_id: 42, name: 'Test Donor', donor_name: 'Test Donor',
          person_type: 'donor', birthday: '2000-10-28', anniversary_date: '2022-10-28',
        }] };
      }
      if (url.endsWith('/api/donors/42')) {
        return { ok: true, json: async () => ({ id: 42, name: 'Test Donor', ...address, family_members: [] }) };
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await act(async () => root.render(<Dashboard />));
    const cardText = type === 'birthdays' ? 'Upcoming Birthdays (30 days)' : 'Upcoming Anniversaries (30 days)';
    const card = Array.from(container.querySelectorAll('p')).find(p => p.textContent === cardText);
    expect(card).toBeDefined();
    await act(async () => card.parentElement.parentElement.click());
    const viewButton = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'View');
    expect(viewButton).toBeDefined();
    await act(async () => viewButton.click());

    const addressLabel = Array.from(container.querySelectorAll('span')).find(span => span.textContent === 'Address:');
    expect(addressLabel).toBeDefined();
    expect(addressLabel.nextElementSibling.textContent).toBe(expected);
    expect(container.textContent).toContain('Donor Complete Details');
  });
});
