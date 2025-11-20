import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnnotationOverlay from '../AnnotationOverlay';
import type { DocumentAnnotation, ImageAnnotation } from '../../contexts/AppContext';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AnnotationOverlay', () => {
  const mockDocumentAnnotation: DocumentAnnotation = {
    id: 'ann-1',
    documentId: 'doc-1',
    type: 'document',
    page: 1,
    xPercent: 50,
    yPercent: 50,
    content: 'Test annotation',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  };

  const mockImageAnnotation: ImageAnnotation = {
    id: 'ann-2',
    documentId: 'img-1',
    type: 'image',
    xPixel: 100,
    yPixel: 200,
    content: 'Image annotation',
    color: '#FF0000',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  };

  const defaultProps = {
    documentType: 'pdf' as const,
    currentPage: 1,
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 400,
    documentHeight: 300,
    scale: 1,
    panOffset: { x: 0, y: 0 },
    annotations: [],
    onAnnotationClick: vi.fn(),
    onCreateAnnotation: vi.fn(),
    onUpdateAnnotation: vi.fn(),
    onDeleteAnnotation: vi.fn(),
  };

  it('renders overlay with crosshair cursor', () => {
    const { container } = render(<AnnotationOverlay {...defaultProps} />);
    const overlay = container.querySelector('[style*="crosshair"]');
    expect(overlay).toBeTruthy();
  });

  it('renders annotation markers for document annotations on current page', () => {
    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation]}
      />
    );
    
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('filters out annotations from other pages', () => {
    const page2Annotation: DocumentAnnotation = {
      ...mockDocumentAnnotation,
      id: 'ann-2',
      page: 2,
    };

    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation, page2Annotation]}
      />
    );
    
    // Should only show 1 marker (page 1)
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.queryByText('2')).toBeNull();
  });

  it('renders image annotations', () => {
    render(
      <AnnotationOverlay
        {...defaultProps}
        documentType="image"
        annotations={[mockImageAnnotation]}
      />
    );
    
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('calls onAnnotationClick when marker is clicked', () => {
    const onAnnotationClick = vi.fn();
    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation]}
        onAnnotationClick={onAnnotationClick}
      />
    );
    
    const marker = screen.getByText('1');
    fireEvent.click(marker);
    
    expect(onAnnotationClick).toHaveBeenCalledWith('ann-1');
  });

  it('opens edit modal when marker is clicked', () => {
    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation]}
      />
    );
    
    const marker = screen.getByText('1');
    fireEvent.click(marker);
    
    // EditAnnotationModal should be rendered
    expect(screen.getByText('Edit Annotation')).toBeTruthy();
  });

  it('sorts annotations by creation date', () => {
    const olderAnnotation: DocumentAnnotation = {
      ...mockDocumentAnnotation,
      id: 'ann-old',
      createdAt: new Date('2024-01-14T10:30:00'),
    };

    const newerAnnotation: DocumentAnnotation = {
      ...mockDocumentAnnotation,
      id: 'ann-new',
      createdAt: new Date('2024-01-16T10:30:00'),
    };

    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[newerAnnotation, olderAnnotation, mockDocumentAnnotation]}
      />
    );
    
    // Should render 3 markers numbered 1, 2, 3 in chronological order
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('calls onUpdateAnnotation when edit modal saves', () => {
    const onUpdateAnnotation = vi.fn();
    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation]}
        onUpdateAnnotation={onUpdateAnnotation}
      />
    );
    
    // Click marker to open edit modal
    const marker = screen.getByText('1');
    fireEvent.click(marker);
    
    // Find and update the textarea
    const textarea = screen.getByDisplayValue('Test annotation') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated content' } });
    
    // Click save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(onUpdateAnnotation).toHaveBeenCalledWith('ann-1', { content: 'Updated content' });
  });

  it('calls onDeleteAnnotation when edit modal deletes', () => {
    const onDeleteAnnotation = vi.fn();
    render(
      <AnnotationOverlay
        {...defaultProps}
        annotations={[mockDocumentAnnotation]}
        onDeleteAnnotation={onDeleteAnnotation}
      />
    );
    
    // Click marker to open edit modal
    const marker = screen.getByText('1');
    fireEvent.click(marker);
    
    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByText('Yes, Delete');
    fireEvent.click(confirmButton);
    
    expect(onDeleteAnnotation).toHaveBeenCalledWith('ann-1');
  });
});
