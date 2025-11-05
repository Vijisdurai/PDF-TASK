import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

        const loadingTask = pdfjsLib.getDocument(documentUrl);
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
        setState(prev => ({
          ...prev,
          error: 'Failed to load PDF document',
          isLoading: false
        }));
      }
    };

    if (documentUrl) {
      loadPDF();
    }
  }, [documentUrl, onDocumentLoad]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!state.pdfDocument || !canvasRef.current) return;

    try {
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

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [state.pdfDocument, currentPage, zoomScale]);

  // Re-render when page, zoom, or document changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

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

  // Handle mouse wheel zoom with smooth animation
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.25, Math.min(3, zoomScale + delta));
      onZoomChange(newScale);
    }
  }, [zoomScale, onZoomChange]);

  // Handle mouse drag for panning
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
  }, [panOffset]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;

    const newOffset = {
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    };
    onPanChange(newOffset);
  }, [isDragging, dragStart, onPanChange]);

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
            onClick={handleResetView}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <RotateCcw size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-navy-800 relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <motion.div
          className="inline-block relative"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          animate={{
            x: panOffset.x,
            y: panOffset.y,
            scale: 1
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        >
          <motion.canvas
            ref={canvasRef}
            className="shadow-lg border border-navy-600"
            style={{ display: 'block' }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
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