import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageViewer from '../ImageViewer';

// Mock react-zoom-pan-pinch
const mockTransformWrapper = vi.fn();
const mockTransformComponent = vi.fn();

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children, onTransformed, ...props }: any) => {
    mockTransformWrapper(props);
    
    // Mock the ref object that would be passed to children
    const mockRef = {
      state: {
        scale: props.initialScale || 1,
        positionX: props.initialPositionX || 0,
        positionY: props.initialPositionY || 0
      }
    };
    
    return (
      <div data-testid="transform-wrapper" {...props}>
        {typeof children === 'function' ? children(mockRef) : children}
      </div>
    );
  },
  TransformComponent: ({ children, ...props }: any) => {
    mockTransformComponent(props);
    return (
      <div data-testid="transform-component" {...props}>
        {children}
      </div>
    );
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ZoomIn: () => <span data-testid="zoom-in">+</span>,
  ZoomOut: () => <span data-testid="zoom-out">-</span>,
  RotateCcw: () => <span data-testid="rotate-ccw">↻</span>,
}));

describe('ImageViewer', () => {
  const defaultProps = {
    documentUrl: 'http://example.com/test.jpg',
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    onZoomChange: vi.fn(),
    onPanChange: vi.fn(),
    onDocumentLoad: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Loading', () => {
    it('should display loading state initially', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    it('should render image element with correct src', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // The image should be rendered even in loading state
      const image = document.querySelector('img');
      expect(image).toHaveAttribute('src', defaultProps.documentUrl);
      expect(image).toHaveAttribute('alt', 'Document');
    });

    it('should call onDocumentLoad when image loads successfully', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(defaultProps.onDocumentLoad).toHaveBeenCalled();
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
      }
    });

    it('should display error message when image fails to load', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      if (image) {
        fireEvent.error(image);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
          expect(screen.getByText('Failed to load image')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Zoom Controls', () => {
    it('should display current zoom percentage', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        await waitFor(() => {
          expect(screen.getByText('100%')).toBeInTheDocument();
        });
      }
    });

    it('should zoom in when zoom in button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        const zoomInButton = screen.getByTestId('zoom-in').closest('button');
        await user.click(zoomInButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.25);
      }
    });

    it('should zoom out when zoom out button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} zoomScale={1.5} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        await waitFor(() => {
          expect(screen.getByText('150%')).toBeInTheDocument();
        });

        const zoomOutButton = screen.getByTestId('zoom-out').closest('button');
        await user.click(zoomOutButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.25);
      }
    });

    it('should reset view when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        const resetButton = screen.getByTestId('rotate-ccw').closest('button');
        await user.click(resetButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1);
        expect(defaultProps.onPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
      }
    });

    it('should limit zoom to maximum scale', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} zoomScale={2.9} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        const zoomInButton = screen.getByTestId('zoom-in').closest('button');
        await user.click(zoomInButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(3);
      }
    });

    it('should limit zoom to minimum scale', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} zoomScale={0.3} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        const zoomOutButton = screen.getByTestId('zoom-out').closest('button');
        await user.click(zoomOutButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(0.25);
      }
    });
  });

  describe('Transform Wrapper Configuration', () => {
    it('should configure TransformWrapper with correct initial values', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          initialScale: 1,
          initialPositionX: 0,
          initialPositionY: 0,
          minScale: 0.25,
          maxScale: 3,
          centerOnInit: true,
          limitToBounds: false,
          smooth: true
        })
      );
    });

    it('should configure wheel zoom settings', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          wheel: {
            step: 0.1,
            smoothStep: 0.005,
            wheelDisabled: false
          }
        })
      );
    });

    it('should configure pinch zoom settings', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          pinch: { step: 5 }
        })
      );
    });

    it('should configure double click zoom', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          doubleClick: { disabled: false, step: 0.5 }
        })
      );
    });

    it('should configure velocity animation', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          velocityAnimation: {
            sensitivity: 1,
            animationTime: 400,
            animationType: "easeOut"
          }
        })
      );
    });
  });

  describe('Pan and Zoom State Management', () => {
    it('should initialize with provided zoom scale and pan offset', () => {
      render(<ImageViewer {...defaultProps} zoomScale={1.5} panOffset={{ x: 10, y: 20 }} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          initialScale: 1.5,
          initialPositionX: 10,
          initialPositionY: 20
        })
      );
    });

    it('should pass onTransformed callback to TransformWrapper', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          onTransformed: expect.any(Function)
        })
      );
    });
  });

  describe('Image Properties and Accessibility', () => {
    it('should render image with proper accessibility attributes', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      expect(image).toHaveAttribute('alt', 'Document');
      expect(image).toHaveAttribute('draggable', 'false');
    });

    it('should apply correct CSS classes and styles', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      expect(image).toHaveClass('max-w-full', 'max-h-full', 'object-contain', 'shadow-lg');
      expect(image).toHaveStyle({
        userSelect: 'none',
        pointerEvents: 'none'
      });
    });

    it('should render TransformComponent with correct wrapper classes', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(mockTransformComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          wrapperClass: 'w-full h-full flex items-center justify-center',
          contentClass: 'max-w-full max-h-full'
        })
      );
    });
  });

  describe('Toolbar Display', () => {
    it('should display "Image Viewer" label in toolbar', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load to show toolbar
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        expect(screen.getByText('Image Viewer')).toBeInTheDocument();
      }
    });

    it('should display all zoom control buttons', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load to show toolbar
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
        
        expect(screen.getByTestId('zoom-out').closest('button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-in').closest('button')).toBeInTheDocument();
        expect(screen.getByTestId('rotate-ccw').closest('button')).toBeInTheDocument();
      }
    });

    it('should update zoom percentage display when zoom changes', async () => {
      render(<ImageViewer {...defaultProps} zoomScale={2.5} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.getByText('250%')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle image load errors gracefully', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      if (image) {
        fireEvent.error(image);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
          expect(screen.getByText('Failed to load image')).toBeInTheDocument();
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });
      }
    });

    it('should not call onDocumentLoad when image fails to load', async () => {
      render(<ImageViewer {...defaultProps} />);
      
      const image = document.querySelector('img');
      if (image) {
        fireEvent.error(image);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
        });
        
        expect(defaultProps.onDocumentLoad).not.toHaveBeenCalled();
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup on component unmount', () => {
      const { unmount } = render(<ImageViewer {...defaultProps} />);
      
      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid zoom changes efficiently', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // Simulate image load
      const image = document.querySelector('img');
      if (image) {
        fireEvent.load(image);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
        });

        const zoomInButton = screen.getByTestId('zoom-in').closest('button');
        
        // Rapid clicks should all be handled
        await user.click(zoomInButton!);
        await user.click(zoomInButton!);
        await user.click(zoomInButton!);
        
        expect(defaultProps.onZoomChange).toHaveBeenCalledTimes(3);
      }
    });
  });
});