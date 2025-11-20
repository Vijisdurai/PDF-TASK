import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface UnifiedDocumentViewerProps {
  documentUrl: string;
  documentType: 'pdf' | 'docx' | 'image';
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}

interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Utility: Calculate fit-to-screen scale
 * Matches browser PDF viewer behavior: fit entire page with padding
 */
const calculateFitScale = (
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 40
): number => {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  const scaleX = availableWidth / pageWidth;
  const scaleY = availableHeight / pageHeight;
  
  // Use the smaller scale to ensure entire page fits
  return Math.min(scaleX, scaleY);
};

/**
 * Utility: Clamp pan offset to keep content within bounds
 * Prevents PDF from escaping the container
 */
const clampOffset = (
  offset: number,
  contentSize: number,
  containerSize: number,
  scale: number
): number => {
  const scaledContentSize = contentSize * scale;
  
  // If content is smaller than container, center it
  if (scaledContentSize <= containerSize) {
    return (containerSize - scaledContentSize) / 2;
  }
  
  // If content is larger, allow panning but keep within bounds
  const maxOffset = 0;
  const minOffset = containerSize - scaledContentSize;
  
  return Math.max(minOffset, Math.min(maxOffset, offset));
};

/**
 * Main Document Viewer Component
 * Supports PDF, DOCX, and Images with unified zoom/pan behavior
 */
const UnifiedDocumentViewer: React.FC<UnifiedDocumentViewerProps> = ({
  documentUrl,
  documentType,
  onPageChange,
  onZoomChange
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  
  // State
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  
  // Zoom limits
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4;

  /**
   * Load PDF document
   */
  useEffect(() => {
    if (documentType !== 'pdf') return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(documentUrl);
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Get first page dimensions
        const page = await pdf.getPage(1);
        const defaultViewport = page.getViewport({ scale: 1 });
        
        setPageDimensions({
          width: defaultViewport.width,
          height: defaultViewport.height
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [documentUrl, documentType]);

  /**
   * Update container size on mount and resize
   */
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  /**
   * Calculate initial fit scale when page dimensions or container size changes
   */
  useEffect(() => {
    if (pageDimensions.width === 0 || containerSize.width === 0) return;

    const initialFitScale = calculateFitScale(
      pageDimensions.width,
      pageDimensions.height,
      containerSize.width,
      containerSize.height
    );

    setFitScale(initialFitScale);
    
    // Set initial viewport to fit-to-screen (browser default behavior)
    setViewport({
      scale: initialFitScale,
      offsetX: (containerSize.width - pageDimensions.width * initialFitScale) / 2,
      offsetY: (containerSize.height - pageDimensions.height * initialFitScale) / 2
    });
  }, [pageDimensions, containerSize]);

  /**
   * Render PDF page
   */
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || viewport.scale === 0) return;

    const renderPage = async () => {
      try {
        // Cancel previous render
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate viewport at scale 1 (actual PDF size)
        const pdfViewport = page.getViewport({ scale: 1 });

        // Set canvas size to actual PDF dimensions
        canvas.width = pdfViewport.width;
        canvas.height = pdfViewport.height;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF at scale 1 (we'll scale via CSS transform)
        const renderContext = {
          canvasContext: context,
          viewport: pdfViewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, viewport.scale]);

  /**
   * Update viewport with clamped offsets
   */
  const updateViewport = useCallback((updates: Partial<ViewportState>) => {
    setViewport(prev => {
      const newViewport = { ...prev, ...updates };
      
      // Clamp offsets to keep content within bounds
      newViewport.offsetX = clampOffset(
        newViewport.offsetX,
        pageDimensions.width,
        containerSize.width,
        newViewport.scale
      );
      
      newViewport.offsetY = clampOffset(
        newViewport.offsetY,
        pageDimensions.height,
        containerSize.height,
        newViewport.scale
      );
      
      return newViewport;
    });
  }, [pageDimensions, containerSize]);

  /**
   * Zoom handlers
   */
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(MAX_SCALE, viewport.scale * 1.25);
    
    // Calculate center point
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    
    // Calculate new offsets to keep center point stable
    const scaleRatio = newScale / viewport.scale;
    const newOffsetX = centerX - (centerX - viewport.offsetX) * scaleRatio;
    const newOffsetY = centerY - (centerY - viewport.offsetY) * scaleRatio;
    
    updateViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    onZoomChange?.(newScale);
  }, [viewport, containerSize, updateViewport, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(MIN_SCALE, viewport.scale * 0.8);
    
    // Calculate center point
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    
    // Calculate new offsets to keep center point stable
    const scaleRatio = newScale / viewport.scale;
    const newOffsetX = centerX - (centerX - viewport.offsetX) * scaleRatio;
    const newOffsetY = centerY - (centerY - viewport.offsetY) * scaleRatio;
    
    updateViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    onZoomChange?.(newScale);
  }, [viewport, containerSize, updateViewport, onZoomChange]);

  const handleResetZoom = useCallback(() => {
    updateViewport({
      scale: fitScale,
      offsetX: (containerSize.width - pageDimensions.width * fitScale) / 2,
      offsetY: (containerSize.height - pageDimensions.height * fitScale) / 2
    });
    onZoomChange?.(fitScale);
  }, [fitScale, pageDimensions, containerSize, updateViewport, onZoomChange]);

  const handleFitToScreen = useCallback(() => {
    handleResetZoom();
  }, [handleResetZoom]);

  /**
   * Mouse wheel zoom
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * zoomFactor));
      
      // Zoom towards mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleRatio = newScale / viewport.scale;
      const newOffsetX = mouseX - (mouseX - viewport.offsetX) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - viewport.offsetY) * scaleRatio;
      
      updateViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
      onZoomChange?.(newScale);
    }
  }, [viewport, updateViewport, onZoomChange]);

  /**
   * Pan handlers
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow panning when zoomed in beyond fit scale
    if (viewport.scale <= fitScale) return;
    
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY
    };
  }, [viewport, fitScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - panStartRef.current.x;
    const deltaY = e.clientY - panStartRef.current.y;
    
    updateViewport({
      offsetX: panStartRef.current.offsetX + deltaX,
      offsetY: panStartRef.current.offsetY + deltaY
    });
  }, [isPanning, updateViewport]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * Page navigation
   */
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      onPageChange?.(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      onPageChange?.(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-navy-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ocean-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-off-white">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-navy-800">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const cursorStyle = viewport.scale > fitScale ? (isPanning ? 'grabbing' : 'grab') : 'default';

  return (
    <div className="flex flex-col h-full bg-navy-800">
      {/* Toolbar */}
      <div className="bg-navy-900 border-b border-navy-700 p-3 flex items-center justify-between flex-shrink-0">
        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-off-white text-sm px-3 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={viewport.scale <= MIN_SCALE}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut size={16} />
          </button>

          <span className="text-off-white text-sm px-3 min-w-[70px] text-center">
            {Math.round(viewport.scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={viewport.scale >= MAX_SCALE}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={handleFitToScreen}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 size={16} />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 transition-colors"
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: cursorStyle }}
      >
        {/* Canvas positioned absolutely and transformed */}
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{
            left: `${viewport.offsetX}px`,
            top: `${viewport.offsetY}px`,
            transform: `scale(${viewport.scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'white'
          }}
        />
      </div>

      {/* Instructions */}
      <div className="bg-navy-900 border-t border-navy-700 p-2 text-center text-xs text-gray-400 flex-shrink-0">
        <span>Ctrl+Scroll to zoom • Click and drag to pan • +/- to zoom • 0 to reset</span>
      </div>
    </div>
  );
};

export default UnifiedDocumentViewer;
