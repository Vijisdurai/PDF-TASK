import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    value: '<p>Mock DOCX content converted to HTML</p>',
    messages: []
  }))
}));

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 800, height: 600 })),
        render: jest.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
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

// Mock react-zoom-pan-pinch
jest.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => <div>{children()}</div>,
  TransformComponent: ({ children }: any) => <div>{children}</div>
}));

describe('Multi-Format Document Viewer', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders PDF viewer for PDF documents', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/pdf' },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-pdf"
        documentUrl="/test.pdf"
        mimeType="application/pdf"
        filename="test.pdf"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    });
  });

  test('renders image viewer for image documents', async () => {
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
    });
  });

  test('renders DOCX viewer for Word documents', async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/word document/i)).toBeInTheDocument();
    });
  });

  test('detects DOCX by file extension when MIME type is generic', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-docx-generic"
        documentUrl="/test.docx"
        mimeType="application/octet-stream"
        filename="test.docx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/word document/i)).toBeInTheDocument();
    });
  });

  test('shows unsupported message for unknown file types', async () => {
    render(
      <DocumentViewer
        documentId="test-unknown"
        documentUrl="/test.xyz"
        mimeType="application/unknown"
        filename="test.xyz"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF, PNG, JPG, JPEG, DOC, DOCX/i)).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(
      <DocumentViewer
        documentId="test-loading"
        documentUrl="/test.pdf"
        mimeType="application/pdf"
        filename="test.pdf"
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('handles DOCX conversion errors gracefully', async () => {
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
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  test('provides download option for failed DOCX documents', async () => {
    const mammoth = require('mammoth');
    mammoth.convertToHtml.mockRejectedValueOnce(new Error('Conversion failed'));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });

    render(
      <DocumentViewer
        documentId="test-docx-download"
        documentUrl="/test.docx"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename="test.docx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/download original/i)).toBeInTheDocument();
    });
  });
});