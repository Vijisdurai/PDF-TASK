import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PDFViewer from '../PDFViewer';
import * as pdfjsLib from 'pdfjs-dist';

// Mock PDF.js
const mockPDFDocument = {
  numPages: 5,
  getPage: vi.fn()
};

const mockPage = {
  getViewport: vi.fn(),
  render: vi.fn()
};

const mockRenderTask = {
  promise: Promise.resolve()
};

const mockLoadingTask = {
  promise: Promise.resolve(mockPDFDocument)
};

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn(() => mockLoadingTask),
  version: '3.11.174'
 }));


// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    canvas: ({ children, ...props }: any) => <canvas {...props}>{children}</canvas>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  ZoomIn: () => <span data-testid="zoom-in">+</span>,
  ZoomOut: () => <span data-testid="zoom-out">-</span>,
  RotateCcw: () => <span data-testid="rotate-ccw">↻</span>,
}));

describe('PDFViewer', () => {
  const defaultProps = {
    documentUrl: 'http://example.com/test.pdf',
    currentPage: 1,
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    onPageChange: vi.fn(),
    onZoomChange: vi.fn(),
    onPanChange: vi.fn(),
    onDocumentLoad: vi.fn()
  };

  // Mock canvas context
  const mockContext = {
    clearRect: vi.fn(),
    getContext: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock to return successful loading
    vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask);
    
    // Setup PDF.js mocks
    mockPage.getViewport.mockReturnValue({
      width: 800,
      height: 600
    });
    mockPage.render.mockReturnValue(mockRenderTask);
    mockPDFDocument.getPage.mockResolvedValue(mockPage);
    
    // Mock canvas and context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
    mockContext.getContext = vi.fn(() => mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PDF Document Loading', () => {
    it('should load PDF document and call onDocumentLoad', async () => {
      render(<PDFViewer {...defaultProps} />);

      await waitFor(() => {
        expect(pdfjsLib.getDocument).toHaveBeenCalledWith(defaultProps.documentUrl);
        expect(defaultProps.onDocumentLoad).toHaveBeenCalledWith(5);
      });
    });

    it('should display loading state initially', () => {
      render(<PDFViewer {...defaultProps} />);
      
      expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
    });

    it('should handle PDF loading errors', async () => {
      const errorMessage = 'Failed to load PDF';
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.reject(new Error(errorMessage))
      } as any);

      render(<PDFViewer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load PDF document')).toBeInTheDocument();
      });
    });
  });

  describe('Page Navigation', () => {
    it('should display current page and total pages', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('1 / 5')).toBeInTheDocument();
      });
    });

    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const nextButton = screen.getByTestId('chevron-right').closest('button');
      await user.click(nextButton!);
      
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should navigate to previous page when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} currentPage={3} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
      });

      const prevButton = screen.getByTestId('chevron-left').closest('button');
      await user.click(prevButton!);
      
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should disable previous button on first page', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        const prevButton = screen.getByTestId('chevron-left').closest('button');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button on last page', async () => {
      render(<PDFViewer {...defaultProps} currentPage={5} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        const nextButton = screen.getByTestId('chevron-right').closest('button');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Zoom Controls', () => {
    it('should display current zoom percentage', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('should zoom in when zoom in button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const zoomInButton = screen.getByTestId('zoom-in').closest('button');
      await user.click(zoomInButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.25);
    });

    it('should zoom out when zoom out button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} zoomScale={1.5} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });

      const zoomOutButton = screen.getByTestId('zoom-out').closest('button');
      await user.click(zoomOutButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.25);
    });

    it('should reset view when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const resetButton = screen.getByTestId('rotate-ccw').closest('button');
      await user.click(resetButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1);
      expect(defaultProps.onPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should handle mouse wheel zoom with ctrl key', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      // Find the container with cursor style
      const container = document.querySelector('[style*="cursor"]');
      
      if (container) {
        fireEvent.wheel(container, { 
          deltaY: -100, 
          ctrlKey: true 
        });
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.1);
      }
    });

    it('should limit zoom to maximum scale', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} zoomScale={2.9} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const zoomInButton = screen.getByTestId('zoom-in').closest('button');
      await user.click(zoomInButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(3);
    });

    it('should limit zoom to minimum scale', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} zoomScale={0.3} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const zoomOutButton = screen.getByTestId('zoom-out').closest('button');
      await user.click(zoomOutButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(0.25);
    });
  });

  describe('Pan Functionality', () => {
    it('should handle mouse drag for panning', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const container = document.querySelector('[style*="cursor"]');
      
      if (container) {
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(container, { clientX: 150, clientY: 120 });
        
        expect(defaultProps.onPanChange).toHaveBeenCalledWith({ x: 50, y: 20 });
        
        fireEvent.mouseUp(container);
      }
    });

    it('should change cursor during drag operation', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const container = document.querySelector('[style*="cursor"]');
      
      if (container) {
        expect(container).toHaveStyle('cursor: grab');
        
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        expect(container).toHaveStyle('cursor: grabbing');
        
        fireEvent.mouseUp(container);
        expect(container).toHaveStyle('cursor: grab');
      }
    });
  });

  describe('PDF Rendering', () => {
    it('should render PDF page with correct viewport', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockPDFDocument.getPage).toHaveBeenCalledWith(1);
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1 });
      });
    });

    it('should re-render when page changes', async () => {
      const { rerender } = render(<PDFViewer {...defaultProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockPDFDocument.getPage).toHaveBeenCalledWith(1);
      });

      rerender(<PDFViewer {...defaultProps} currentPage={2} />);
      
      await waitFor(() => {
        expect(mockPDFDocument.getPage).toHaveBeenCalledWith(2);
      });
    });

    it('should re-render when zoom scale changes', async () => {
      const { rerender } = render(<PDFViewer {...defaultProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1 });
      });

      rerender(<PDFViewer {...defaultProps} zoomScale={1.5} />);
      
      await waitFor(() => {
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.5 });
      });
    });

    it('should clear canvas before rendering', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockContext.clearRect).toHaveBeenCalled();
      });
    });

    it('should handle rendering errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Set up the mock to fail rendering but succeed loading
      const renderError = new Error('Render failed');
      const failedRenderTask = {
        promise: Promise.reject(renderError)
      };
      
      // Handle the promise rejection to avoid unhandled rejection warnings
      failedRenderTask.promise.catch(() => {});
      
      mockPage.render.mockReturnValue(failedRenderTask);

      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load first
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error rendering page:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Coordinate Calculations', () => {
    it('should calculate viewport dimensions correctly with zoom', async () => {
      render(<PDFViewer {...defaultProps} zoomScale={2} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 2 });
      });
    });

    it('should maintain aspect ratio during zoom operations', async () => {
      mockPage.getViewport.mockReturnValue({
        width: 1600, // 800 * 2
        height: 1200 // 600 * 2
      });

      render(<PDFViewer {...defaultProps} zoomScale={2} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          expect(canvas.width).toBe(1600);
          expect(canvas.height).toBe(1200);
        }
      });
    });

    it('should handle pan offset calculations during drag', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const container = document.querySelector('[style*="cursor"]');
      
      if (container) {
        // Start drag at (100, 100)
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        
        // Move to (150, 120) - should calculate offset as (50, 20)
        fireEvent.mouseMove(container, { clientX: 150, clientY: 120 });
        
        expect(defaultProps.onPanChange).toHaveBeenCalledWith({ x: 50, y: 20 });
      }
    });

    it('should handle wheel zoom coordinate calculations', async () => {
      render(<PDFViewer {...defaultProps} />);
      
      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });
      
      const container = document.querySelector('[style*="cursor"]');
      
      if (container) {
        // Zoom in with wheel
        fireEvent.wheel(container, { 
          deltaY: -100, 
          ctrlKey: true 
        });
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.1);
        
        // Zoom out with wheel
        fireEvent.wheel(container, { 
          deltaY: 100, 
          ctrlKey: true 
        });
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(0.9);
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup on component unmount', () => {
      const { unmount } = render(<PDFViewer {...defaultProps} />);
      
      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid zoom changes efficiently', async () => {
      const user = userEvent.setup();
      render(<PDFViewer {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading PDF...')).not.toBeInTheDocument();
      });

      const zoomInButton = screen.getByTestId('zoom-in').closest('button');
      
      // Rapid clicks should all be handled
      await user.click(zoomInButton!);
      await user.click(zoomInButton!);
      await user.click(zoomInButton!);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledTimes(3);
    });
  });
});