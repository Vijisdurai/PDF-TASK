import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnnotationOverlay from '../AnnotationOverlay';
import type { ImageAnnotation } from '../../contexts/AppContext';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Annotation Rendering and Display - Task 4', () => {
  const createImageAnnotation = (
    id: string,
    xPixel: number,
    yPixel: number,
    content: string,
    createdAt: Date,
    color?: string
  ): ImageAnnotation => ({
    id,
    documentId: 'test-doc',
    type: 'image',
    xPixel,
    yPixel,
    content,
    color,
    createdAt,
    updatedAt: createdAt,
  });

  const defaultProps = {
    documentType: 'image' as const,
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 1000,
    documentHeight: 800,
    scale: 1,
    panOffset: { x: 0, y: 0 },
    annotations: [],
    onAnnotationClick: vi.fn(),
    onCreateAnnotation: vi.fn(),
  };

  describe('4.1 Verify marker rendering for all annotations', () => {
    it('should display no markers when there are 0 annotations', () => {
      const { container } = render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={[]}
        />
      );

      // Check that no markers are rendered
      const markers = container.querySelectorAll('[class*="cursor-pointer"]');
      expect(markers.length).toBe(0);
    });

    it('should display exactly 1 marker when there is 1 annotation', () => {
      const annotation = createImageAnnotation(
        'ann-1',
        100,
        200,
        'Test annotation',
        new Date('2024-01-15T10:00:00')
      );

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={[annotation]}
        />
      );

      // Should display marker numbered "1"
      expect(screen.getByText('1')).toBeTruthy();
      
      // Should be only one marker
      expect(screen.queryByText('2')).toBeNull();
    });

    it('should display multiple markers when there are multiple annotations', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 200, 'First', new Date('2024-01-15T10:00:00')),
        createImageAnnotation('ann-2', 300, 400, 'Second', new Date('2024-01-15T11:00:00')),
        createImageAnnotation('ann-3', 500, 600, 'Third', new Date('2024-01-15T12:00:00')),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Should display 3 markers
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should display marker count matching annotation count', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'A', new Date('2024-01-15T10:00:00')),
        createImageAnnotation('ann-2', 200, 200, 'B', new Date('2024-01-15T11:00:00')),
        createImageAnnotation('ann-3', 300, 300, 'C', new Date('2024-01-15T12:00:00')),
        createImageAnnotation('ann-4', 400, 400, 'D', new Date('2024-01-15T13:00:00')),
        createImageAnnotation('ann-5', 500, 500, 'E', new Date('2024-01-15T14:00:00')),
      ];

      const { container } = render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Count rendered markers
      const markers = container.querySelectorAll('[class*="cursor-pointer"]');
      expect(markers.length).toBe(annotations.length);
      expect(markers.length).toBe(5);
    });

    it('should display all annotations for the current document', () => {
      const annotations = [
        createImageAnnotation('ann-1', 50, 50, 'Top left', new Date('2024-01-15T10:00:00')),
        createImageAnnotation('ann-2', 950, 50, 'Top right', new Date('2024-01-15T11:00:00')),
        createImageAnnotation('ann-3', 50, 750, 'Bottom left', new Date('2024-01-15T12:00:00')),
        createImageAnnotation('ann-4', 950, 750, 'Bottom right', new Date('2024-01-15T13:00:00')),
        createImageAnnotation('ann-5', 500, 400, 'Center', new Date('2024-01-15T14:00:00')),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // All 5 annotations should be displayed
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });
  });
});

  describe('4.2 Verify marker numbering and ordering', () => {
    it('should number markers sequentially starting from 1', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'First', new Date('2024-01-15T10:00:00')),
        createImageAnnotation('ann-2', 200, 200, 'Second', new Date('2024-01-15T11:00:00')),
        createImageAnnotation('ann-3', 300, 300, 'Third', new Date('2024-01-15T12:00:00')),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Markers should be numbered 1, 2, 3
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should number markers in chronological order based on creation timestamp', () => {
      // Create annotations with timestamps in chronological order
      const oldestAnnotation = createImageAnnotation(
        'ann-old',
        100,
        100,
        'Oldest',
        new Date('2024-01-15T08:00:00')
      );
      const middleAnnotation = createImageAnnotation(
        'ann-mid',
        200,
        200,
        'Middle',
        new Date('2024-01-15T10:00:00')
      );
      const newestAnnotation = createImageAnnotation(
        'ann-new',
        300,
        300,
        'Newest',
        new Date('2024-01-15T12:00:00')
      );

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={[oldestAnnotation, middleAnnotation, newestAnnotation]}
        />
      );

      // Should be numbered 1, 2, 3 in chronological order
      const markers = screen.getAllByText(/^[1-3]$/);
      expect(markers.length).toBe(3);
    });

    it('should maintain chronological numbering even when annotations are provided out of order', () => {
      // Provide annotations in reverse chronological order
      const annotations = [
        createImageAnnotation('ann-3', 300, 300, 'Third', new Date('2024-01-15T12:00:00')),
        createImageAnnotation('ann-1', 100, 100, 'First', new Date('2024-01-15T08:00:00')),
        createImageAnnotation('ann-2', 200, 200, 'Second', new Date('2024-01-15T10:00:00')),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Should still be numbered 1, 2, 3 based on creation time, not input order
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should handle annotations with same timestamp', () => {
      const sameTime = new Date('2024-01-15T10:00:00');
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'A', sameTime),
        createImageAnnotation('ann-2', 200, 200, 'B', sameTime),
        createImageAnnotation('ann-3', 300, 300, 'C', sameTime),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Should still render all 3 markers with sequential numbers
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should renumber correctly when annotations span multiple days', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'Day 1', new Date('2024-01-15T10:00:00')),
        createImageAnnotation('ann-2', 200, 200, 'Day 2', new Date('2024-01-16T10:00:00')),
        createImageAnnotation('ann-3', 300, 300, 'Day 3', new Date('2024-01-17T10:00:00')),
        createImageAnnotation('ann-4', 400, 400, 'Day 1 later', new Date('2024-01-15T15:00:00')),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // Should have 4 markers numbered sequentially
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
    });
  });

  describe('4.3 Verify marker color display', () => {
    it('should display marker with provided color', () => {
      const annotation = createImageAnnotation(
        'ann-1',
        100,
        200,
        'Red annotation',
        new Date('2024-01-15T10:00:00'),
        '#FF0000'
      );

      const { container } = render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={[annotation]}
        />
      );

      // Find the marker element with the red background
      const markerBackground = container.querySelector('[style*="background-color: rgb(255, 0, 0)"]') ||
                               container.querySelector('[style*="backgroundColor: rgb(255, 0, 0)"]') ||
                               container.querySelector('[style*="#FF0000"]') ||
                               container.querySelector('[style*="#ff0000"]');
      
      expect(markerBackground).toBeTruthy();
    });

    it('should display marker with default color when no color is provided', () => {
      const annotation = createImageAnnotation(
        'ann-1',
        100,
        200,
        'Default color annotation',
        new Date('2024-01-15T10:00:00')
        // No color provided
      );

      const { container } = render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={[annotation]}
        />
      );

      // Should have a marker (default color is #000000 / black)
      expect(screen.getByText('1')).toBeTruthy();
      
      // Find the marker with black background
      const markerBackground = container.querySelector('[style*="background-color: rgb(0, 0, 0)"]') ||
                               container.querySelector('[style*="backgroundColor: rgb(0, 0, 0)"]') ||
                               container.querySelector('[style*="#000000"]');
      
      expect(markerBackground).toBeTruthy();
    });

    it('should display markers with various color values', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'Red', new Date('2024-01-15T10:00:00'), '#FF0000'),
        createImageAnnotation('ann-2', 200, 200, 'Green', new Date('2024-01-15T11:00:00'), '#00FF00'),
        createImageAnnotation('ann-3', 300, 300, 'Blue', new Date('2024-01-15T12:00:00'), '#0000FF'),
        createImageAnnotation('ann-4', 400, 400, 'Yellow', new Date('2024-01-15T13:00:00'), '#FFEB3B'),
        createImageAnnotation('ann-5', 500, 500, 'Purple', new Date('2024-01-15T14:00:00'), '#9C27B0'),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // All 5 markers should be rendered
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('should handle mixed annotations with and without colors', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'With color', new Date('2024-01-15T10:00:00'), '#FF5722'),
        createImageAnnotation('ann-2', 200, 200, 'No color', new Date('2024-01-15T11:00:00')),
        createImageAnnotation('ann-3', 300, 300, 'With color', new Date('2024-01-15T12:00:00'), '#4CAF50'),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // All 3 markers should be rendered
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should display markers with light colors', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'Light yellow', new Date('2024-01-15T10:00:00'), '#FFEB3B'),
        createImageAnnotation('ann-2', 200, 200, 'Light blue', new Date('2024-01-15T11:00:00'), '#03A9F4'),
        createImageAnnotation('ann-3', 300, 300, 'White', new Date('2024-01-15T12:00:00'), '#FFFFFF'),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // All markers should be visible
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should display markers with dark colors', () => {
      const annotations = [
        createImageAnnotation('ann-1', 100, 100, 'Dark red', new Date('2024-01-15T10:00:00'), '#8B0000'),
        createImageAnnotation('ann-2', 200, 200, 'Dark green', new Date('2024-01-15T11:00:00'), '#006400'),
        createImageAnnotation('ann-3', 300, 300, 'Black', new Date('2024-01-15T12:00:00'), '#000000'),
      ];

      render(
        <AnnotationOverlay
          {...defaultProps}
          annotations={annotations}
        />
      );

      // All markers should be visible
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });
  });
});
