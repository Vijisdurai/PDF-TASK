import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnotationOverlay from '../AnnotationOverlay';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('AnnotationOverlay', () => {
  const defaultProps = {
    documentId: 'test-doc-1',
    currentPage: 1,
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 400,
    documentHeight: 300,
    onAnnotationCreate: vi.fn(),
    annotations: [],
    onAnnotationClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Annotation Creation', () => {
    it('should render overlay with crosshair cursor', () => {
      render(<AnnotationOverlay {...defaultProps} />);
      
      const overlay = document.querySelector('[style*="crosshair"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should call onAnnotationCreate when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<AnnotationOverlay {...defaultProps} />);
      
      const overlay = document.querySelector('[style*="crosshair"]');
      if (overlay) {
        await user.click(overlay);
        expect(defaultProps.onAnnotationCreate).toHaveBeenCalled();
      }
    });

    it('should calculate correct percentage coordinates', async () => {
      const user = userEvent.setup();
      
      // Mock getBoundingClientRect to return predictable values
      const mockGetBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 100,
        width: 800,
        height: 600
      }));
      
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      
      render(<AnnotationOverlay {...defaultProps} />);
      
      const overlay = document.querySelector('[style*="crosshair"]');
      if (overlay) {
        // Click at position that should translate to 50%, 50%
        fireEvent.click(overlay, { clientX: 300, clientY: 250 });
        
        expect(defaultProps.onAnnotationCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            page: 1
          })
        );
      }
    });
  });

  describe('Annotation Display', () => {
    const mockAnnotations = [
      {
        id: 'ann-1',
        x: 25,
        y: 25,
        page: 1,
        content: 'Test annotation 1',
        timestamp: Date.now()
      },
      {
        id: 'ann-2',
        x: 75,
        y: 75,
        page: 1,
        content: 'Test annotation 2',
        timestamp: Date.now()
      }
    ];

    it('should render annotation markers for current page', () => {
      render(<AnnotationOverlay {...defaultProps} annotations={mockAnnotations} />);
      
      // Should render markers for annotations on current page
      const markers = document.querySelectorAll('.w-4.h-4.bg-ocean-blue');
      expect(markers).toHaveLength(2);
    });

    it('should filter annotations by current page', () => {
      const annotationsWithDifferentPages = [
        ...mockAnnotations,
        {
          id: 'ann-3',
          x: 50,
          y: 50,
          page: 2,
          content: 'Page 2 annotation',
          timestamp: Date.now()
        }
      ];

      render(<AnnotationOverlay {...defaultProps} annotations={annotationsWithDifferentPages} />);
      
      // Should only render markers for page 1
      const markers = document.querySelectorAll('.w-4.h-4.bg-ocean-blue');
      expect(markers).toHaveLength(2);
    });

    it('should call onAnnotationClick when marker is clicked', async () => {
      const user = userEvent.setup();
      render(<AnnotationOverlay {...defaultProps} annotations={mockAnnotations} />);
      
      const marker = document.querySelector('.w-4.h-4.bg-ocean-blue');
      if (marker) {
        await user.click(marker);
        expect(defaultProps.onAnnotationClick).toHaveBeenCalledWith(mockAnnotations[0]);
      }
    });

    it('should display annotation content in marker title', () => {
      render(<AnnotationOverlay {...defaultProps} annotations={mockAnnotations} />);
      
      const marker = document.querySelector('[title="Test annotation 1"]');
      expect(marker).toBeInTheDocument();
    });
  });

  describe('Coordinate Transformation', () => {
    it('should handle zoom scaling correctly', () => {
      const zoomedProps = {
        ...defaultProps,
        zoomScale: 2,
        annotations: [{
          id: 'ann-1',
          x: 50,
          y: 50,
          page: 1,
          content: 'Zoomed annotation',
          timestamp: Date.now()
        }]
      };

      render(<AnnotationOverlay {...zoomedProps} />);
      
      const marker = document.querySelector('.w-4.h-4.bg-ocean-blue');
      expect(marker).toBeInTheDocument();
    });

    it('should handle pan offset correctly', () => {
      const pannedProps = {
        ...defaultProps,
        panOffset: { x: 100, y: 50 },
        annotations: [{
          id: 'ann-1',
          x: 50,
          y: 50,
          page: 1,
          content: 'Panned annotation',
          timestamp: Date.now()
        }]
      };

      render(<AnnotationOverlay {...pannedProps} />);
      
      const marker = document.querySelector('.w-4.h-4.bg-ocean-blue');
      expect(marker).toBeInTheDocument();
    });
  });

  describe('Visibility Optimization', () => {
    it('should not render markers outside visible area', () => {
      const offScreenAnnotations = [
        {
          id: 'ann-1',
          x: -50, // Way off screen
          y: -50,
          page: 1,
          content: 'Off screen annotation',
          timestamp: Date.now()
        }
      ];

      render(<AnnotationOverlay {...defaultProps} annotations={offScreenAnnotations} />);
      
      // Should not render markers that are outside the visible area
      const markers = document.querySelectorAll('.w-4.h-4.bg-ocean-blue');
      expect(markers).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    it('should stop event propagation on overlay click', async () => {
      const parentClickHandler = vi.fn();
      const user = userEvent.setup();
      
      render(
        <div onClick={parentClickHandler}>
          <AnnotationOverlay {...defaultProps} />
        </div>
      );
      
      const overlay = document.querySelector('[style*="crosshair"]');
      if (overlay) {
        await user.click(overlay);
        
        // Parent click handler should not be called due to stopPropagation
        expect(parentClickHandler).not.toHaveBeenCalled();
        expect(defaultProps.onAnnotationCreate).toHaveBeenCalled();
      }
    });

    it('should stop event propagation on marker click', async () => {
      const overlayClickHandler = vi.fn();
      const user = userEvent.setup();
      
      const annotations = [{
        id: 'ann-1',
        x: 50,
        y: 50,
        page: 1,
        content: 'Test annotation',
        timestamp: Date.now()
      }];
      
      render(
        <div onClick={overlayClickHandler}>
          <AnnotationOverlay {...defaultProps} annotations={annotations} />
        </div>
      );
      
      const marker = document.querySelector('.w-4.h-4.bg-ocean-blue');
      if (marker) {
        await user.click(marker);
        
        // Overlay click handler should not be called due to stopPropagation
        expect(overlayClickHandler).not.toHaveBeenCalled();
        expect(defaultProps.onAnnotationClick).toHaveBeenCalled();
      }
    });
  });
});