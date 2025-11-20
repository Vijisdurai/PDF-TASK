import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAnnotationModal } from '../EditAnnotationModal';
import type { DocumentAnnotation, ImageAnnotation } from '../../contexts/AppContext';

describe('EditAnnotationModal', () => {
  const mockDocumentAnnotation: DocumentAnnotation = {
    id: '1',
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
    id: '2',
    documentId: 'img-1',
    type: 'image',
    xPixel: 100,
    yPixel: 200,
    content: 'Image annotation',
    color: '#FF0000',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={false}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText('Edit Annotation')).toBeTruthy();
  });

  it('displays annotation content in textarea', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const textarea = screen.getByDisplayValue('Test annotation') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('Test annotation');
  });

  it('displays formatted timestamp', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText(/Jan 15, 2024/)).toBeTruthy();
  });

  it('displays creator name', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText('User')).toBeTruthy();
  });

  it('shows color picker for image annotations', () => {
    render(
      <EditAnnotationModal
        annotation={mockImageAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const colorInput = screen.getByLabelText('Marker Color') as HTMLInputElement;
    expect(colorInput).toBeTruthy();
    expect(colorInput.type).toBe('color');
    expect(colorInput.value).toBe('#ff0000');
  });

  it('does not show color picker for document annotations', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.queryByLabelText('Marker Color')).toBeNull();
  });

  it('calls onSave with updated content when Save is clicked', () => {
    const onSave = vi.fn();
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    
    const textarea = screen.getByDisplayValue('Test annotation') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated content' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith({ content: 'Updated content' });
  });

  it('calls onSave with updated content and color for image annotations', () => {
    const onSave = vi.fn();
    render(
      <EditAnnotationModal
        annotation={mockImageAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    
    const textarea = screen.getByDisplayValue('Image annotation') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated image annotation' } });
    
    const colorInput = screen.getByLabelText('Marker Color') as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: '#00ff00' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith({
      content: 'Updated image annotation',
      color: '#00ff00',
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={onClose}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('shows delete confirmation when Delete is clicked', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(screen.getByText('Are you sure?')).toBeTruthy();
    expect(screen.getByText('Yes, Delete')).toBeTruthy();
  });

  it('calls onDelete when delete is confirmed', () => {
    const onDelete = vi.fn();
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={onDelete}
      />
    );
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByText('Yes, Delete');
    fireEvent.click(confirmButton);
    
    expect(onDelete).toHaveBeenCalled();
  });

  it('disables Save button when content is empty', () => {
    render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const textarea = screen.getByDisplayValue('Test annotation') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '' } });
    
    const saveButton = screen.getByText('Save') as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('closes modal and calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <EditAnnotationModal
        annotation={mockDocumentAnnotation}
        isOpen={true}
        onClose={onClose}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    
    const backdrop = container.querySelector('.bg-black.bg-opacity-50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
