import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFViewer from '../PDFViewer';

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
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
    canvas: ({ children, ...props }: any) => <canvas {...props}>{children}</canvas>
  }
}));

// Mock AnnotationOverlay
jest.mock('../AnnotationOverlay', () => {
  return function MockAnnotationOverlay() {
    return <div data-testid="annotation-overlay">Annotation Overlay</div>;
  };
});

// Mock PDF validator utils
jest.mock('../utils/pdfValidator', () => ({
  fetchAndValidatePDF: jest.fn(),
  getPDFErrorMessage: jest.fn()
}));

describe('PDFViewer Integration Tests', () => {
  const defaultProps = {
    documentUrl: '/test-document.pdf',
    documentId: 'test-doc-123',
    currentPage: 1,
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    onPageChange: jest.fn(),
    onZoomChange: jest.fn(),
    onPanChange: jest.fn(),
    onDocumentLoad: jest.fn(),
    onAnnotationCreate: jest.fn(),
    onAnnotationUpdate: jest.fn(),
    onAnnotationDelete: jest.fn(),
    annotations: [],
    onAnnotationClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for PDF loading
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: {
          get: (header: string) => {
            if (header === 'Content-Type') return 'application/pdf';
            return null;
          }
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(2048)),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders without ReferenceError', async () => {
    expect(() => {
      render(<PDFViewer {...defaultProps} />);
    }).not.toThrow();

    // Should show loading initially
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  test('toolbar renders with all controls', async () => {
    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      // Wait for PDF to load and toolbar to appear
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    // Check for navigation buttons
    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // Check for zoom controls
    const zoomInButton = screen.getByTitle(/zoom in/i) || screen.getByRole('button', { name: /\+/i });
    const zoomOutButton = screen.getByTitle(/zoom out/i) || screen.getByRole('button', { name: /-/i });
    
    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();

    // Check for fit to screen button
    const fitButton = screen.getByTitle('Fit to Screen');
    expect(fitButton).toBeInTheDocument();

    // Check for reset button
    const resetButton = screen.getByTitle('Reset View (100%)');
    expect(resetButton).toBeInTheDocument();
  });

  test('fit to screen button works without errors', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <PDFViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    const fitButton = screen.getByTitle('Fit to Screen');
    
    // Should not throw ReferenceError
    expect(() => {
      fireEvent.click(fitButton);
    }).not.toThrow();

    // Should call zoom and pan change handlers
    await waitFor(() => {
      expect(mockOnZoomChange).toHaveBeenCalled();
      expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });

  test('zoom controls work properly', async () => {
    const mockOnZoomChange = jest.fn();

    render(
      <PDFViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        zoomScale={1}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    // Test zoom in
    const zoomInButton = screen.getByTitle(/zoom in/i) || screen.getByRole('button', { name: /\+/i });
    fireEvent.click(zoomInButton);
    
    expect(mockOnZoomChange).toHaveBeenCalledWith(1.25);

    // Test zoom out
    const zoomOutButton = screen.getByTitle(/zoom out/i) || screen.getByRole('button', { name: /-/i });
    fireEvent.click(zoomOutButton);
    
    expect(mockOnZoomChange).toHaveBeenCalledWith(0.75);
  });

  test('reset view works properly', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <PDFViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    const resetButton = screen.getByTitle('Reset View (100%)');
    fireEvent.click(resetButton);

    expect(mockOnZoomChange).toHaveBeenCalledWith(1);
    expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  test('layout structure prevents toolbar overlay', async () => {
    const { container } = render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    // Check for proper flex layout
    const mainContainer = container.querySelector('.flex.flex-col.h-full');
    expect(mainContainer).toBeInTheDocument();

    // Check toolbar has flex-shrink-0 class
    const toolbar = container.querySelector('.flex-shrink-0.z-10');
    expect(toolbar).toBeInTheDocument();

    // Check canvas container has flex-1 class
    const canvasContainer = container.querySelector('.flex-1.overflow-auto');
    expect(canvasContainer).toBeInTheDocument();
  });

  test('handles keyboard shortcuts without errors', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <PDFViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
    });

    // Test Ctrl+F (Fit to Screen)
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockOnZoomChange).toHaveBeenCalled();
      expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    // Test Ctrl+0 (Reset View)
    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    
    expect(mockOnZoomChange).toHaveBeenCalledWith(1);
    expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });
});