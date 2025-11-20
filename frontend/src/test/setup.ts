import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock framer-motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      div: 'div',
      canvas: 'canvas',
      button: 'button',
      span: 'span',
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children, ...props }: any) => {
    return React.createElement('div', { 'data-testid': 'transform-wrapper', ...props }, children);
  },
  TransformComponent: ({ children, ...props }: any) => {
    return React.createElement('div', { 'data-testid': 'transform-component', ...props }, children);
  },
}));

// Mock IndexedDB operations to prevent real database calls
vi.mock('dexie', () => {
  const mockTable = {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(() => Promise.resolve()),
    put: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    get: vi.fn(() => Promise.resolve(undefined)),
    count: vi.fn(() => Promise.resolve(0)),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
        delete: vi.fn(() => Promise.resolve()),
        count: vi.fn(() => Promise.resolve(0))
      }))
    })),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([]))
      }))
    })),
    toCollection: vi.fn(() => ({
      modify: vi.fn(() => Promise.resolve())
    }))
  };

  const DexieClass = vi.fn(function(this: any) {
    this.version = vi.fn(() => ({
      stores: vi.fn(() => ({
        upgrade: vi.fn()
      }))
    }));
    this.open = vi.fn(() => Promise.resolve());
    this.documents = mockTable;
    this.annotations = mockTable;
    this.transaction = vi.fn((mode, tables, callback) => Promise.resolve(callback()));
    return this;
  });

  return {
    default: DexieClass,
    Dexie: DexieClass,
    Table: vi.fn()
  };
});

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 5,
      getPage: vi.fn(() => Promise.resolve({
        getViewport: vi.fn(() => ({ width: 800, height: 600 })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
      })),
    }),
  })),
  version: '3.0.0',
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = (props: any) => React.createElement('div', { 'data-testid': 'mock-icon', ...props });
  return new Proxy({}, {
    get: () => MockIcon,
  });
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Add React import for JSX
import React from 'react';