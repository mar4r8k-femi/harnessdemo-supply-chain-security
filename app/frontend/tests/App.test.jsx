import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../src/App';

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

    expect(screen.getByText('SupplyWatch')).toBeTruthy();
    expect(screen.getByText('Component Catalog')).toBeTruthy();
  });

  it('renders the sidebar navigation', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('SBOM Explorer')).toBeTruthy();
    expect(screen.getByText('Dependency Transparency Portal')).toBeTruthy();
  });
});
