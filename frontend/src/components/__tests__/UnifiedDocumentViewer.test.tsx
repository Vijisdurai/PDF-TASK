import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentViewer from '../DocumentViewer';

// Mock the context and hooks
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => ({
    state: {
      viewerState: {
        currentPage: 1,
        zoomScale: 1,
        panOffset: { x: 0, y: 0 },
        isLoading: false
      },
      isNotePanelOpen: false
    },
    dispatch: jest.fn()
  })
}));

jest.mock('../../hooks/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: [],
    createAnnotation: jest.fn(),
    updateAnnotation: jest.fn(),
    deleteAnnotation: jest.fn(),
    getAnnotationsForPage: () => [],
    error: null
  })
}));

// Mock mammoth
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn(() => Promise.resolve({
    value: '<h1>Test Document</h1><p>This is a test paragraph.</p><hr><h2>Page 2</h2><p>Second page content.</p>',
    messages: []
  }))
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('Unified Document Viewer', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders image viewer with zoom controls', async () => {
    render(
      <DocumentViewer
        documentId="test-image"
        documentUrl="/test.jpg"
        mimeType="image/jpeg"
        filename="test.jpg"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/image viewer/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    // Check for zoom controls
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  });

  test('handles image load and error states', async () => {
    const { rerender } = render(
      <DocumentViewer
        documentId="test-image"
        documentUrl="/test.jpg"
        mimeType="image/jpeg"
        filename="test.jpg"
      />
    );

    // Find the image element and simulate load
    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText(/image viewer/i)).toBeInTheDocument();
    });

    // Test error state
    fireEvent.error(img);
    await waitFor(() => {
      expect(screen.getByText(/failed to load image/i)).toBeInTheDocument();
    });
  });

  test('renders DOCX viewer with pagination', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-docx"
        documentUrl="/test.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename="test.docx"
      />
    );

    // Should show loading initially
    expect(screen.getByText(/converting word document/i)).toBeInTheDocument();

    // Wait for conversion to complete
    await waitFor(() => {
      expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
    });

    // Check for navigation controls
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();

    // Check for zoom controls
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  });

  test('DOCX pagination works correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-docx-nav"
        documentUrl="/test.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename="test.docx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
    });

    // Test next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/page 2 \/ 2/i)).toBeInTheDocument();
    });

    // Test previous page
    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
    });
  });

  test('handles DOCX conversion errors', async () => {
    const mammoth = require('mammoth');
    mammoth.convertToHtml.mockRejectedValueOnce(new Error('Conversion failed'));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-docx-error"
        documentUrl="/test.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename="test.docx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load document/i)).toBeInTheDocument();
    });
  });

  test('zoom controls work for all formats', async () => {
    const mockDispatch = jest.fn();
    
    // Mock the context to capture dispatch calls
    jest.mocked(require('../../contexts/AppContext').useAppContext).mockReturnValue({
      state: {
        viewerState: {
          currentPage: 1,
          zoomScale: 1,
          panOffset: { x: 0, y: 0 },
          isLoading: false
        },
        isNotePanelOpen: false
      },
      dispatch: mockDispatch
    });

    render(
      <DocumentViewer
        documentId="test-image-zoom"
        documentUrl="/test.jpg"
        mimeType="image/jpeg"
        filename="test.jpg"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    // Test zoom in
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_VIEWER_STATE',
      payload: { zoomScale: 1.25 }
    });

    // Test zoom out
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(zoomOutButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_VIEWER_STATE',
      payload: { zoomScale: 0.75 }
    });
  });

  test('shows unsupported file message for unknown formats', () => {
    render(
      <DocumentViewer
        documentId="test-unknown"
        documentUrl="/test.xyz"
        mimeType="application/unknown"
        filename="test.xyz"
      />
    );

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, PNG, JPG, JPEG, DOC, DOCX/i)).toBeInTheDocument();
  });
});