import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';

// Set up PDF.js worker with proper URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface AnnotationPoint {
  id: string;
  xPercent: number; // Percentage-based coordinate (0-100)
  yPercent: number; // Percentage-based coordinate (0-100)
  page: number; // Page number (1-based)
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PDFViewerProps {
  documentUrl: string;
  documentId: string;
  currentPage: number;
  zoomScale: number;
  panOffset: { x: number; y: number };
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onPanChange: (offset: { x: number; y: number }) => void;
  onDocumentLoad?: (totalPages: number) => void;
  onAnnotationCreate?: (annotation: Omit<AnnotationPoint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate?: (id: string, content: string) => void;
  onAnnotationDelete?: (id: string) => void;
  annotations?: AnnotationPoint[];
  onAnnotationClick?: (annotation: AnnotationPoint) => void;
}

interface PDFViewerState {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  documentUrl,
  documentId,
  currentPage,
  zoomScale,
  panOffset,
  onPageChange,
  onZoomChange,
  onPanChange,
  onDocumentLoad,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  annotations = [],
  onAnnotationClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [state, setState] = useState<PDFViewerState>({
    pdfDocument: null,
    totalPages: 0,
    isLoading: true,
    error: null
  });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [documentDimensions, setDocumentDimensions] = useState({ width: 0, height: 0 });

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
      const context = canvas.getContext('2d');

      if (!context) return;

      // Calculate viewport with zoom
      const viewport = page.getViewport({ scale: zoomScale });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Update document dimensions for annotation overlay
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
  }, [state.pdfDocument, currentPage, zoomScale]);

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

  // Enable panning when zoomed in (not at default 1.0 scale)
  const isPannable = zoomScale !== 1.0;

  // Handle mouse wheel zoom with smooth animation
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.25, Math.min(3, zoomScale + delta));
      onZoomChange(newScale);
    }
  }, [zoomScale, onZoomChange]);

  // Handle mouse drag for panning (only when PDF is larger than container)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isPannable) return;
    setIsDragging(true);
    setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
  }, [isPannable, panOffset]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !isPannable) return;

    const newOffset = {
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    };
    onPanChange(newOffset);
  }, [isDragging, isPannable, dragStart, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < state.totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(3, zoomScale + 0.25);
    onZoomChange(newScale);
  }, [zoomScale, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(0.25, zoomScale - 0.25);
    onZoomChange(newScale);
  }, [zoomScale, onZoomChange]);

  const handleResetView = useCallback(() => {
    onZoomChange(1);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  // Calculate fit-to-screen scale
  const handleFitToScreen = useCallback(async () => {
    if (!state.pdfDocument || !containerRef.current) return;

    try {
      const page = await state.pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });
      const container = containerRef.current;
      
      // Account for padding and margins
      const padding = 40;
      const availableWidth = container.offsetWidth - padding;
      const availableHeight = container.offsetHeight - padding;
      
      // Calculate scale to fit both width and height
      const scaleX = availableWidth / viewport.width;
      const scaleY = availableHeight / viewport.height;
      
      // Use the smaller scale to ensure the entire page fits
      const fitScale = Math.min(scaleX, scaleY, 3); // Cap at 3x zoom
      
      if (fitScale > 0) {
        onZoomChange(fitScale);
        onPanChange({ x: 0, y: 0 });
      }
    } catch (error) {
      console.error('Error calculating fit-to-screen scale:', error);
    }
  }, [state.pdfDocument, currentPage, onZoomChange, onPanChange]);

  if (state.isLoading) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center">
          <motion.div
            className="rounded-full h-12 w-12 border-b-2 border-ocean-blue mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-off-white">Loading PDF...</p>
        </div>
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{state.error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <motion.div
        className="bg-navy-900 border-b border-navy-700 p-3 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <ChevronLeft size={16} />
          </motion.button>

          <motion.span
            className="text-off-white text-sm px-3"
            key={currentPage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage} / {state.totalPages}
          </motion.span>

          <motion.button
            onClick={goToNextPage}
            disabled={currentPage >= state.totalPages}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleZoomOut}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <ZoomOut size={16} />
          </motion.button>

          <motion.span
            className="text-off-white text-sm px-3 min-w-[60px] text-center"
            key={Math.round(zoomScale * 100)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(zoomScale * 100)}%
          </motion.span>

          <motion.button
            onClick={handleZoomIn}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <ZoomIn size={16} />
          </motion.button>

          <motion.button
            onClick={handleFitToScreen}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            title="Fit to Screen"
          >
            <Maximize2 size={16} />
          </motion.button>

          <motion.button
            onClick={handleResetView}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            title="Reset View (100%)"
          >
            <RotateCcw size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-navy-800 relative flex items-center justify-center"
        onWheel={handleWheel}
        style={{ cursor: isPannable ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <motion.div
          className="relative"
          animate={{
            x: panOffset.x,
            y: panOffset.y
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-navy-600"
            style={{ display: 'block' }}
          />

          {/* Annotation Overlay */}
          {onAnnotationCreate && onAnnotationUpdate && onAnnotationDelete && documentDimensions.width > 0 && (
            <AnnotationOverlay
              documentId={documentId}
              currentPage={currentPage}
              zoomScale={zoomScale}
              panOffset={panOffset}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
              documentWidth={documentDimensions.width}
              documentHeight={documentDimensions.height}
              onAnnotationCreate={onAnnotationCreate}
              onAnnotationUpdate={onAnnotationUpdate}
              onAnnotationDelete={onAnnotationDelete}
              annotations={annotations}
              onAnnotationClick={onAnnotationClick}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PDFViewer;