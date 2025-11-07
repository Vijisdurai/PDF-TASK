import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, StickyNote, Edit3 } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';

interface AnnotationPoint {
  id: string;
  x: number;
  y: number;
  page?: number;
  content?: string;
  timestamp: number;
}

interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
  timestamp: number;
}

interface ImageViewerProps {
  documentUrl: string;
  documentId: string;
  zoomScale: number;
  panOffset: { x: number; y: number };
  onZoomChange: (scale: number) => void;
  onPanChange: (offset: { x: number; y: number }) => void;
  onDocumentLoad?: () => void;
  onAnnotationCreate?: (annotation: Omit<AnnotationPoint, 'id' | 'timestamp'>) => void;
  onAnnotationUpdate?: (id: string, content: string) => void;
  onAnnotationDelete?: (id: string) => void;
  annotations?: AnnotationPoint[];
  onAnnotationClick?: (annotation: AnnotationPoint) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  documentUrl,
  documentId,
  zoomScale,
  panOffset,
  onZoomChange,
  onPanChange,
  onDocumentLoad,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  annotations = [],
  onAnnotationClick
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Enhanced state for better interaction
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [annotationMode, setAnnotationMode] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [autoFitted, setAutoFitted] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    
    // Get image natural dimensions
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      
      // Auto-fit image to container on first load
      if (!autoFitted) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let fitScale;
        if (imageAspect > containerAspect) {
          // Image is wider than container
          fitScale = (containerWidth * 0.9) / img.naturalWidth;
        } else {
          // Image is taller than container
          fitScale = (containerHeight * 0.9) / img.naturalHeight;
        }
        
        // Apply auto-fit scale
        onZoomChange(Math.min(fitScale, 1)); // Don't scale up beyond 100%
        onPanChange({ x: 0, y: 0 });
        setAutoFitted(true);
      }
    }
    
    if (onDocumentLoad) {
      onDocumentLoad();
    }
  }, [onDocumentLoad, autoFitted, onZoomChange, onPanChange]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load image');
  }, []);

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

  // Fit to screen functionality
  const handleFitToScreen = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let fitScale;
    if (imageAspect > containerAspect) {
      fitScale = (containerWidth * 0.9) / img.naturalWidth;
    } else {
      fitScale = (containerHeight * 0.9) / img.naturalHeight;
    }
    
    onZoomChange(fitScale);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  // Pan functionality
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (annotationMode) return; // Don't pan in annotation mode
    
    setIsPanning(true);
    setStartPan({ 
      x: event.clientX - panOffset.x, 
      y: event.clientY - panOffset.y 
    });
  }, [annotationMode, panOffset]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isPanning) return;
    
    onPanChange({
      x: event.clientX - startPan.x,
      y: event.clientY - startPan.y
    });
  }, [isPanning, startPan, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Annotation functionality
  const handleImageClick = useCallback((event: React.MouseEvent) => {
    if (!annotationMode || !imageRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate click position relative to the image
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert to image coordinates accounting for zoom and pan
    const imageX = (clickX - panOffset.x) / zoomScale;
    const imageY = (clickY - panOffset.y) / zoomScale;
    
    // Prompt for note text
    const text = prompt("Enter note text:");
    if (text && text.trim()) {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: imageX,
        y: imageY,
        text: text.trim(),
        timestamp: Date.now()
      };
      
      setNotes(prev => [...prev, newNote]);
      
      // Also create annotation through the prop if available
      if (onAnnotationCreate) {
        onAnnotationCreate({
          x: imageX,
          y: imageY,
          page: 1,
          content: text.trim()
        });
      }
    }
  }, [annotationMode, panOffset, zoomScale, onAnnotationCreate]);

  // Delete note functionality
  const handleNoteDelete = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
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

  if (isLoading) {
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
          <p className="text-off-white">Loading image...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
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
          <span className="text-off-white text-sm">Image Viewer</span>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleZoomOut}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            title="Zoom Out"
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
            title="Zoom In"
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

          <motion.button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`p-2 rounded transition-colors ${
              annotationMode 
                ? 'bg-yellow-500 text-navy-900 hover:bg-yellow-400' 
                : 'bg-navy-800 text-off-white hover:bg-navy-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            title={annotationMode ? "Exit Annotation Mode" : "Add Notes"}
          >
            {annotationMode ? <Edit3 size={16} /> : <StickyNote size={16} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Image container */}
      <motion.div 
        ref={containerRef}
        className={`flex-1 bg-navy-800 overflow-hidden relative select-none ${
          annotationMode ? 'cursor-crosshair' : (isPanning ? 'cursor-grabbing' : 'cursor-grab')
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
      >
        {/* Annotation mode indicator */}
        {annotationMode && (
          <motion.div
            className="absolute top-4 left-4 bg-yellow-500 text-navy-900 px-3 py-1 rounded-full text-sm font-medium z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Click to add note
          </motion.div>
        )}

        <div className="w-full h-full flex items-center justify-center">
          <motion.img
            ref={imageRef}
            src={documentUrl}
            alt="Document"
            className="max-w-none object-contain shadow-lg"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />

          {/* Notes overlay */}
          {notes.map((note) => {
            const noteX = note.x * zoomScale + panOffset.x;
            const noteY = note.y * zoomScale + panOffset.y;
            
            return (
              <motion.div
                key={note.id}
                className="absolute bg-yellow-400 text-navy-900 px-2 py-1 rounded text-xs shadow-lg cursor-pointer border border-yellow-600"
                style={{
                  left: noteX,
                  top: noteY,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                title={note.text}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete note: "${note.text}"?`)) {
                    handleNoteDelete(note.id);
                  }
                }}
                whileHover={{ scale: 1.1 }}
              >
                📝
              </motion.div>
            );
          })}

          {/* Annotation Overlay for Images */}
          {onAnnotationCreate && imageDimensions.width > 0 && (
            <AnnotationOverlay
              documentId={documentId}
              currentPage={1}
              zoomScale={zoomScale}
              panOffset={panOffset}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
              documentWidth={imageDimensions.width}
              documentHeight={imageDimensions.height}
              onAnnotationCreate={onAnnotationCreate}
              onAnnotationUpdate={onAnnotationUpdate}
              onAnnotationDelete={onAnnotationDelete}
              annotations={annotations}
              onAnnotationClick={onAnnotationClick}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageViewer;