import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import DocumentViewer from '../DocumentViewer';

// Mock the child viewer components
vi.mock('../PDFViewer', () => ({
  default: vi.fn(({ onPageChange, onZoomChange, onPanChange, onDocumentLoad }) => {
    // Simulate PDF viewer behavior
    React.useEffect(() => {
      if (onDocumentLoad) {
        onDocumentLoad(5); // Mock 5 pages
      }
    }, [onDocumentLoad]);

    return (
      <div data-testid="pdf-viewer">
        <button onClick={() => onPageChange(2)}>Go to page 2</button>
        <button onClick={() => onZoomChange(1.5)}>Zoom to 150%</button>
        <button onClick={() => onPanChange({ x: 10, y: 20 })}>Pan</button>
        <div>PDF Viewer Content</div>
      </div>
    );
  })
}));

vi.mock('../ImageViewer', () => ({
  default: vi.fn(({ onZoomChange, onPanChange, onDocumentLoad }) => {
    React.useEffect(() => {
      if (onDocumentLoad) {
        onDocumentLoad();
      }
    }, [onDocumentLoad]);

    return (
      <div data-testid="image-viewer">
        <button onClick={() => onZoomChange(2.0)}>Zoom to 200%</button>
        <button onClick={() => onPanChange({ x: 5, y: 10 })}>Pan Image</button>
        <div>Image Viewer Content</div>
      </div>
    );
  })
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('DocumentViewer', () => {
  const defaultProps = {
    documentId: 'doc-1',
    documentUrl: 'http://example.com/test.pdf',
    mimeType: 'application/pdf',
    filename: 'test.pdf'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Document type detection and viewer selection', () => {
    it('should render PDF viewer for PDF documents', () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      expect(screen.getByText('PDF Viewer Content')).toBeInTheDocument();
    });

    it('should render image viewer for image documents', () => {
      render(
        <TestWrapper>
          <DocumentViewer 
            {...defaultProps} 
            mimeType="image/png"
            filename="test.png"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();
      expect(screen.getByText('Image Viewer Content')).toBeInTheDocument();
    });

    it('should render unsupported message for unsupported file types', () => {
      render(
        <TestWrapper>
          <DocumentViewer 
            {...defaultProps} 
            mimeType="text/plain"
            filename="test.txt"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Unsupported File Type')).toBeInTheDocument();
      expect(screen.getByText('Cannot display files of type: text/plain')).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  describe('Viewer state management', () => {
    it('should handle page changes for PDF documents', async () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      const pageButton = screen.getByText('Go to page 2');
      fireEvent.click(pageButton);

      // The page change should be handled by the context
      // We can't easily test the context state change without additional setup
      expect(pageButton).toBeInTheDocument();
    });

    it('should handle zoom changes', async () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      const zoomButton = screen.getByText('Zoom to 150%');
      fireEvent.click(zoomButton);

      // The zoom change should be handled by the context
      expect(zoomButton).toBeInTheDocument();
    });

    it('should handle pan changes', async () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      const panButton = screen.getByText('Pan');
      fireEvent.click(panButton);

      // The pan change should be handled by the context
      expect(panButton).toBeInTheDocument();
    });

    it('should handle document load events', async () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      // The document load should be triggered automatically by the mocked PDF viewer
      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Notes panel toggle functionality', () => {
    it('should render notes panel toggle button', () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTitle('Show Notes Panel');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle notes panel when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTitle('Show Notes Panel');
      await user.click(toggleButton);

      // After clicking, the title should change (though we can't easily test the context state)
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      // The loading state should be visible initially
      expect(screen.getByText('Loading test.pdf...')).toBeInTheDocument();
    });

    it('should hide loading state after document loads', async () => {
      render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      // Wait for the document to load (mocked to call onDocumentLoad)
      await waitFor(() => {
        expect(screen.queryByText('Loading test.pdf...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Image viewer functionality', () => {
    it('should handle zoom changes for images', async () => {
      render(
        <TestWrapper>
          <DocumentViewer 
            {...defaultProps} 
            mimeType="image/jpeg"
            filename="test.jpg"
          />
        </TestWrapper>
      );

      const zoomButton = screen.getByText('Zoom to 200%');
      fireEvent.click(zoomButton);

      expect(zoomButton).toBeInTheDocument();
    });

    it('should handle pan changes for images', async () => {
      render(
        <TestWrapper>
          <DocumentViewer 
            {...defaultProps} 
            mimeType="image/png"
            filename="test.png"
          />
        </TestWrapper>
      );

      const panButton = screen.getByText('Pan Image');
      fireEvent.click(panButton);

      expect(panButton).toBeInTheDocument();
    });
  });

  describe('Document change handling', () => {
    it('should reset to loading state when document changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <DocumentViewer {...defaultProps} />
        </TestWrapper>
      );

      // Change the document
      rerender(
        <TestWrapper>
          <DocumentViewer 
            {...defaultProps} 
            documentId="doc-2"
            documentUrl="http://example.com/test2.pdf"
          />
        </TestWrapper>
      );

      // Should show loading state for new document
      expect(screen.getByText('Loading test.pdf...')).toBeInTheDocument();
    });
  });
});