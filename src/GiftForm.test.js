import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import GiftForm from './GiftForm';

describe('Gift donor phone suggestions', () => {
  let container;
  let root;
  let originalFetch;
  let onSuccess;
  const donors = [{ id: 1, name: 'Test Donor', phone: '9876543210' }];

  beforeEach(async () => {
    jest.useFakeTimers();
    global.IS_REACT_ACT_ENVIRONMENT = true;
    originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => donors }));
    localStorage.setItem('token', 'test-token');
    onSuccess = jest.fn().mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<GiftForm onSuccess={onSuccess} />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    global.fetch = originalFetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
    jest.useRealTimers();
  });

  async function typePhone(value) {
    const input = container.querySelector('#gift-phone');
    await act(async () => {
      Simulate.focus(input);
      Simulate.change(input, { target: { value } });
    });
  }

  async function search() {
    await act(async () => jest.advanceTimersByTime(300));
  }

  test('waits for three digits and debounces database searches', async () => {
    await typePhone('98');
    await search();
    expect(global.fetch).not.toHaveBeenCalled();
    await typePhone('987');
    await typePhone('9876');
    expect(global.fetch).not.toHaveBeenCalled();
    await search();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=9876&limit=10'), expect.objectContaining({
      headers: { Authorization: 'Bearer test-token' },
    }));
    expect(container.textContent).toContain('Test Donor - 9876543210');
  });

  test.each(['9876543210', '07032241089'])('selects and submits phone %s unchanged', async (phone) => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [{ ...donors[0], phone }] });
    await typePhone(phone.slice(0, 3));
    await search();
    const suggestion = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Test Donor'));
    await act(async () => suggestion.click());
    expect(container.querySelector('#gift-phone').value).toBe(phone);
    expect(container.textContent).toContain('Selected donor: Test Donor');
    expect(container.querySelector('ul')).toBeNull();
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(inputs[1], { target: { value: 'Test gift' } });
      Simulate.change(inputs[3], { target: { value: '10' } });
      Simulate.change(inputs[4], { target: { value: '2026-10-17' } });
    });
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ phone, gift_name: 'Test gift', value: 10 }));
  });

  test.each([
    [' 07032241089 ', '07032241089'],
    ['9876543210', '9876543210'],
  ])('allows manual phone entry %s and preserves leading zeros', async (phone, expected) => {
    await typePhone(phone);
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(inputs[1], { target: { value: 'Test gift' } });
      Simulate.change(inputs[3], { target: { value: '10' } });
      Simulate.change(inputs[4], { target: { value: '2026-10-17' } });
    });
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ phone: expected }));
  });

  test.each(['703224108', '17032241089', '007032241089', '0703224108x'])('rejects invalid phone %s', async (phone) => {
    await typePhone(phone);
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      Simulate.change(inputs[1], { target: { value: 'Test gift' } });
      Simulate.change(inputs[3], { target: { value: '10' } });
      Simulate.change(inputs[4], { target: { value: '2026-10-17' } });
    });
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Enter a 10-digit phone number, optionally prefixed with 0.');
  });

  test('shows empty results and excludes name-only matches', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 2, name: '987 Charity', phone: '1234567890' }] });
    await typePhone('987');
    await search();
    expect(container.textContent).toContain('No matching donors found.');
    expect(container.querySelector('ul')).toBeNull();
  });

  test('surfaces API failures instead of reporting no matching donors', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    await typePhone('987');
    await search();
    expect(container.textContent).toContain('Failed to load donor suggestions.');
    expect(container.textContent).not.toContain('No matching donors found.');
  });

  test('ignores an older response after the phone changes', async () => {
    let resolveFirst;
    global.fetch.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    await typePhone('987');
    await search();
    await typePhone('123');
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] });
    await search();
    await act(async () => resolveFirst({ ok: true, json: async () => donors }));
    expect(container.textContent).not.toContain('Test Donor');
    expect(container.textContent).toContain('No matching donors found.');
  });

  test('Escape dismisses suggestions without changing the phone', async () => {
    await typePhone('987');
    await search();
    await act(async () => Simulate.keyDown(container.querySelector('#gift-phone'), { key: 'Escape' }));
    expect(container.querySelector('ul')).toBeNull();
    expect(container.querySelector('#gift-phone').value).toBe('987');
  });
});
