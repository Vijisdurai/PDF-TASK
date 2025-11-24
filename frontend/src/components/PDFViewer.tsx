import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';
import type { Annotation } from '../contexts/AppContext';

// Set up PDF.js worker with proper URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface PDFViewerProps {
  documentUrl: string;
  documentId: string;
  currentPage: number;
  zoomScale: number;
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
  onAnnotationCreate?: (xPercent: number, yPercent: number, content: string) => void;
  onAnnotationUpdate?: (id: string, content: string) => void;
  onAnnotationDelete?: (id: string) => void;
  annotations?: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
}

interface PDFViewerState {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  documentUrl,
  currentPage,
  zoomScale,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  onAnnotationCreate,
  annotations = [],
  onAnnotationClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const hasCenteredRef = useRef<string>(''); // Track which document has been centered
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<PDFViewerState>({
    pdfDocument: null,
    totalPages: 0,
    isLoading: true,
    error: null
  });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [documentDimensions, setDocumentDimensions] = useState({ width: 0, height: 0 });
  const [baseDocumentSize, setBaseDocumentSize] = useState({ width: 0, height: 0 }); // Size at scale=1

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch(documentUrl, { mode: "cors" });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Verify Content-Type before processing
        const contentType = response.headers.get("Content-Type");
        if (!contentType?.includes("application/pdf")) {
          const text = await response.text();
          console.error("Server returned non-PDF content:", text.slice(0, 200));
          throw new Error("Invalid response: not a PDF");
        }

        // Get binary data and load with PDF.js
        const arrayBuffer = await response.arrayBuffer();

        // Validate PDF signature
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-

        if (uint8Array.length < 5 || !pdfSignature.every((byte, i) => uint8Array[i] === byte)) {
          throw new Error("File does not have a valid PDF signature");
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        setState(prev => ({
          ...prev,
          pdfDocument: pdf,
          totalPages: pdf.numPages,
          isLoading: false
        }));

        if (onDocumentLoad) {
          onDocumentLoad(pdf.numPages);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);

        let errorMessage = 'Failed to display PDF — file may be missing or invalid.';
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('invalid pdf') || message.includes('pdf signature')) {
            errorMessage = 'The document is not a valid PDF file';
          } else if (message.includes('404') || message.includes('not found')) {
            errorMessage = 'Document not found';
          } else if (message.includes('500') || message.includes('server error')) {
            errorMessage = 'Server error while loading document';
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Network error while loading document';
          }
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
      }
    };

    if (documentUrl) {
      loadPDF();
    }
  }, [documentUrl, onDocumentLoad]);

  // Render current page with proper task cancellation
  const renderPage = useCallback(async () => {
    if (!state.pdfDocument || !canvasRef.current) return;

    try {
      // Cancel previous render task if still running
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await state.pdfDocument.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      // Calculate viewport with zoom
      const viewport = page.getViewport({ scale: zoomScale });

      // Store base size (at scale=1) for fit calculations and annotations
      const baseViewport = page.getViewport({ scale: 1 });
      setBaseDocumentSize({ width: baseViewport.width, height: baseViewport.height });

      // Set canvas dimensions to scaled size
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Update document dimensions for annotation overlay - use SCALED dimensions
      // so annotations scale with the canvas
      setDocumentDimensions({ width: viewport.width, height: viewport.height });

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Create render context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Start new render task
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
        renderTaskRef.current = null;

        // Center scroll after render completes (only on first load of each document)
        if (containerRef.current && hasCenteredRef.current !== documentUrl) {
          hasCenteredRef.current = documentUrl;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (containerRef.current) {
                const container = containerRef.current;
                const centerX = (container.scrollWidth - container.clientWidth) / 2;
                const centerY = (container.scrollHeight - container.clientHeight) / 2;
                container.scrollLeft = centerX;
                container.scrollTop = centerY;
              }
            });
          });
        }
      } catch (error: any) {
        // Ignore cancellation errors, log others
        if (error?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
        renderTaskRef.current = null;
      }
    } catch (error) {
      console.error('Error setting up page render:', error);
    }
  }, [state.pdfDocument, currentPage, zoomScale, documentUrl]);

  // Re-render when page, zoom, or document changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Cleanup render tasks on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, []);

  // Update container dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);



  // Handle mouse wheel for zoom (Ctrl+scroll)
  const handleWheel = useCallback((event: React.WheelEvent) => {
    // Only handle Ctrl/Cmd + scroll for zooming
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const prevScale = zoomScale;
      const newScale = Math.max(0.25, Math.min(3, prevScale + delta));

      if (newScale === prevScale) return;

      onZoomChange(newScale);
    }
    // Otherwise, let the browser handle normal scrolling (both vertical and horizontal)
  }, [zoomScale, onZoomChange]);

  // Drag scrolling handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return;

    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setScrollStart({ x: container.scrollLeft, y: container.scrollTop });
    event.preventDefault();
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    container.scrollLeft = scrollStart.x - deltaX;
    container.scrollTop = scrollStart.y - deltaY;
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);



  // Navigation functions





  // Fit to width - scales document to fit viewport width

  // Fit to page - scales document to fit entire page in viewport
  const handleFitToPage = useCallback(() => {
    if (baseDocumentSize.width === 0 || baseDocumentSize.height === 0 || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleX = availableWidth / baseDocumentSize.width;
    const scaleY = availableHeight / baseDocumentSize.height;

    // Use the smaller scale to ensure entire page fits
    const fitScale = Math.min(scaleX, scaleY, 3);

    if (fitScale > 0) {
      onZoomChange(fitScale);
    }
  }, [baseDocumentSize, onZoomChange]);

  // Legacy fit-to-screen (alias for fit-to-page)

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-2 h-2 bg-ocean-blue rounded-full mx-auto mb-4 opacity-75" />
          <p className="text-off-white text-sm">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-navy-800 scroll-smooth"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 min-h-full min-w-full" style={{
          display: 'flex',
          width: 'fit-content'
        }}>
          <div className="relative m-auto">
            <canvas
              ref={canvasRef}
              className="shadow-lg border border-navy-600"
              style={{ display: 'block' }}
            />

            {/* Annotation Overlay */}
            {onAnnotationCreate && documentDimensions.width > 0 && (
              <AnnotationOverlay
                annotations={annotations}
                documentType="pdf"
                currentPage={currentPage}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
                documentWidth={documentDimensions.width}
                documentHeight={documentDimensions.height}
                onAnnotationClick={(id) => {
                  const annotation = annotations.find(a => a.id === id);
                  if (annotation && onAnnotationClick) {
                    onAnnotationClick(annotation);
                  }
                }}
                onCreateAnnotation={(x, y, content) => {
                  if (onAnnotationCreate) {
                    onAnnotationCreate(x, y, content);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;