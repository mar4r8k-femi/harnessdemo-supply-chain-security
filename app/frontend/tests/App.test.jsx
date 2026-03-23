import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../src/App';

// Stub the fetch calls so Dashboard doesn't fail on mount
beforeEach(() => {
  globalThis.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
});

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/SupplyWatch/i)).toBeTruthy();
  });
});
