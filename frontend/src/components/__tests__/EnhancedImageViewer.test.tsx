import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageViewer from '../ImageViewer';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>
  }
}));

describe('Enhanced Image Viewer', () => {
  const defaultProps = {
    documentUrl: '/test-image.jpg',
    documentId: 'test-image-123',
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    onZoomChange: jest.fn(),
    onPanChange: jest.fn(),
    onDocumentLoad: jest.fn(),
    onAnnotationCreate: jest.fn(),
    annotations: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders image viewer with toolbar controls', async () => {
    render(<ImageViewer {...defaultProps} />);

    // Should show loading initially
    expect(screen.getByText(/loading image/i)).toBeInTheDocument();

    // Find and trigger image load
    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText(/image viewer/i)).toBeInTheDocument();
    });

    // Check for all toolbar controls
    expect(screen.getByTitle(/zoom out/i)).toBeInTheDocument();
    expect(screen.getByTitle(/zoom in/i)).toBeInTheDocument();
    expect(screen.getByTitle(/fit to screen/i)).toBeInTheDocument();
    expect(screen.getByTitle(/reset view/i)).toBeInTheDocument();
    expect(screen.getByTitle(/add notes/i)).toBeInTheDocument();
  });

  test('auto-fits image on load', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <ImageViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    const img = screen.getByRole('img');
    
    // Mock image dimensions
    Object.defineProperty(img, 'naturalWidth', { value: 1000 });
    Object.defineProperty(img, 'naturalHeight', { value: 800 });
    
    // Mock container dimensions
    const container = img.closest('.flex-1');
    if (container) {
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });
    }

    fireEvent.load(img);

    await waitFor(() => {
      expect(mockOnZoomChange).toHaveBeenCalled();
      expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });

  test('zoom controls work correctly', async () => {
    const mockOnZoomChange = jest.fn();

    render(
      <ImageViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        zoomScale={1}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    // Test zoom in
    const zoomInButton = screen.getByTitle(/zoom in/i);
    fireEvent.click(zoomInButton);
    expect(mockOnZoomChange).toHaveBeenCalledWith(1.25);

    // Test zoom out
    const zoomOutButton = screen.getByTitle(/zoom out/i);
    fireEvent.click(zoomOutButton);
    expect(mockOnZoomChange).toHaveBeenCalledWith(0.75);
  });

  test('fit to screen functionality works', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <ImageViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByTitle(/fit to screen/i)).toBeInTheDocument();
    });

    const fitButton = screen.getByTitle(/fit to screen/i);
    fireEvent.click(fitButton);

    expect(mockOnZoomChange).toHaveBeenCalled();
    expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  test('annotation mode toggle works', async () => {
    render(<ImageViewer {...defaultProps} />);

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByTitle(/add notes/i)).toBeInTheDocument();
    });

    // Toggle annotation mode
    const annotationButton = screen.getByTitle(/add notes/i);
    fireEvent.click(annotationButton);

    await waitFor(() => {
      expect(screen.getByText(/click to add note/i)).toBeInTheDocument();
      expect(screen.getByTitle(/exit annotation mode/i)).toBeInTheDocument();
    });

    // Toggle back
    const exitButton = screen.getByTitle(/exit annotation mode/i);
    fireEvent.click(exitButton);

    await waitFor(() => {
      expect(screen.queryByText(/click to add note/i)).not.toBeInTheDocument();
      expect(screen.getByTitle(/add notes/i)).toBeInTheDocument();
    });
  });

  test('pan functionality works with mouse drag', async () => {
    const mockOnPanChange = jest.fn();

    render(
      <ImageViewer 
        {...defaultProps} 
        onPanChange={mockOnPanChange}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText(/image viewer/i)).toBeInTheDocument();
    });

    const container = img.closest('.flex-1');
    if (container) {
      // Start drag
      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      
      // Drag
      fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
      
      expect(mockOnPanChange).toHaveBeenCalled();
      
      // End drag
      fireEvent.mouseUp(container);
    }
  });

  test('handles image load error gracefully', async () => {
    render(<ImageViewer {...defaultProps} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText(/failed to load image/i)).toBeInTheDocument();
    });
  });

  test('reset view functionality works', async () => {
    const mockOnZoomChange = jest.fn();
    const mockOnPanChange = jest.fn();

    render(
      <ImageViewer 
        {...defaultProps} 
        onZoomChange={mockOnZoomChange}
        onPanChange={mockOnPanChange}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByTitle(/reset view/i)).toBeInTheDocument();
    });

    const resetButton = screen.getByTitle(/reset view/i);
    fireEvent.click(resetButton);

    expect(mockOnZoomChange).toHaveBeenCalledWith(1);
    expect(mockOnPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  test('annotation creation works in annotation mode', async () => {
    const mockOnAnnotationCreate = jest.fn();
    
    // Mock window.prompt
    window.prompt = jest.fn(() => 'Test note');

    render(
      <ImageViewer 
        {...defaultProps} 
        onAnnotationCreate={mockOnAnnotationCreate}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByTitle(/add notes/i)).toBeInTheDocument();
    });

    // Enable annotation mode
    const annotationButton = screen.getByTitle(/add notes/i);
    fireEvent.click(annotationButton);

    await waitFor(() => {
      expect(screen.getByText(/click to add note/i)).toBeInTheDocument();
    });

    // Click to add annotation
    const container = img.closest('.flex-1');
    if (container) {
      fireEvent.click(container, { clientX: 200, clientY: 200 });
    }

    expect(window.prompt).toHaveBeenCalledWith('Enter note text:');
    expect(mockOnAnnotationCreate).toHaveBeenCalled();
  });
});