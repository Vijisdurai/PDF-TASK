import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { AppProvider } from '../contexts/AppContext';
import DocumentLibrary from '../pages/DocumentLibrary';

// Create mock functions that we can control
const mockRefreshDocuments = vi.fn();
const mockDeleteDocument = vi.fn();
const mockSelectDocument = vi.fn();

// Mock the hooks and services with default data
const mockUseDocuments = vi.fn(() => ({
  documents: [
    {
      id: 'test-uuid-001',
      filename: 'converted_abc123.docx',
      originalFilename: 'ProjectPlan.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024,
      uploadedAt: new Date('2023-01-01'),
      convertedPath: null
    },
    {
      id: 'test-uuid-002',
      filename: 'stored_xyz789.pdf',
      originalFilename: 'Report.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      uploadedAt: new Date('2023-01-02'),
      convertedPath: null
    }
  ],
  isLoading: false,
  error: null,
  refreshDocuments: mockRefreshDocuments,
  deleteDocument: mockDeleteDocument,
  selectDocument: mockSelectDocument
}));

vi.mock('../hooks/useDocuments', () => ({
  useDocuments: mockUseDocuments
}));

// Mock all database services to prevent real DB calls
vi.mock('../services/database', () => ({
  DatabaseService: {
    getAllDocuments: vi.fn(() => Promise.resolve([])),
    addDocument: vi.fn(() => Promise.resolve()),
    updateDocument: vi.fn(() => Promise.resolve()),
    deleteDocument: vi.fn(() => Promise.resolve()),
    getDocument: vi.fn(() => Promise.resolve(null))
  },
  db: {
    documents: {
      toArray: vi.fn(() => Promise.resolve([])),
      add: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve())
    }
  }
}));

// Mock the migration utility to prevent it from running
vi.mock('../utils/migrateDocuments', () => ({
  autoMigrateOnStartup: vi.fn(() => Promise.resolve()),
  migrateDocumentsWithOriginalFilename: vi.fn(() => Promise.resolve({ success: true, migratedCount: 0 }))
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('DocumentLibrary Filename Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default state
    mockUseDocuments.mockReturnValue({
      documents: [
        {
          id: 'test-uuid-001',
          filename: 'converted_abc123.docx',
          originalFilename: 'ProjectPlan.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024,
          uploadedAt: new Date('2023-01-01'),
          convertedPath: null
        },
        {
          id: 'test-uuid-002',
          filename: 'stored_xyz789.pdf',
          originalFilename: 'Report.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          uploadedAt: new Date('2023-01-02'),
          convertedPath: null
        }
      ],
      isLoading: false,
      error: null,
      refreshDocuments: mockRefreshDocuments,
      deleteDocument: mockDeleteDocument,
      selectDocument: mockSelectDocument
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders uploaded documents with correct original filenames', async () => {
    render(
      <TestWrapper>
        <DocumentLibrary />
      </TestWrapper>
    );

    // Use findByText with built-in timeout instead of waitFor
    expect(await screen.findByText('ProjectPlan.docx', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Report.pdf', {}, { timeout: 5000 })).toBeInTheDocument();
    
    // Ensure UUIDs and stored filenames are NOT displayed
    expect(screen.queryByText('test-uuid-001')).not.toBeInTheDocument();
    expect(screen.queryByText('test-uuid-002')).not.toBeInTheDocument();
    expect(screen.queryByText('converted_abc123.docx')).not.toBeInTheDocument();
    expect(screen.queryByText('stored_xyz789.pdf')).not.toBeInTheDocument();
  });

  test('renders original uploaded filename on dashboard', async () => {
    // Update mock for this specific test
    mockUseDocuments.mockReturnValue({
      documents: [
        {
          id: 'uuid-test-001',
          filename: 'internal-storage-c725ee4e.docx',
          originalFilename: 'DesignDoc.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048,
          uploadedAt: new Date('2023-01-01'),
          convertedPath: null
        }
      ],
      isLoading: false,
      error: null,
      refreshDocuments: mockRefreshDocuments,
      deleteDocument: mockDeleteDocument,
      selectDocument: mockSelectDocument
    });

    render(
      <TestWrapper>
        <DocumentLibrary />
      </TestWrapper>
    );

    // Should show the original filename, not the UUID-based storage filename
    expect(await screen.findByText('DesignDoc.docx', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('internal-storage-c725ee4e.docx')).not.toBeInTheDocument();
    expect(screen.queryByText('uuid-test-001')).not.toBeInTheDocument();
  });

  test('falls back to filename when originalFilename is missing', async () => {
    // Update mock for this specific test
    mockUseDocuments.mockReturnValue({
      documents: [
        {
          id: 'test-uuid-003',
          filename: 'fallback_document.pdf',
          originalFilename: undefined,
          mimeType: 'application/pdf',
          size: 1024,
          uploadedAt: new Date('2023-01-01'),
          convertedPath: null
        }
      ],
      isLoading: false,
      error: null,
      refreshDocuments: mockRefreshDocuments,
      deleteDocument: mockDeleteDocument,
      selectDocument: mockSelectDocument
    });

    render(
      <TestWrapper>
        <DocumentLibrary />
      </TestWrapper>
    );

    // Should fall back to filename when originalFilename is missing
    expect(await screen.findByText('fallback_document.pdf', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('test-uuid-003')).not.toBeInTheDocument();
  });

  test('displays document count correctly', async () => {
    render(
      <TestWrapper>
        <DocumentLibrary />
      </TestWrapper>
    );

    expect(await screen.findByText('Total Documents: 2', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});