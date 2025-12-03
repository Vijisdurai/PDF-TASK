import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import AnnotationOverlay from './annotation/AnnotationOverlay';
import type { Annotation } from '@/contexts/AppContext';

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
  onAnnotationCreate?: (xPercent: number, yPercent: number, content: string, color: string) => void;
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        setInitialLoadComplete(false);

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

  // Helper to calculate fit scales
  const getFitScale = useCallback((type: 'page' | 'width', baseWidth: number, baseHeight: number) => {
    if (!containerRef.current || baseWidth === 0 || baseHeight === 0) return 1;

    const container = containerRef.current;
    const padding = 48; // Chrome-like padding
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;

    const scaleX = availableWidth / baseWidth;
    const scaleY = availableHeight / baseHeight;

    if (type === 'width') {
      return scaleX;
    }
    return Math.min(scaleX, scaleY);
  }, []);

  // Handle initial load (Fit to Width) and special zoom commands
  useEffect(() => {
    if (state.pdfDocument && !state.isLoading && baseDocumentSize.width > 0) {
      // Initial Load -> Fit to Width
      if (!initialLoadComplete) {
        const fitWidthScale = getFitScale('width', baseDocumentSize.width, baseDocumentSize.height);
        if (fitWidthScale > 0) {
          onZoomChange(fitWidthScale);
          setInitialLoadComplete(true);
        }
      }
      // Handle special zoom commands from Header
      else if (zoomScale === -1) { // Fit to Page
        const scale = getFitScale('page', baseDocumentSize.width, baseDocumentSize.height);
        if (scale > 0) onZoomChange(scale);
      } else if (zoomScale === -2) { // Fit to Width
        const scale = getFitScale('width', baseDocumentSize.width, baseDocumentSize.height);
        if (scale > 0) onZoomChange(scale);
      }
    }
  }, [state.pdfDocument, state.isLoading, baseDocumentSize, zoomScale, initialLoadComplete, getFitScale, onZoomChange]);

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

      // Store base size (at scale=1) for fit calculations and annotations
      const baseViewport = page.getViewport({ scale: 1 });
      setBaseDocumentSize({ width: baseViewport.width, height: baseViewport.height });

      // Calculate viewport with zoom
      let effectiveScale = zoomScale;

      // Handle special scales locally for this render if they haven't been updated in state yet
      if (effectiveScale <= 0) {
        const baseW = baseViewport.width;
        const baseH = baseViewport.height;
        if (effectiveScale === -1) effectiveScale = getFitScale('page', baseW, baseH);
        else if (effectiveScale === -2) effectiveScale = getFitScale('width', baseW, baseH);
        else effectiveScale = 1; // Fallback
      }

      const viewport = page.getViewport({ scale: effectiveScale });

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
        viewport: viewport,
      };

      // Start render task
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (error) {
      if (error instanceof Error && error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    }
  }, [state.pdfDocument, currentPage, zoomScale, getFitScale]);

  // Trigger render when dependencies change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      if (containerRef.current) {
        setScrollStart({
          x: containerRef.current.scrollLeft,
          y: containerRef.current.scrollTop
        });
      }
    }
  }, [zoomScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      containerRef.current.scrollLeft = scrollStart.x - dx;
      containerRef.current.scrollTop = scrollStart.y - dy;
    }
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle annotation creation wrapper
  const handleAnnotationCreate = useCallback((x: number, y: number, content: string, color: string) => {
    if (onAnnotationCreate) {
      onAnnotationCreate(x, y, content, color);
    }
  }, [onAnnotationCreate]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-blue"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full overflow-auto bg-navy-900 flex justify-center p-8 ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative shadow-2xl" style={{ width: 'fit-content', height: 'fit-content' }}>
        <canvas ref={canvasRef} className="block bg-white" />

        {/* Annotation Overlay */}
        <AnnotationOverlay
          annotations={annotations}
          documentType="pdf"
          currentPage={currentPage}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
          documentWidth={documentDimensions.width}
          documentHeight={documentDimensions.height}
          onAnnotationClick={onAnnotationClick || (() => { })}
          onCreateAnnotation={handleAnnotationCreate}
        />
      </div>
    </div>
  );
};

export default PDFViewer;