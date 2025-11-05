import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';

interface AnnotationPoint {
  id: string;
  x: number;
  y: number;
  page?: number;
  content?: string;
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

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    
    // Get image natural dimensions
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
    
    if (onDocumentLoad) {
      onDocumentLoad();
    }
  }, [onDocumentLoad]);

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

      {/* Image container */}
      <motion.div 
        ref={containerRef}
        className="flex-1 bg-navy-800 overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <TransformWrapper
          initialScale={zoomScale}
          initialPositionX={panOffset.x}
          initialPositionY={panOffset.y}
          minScale={0.25}
          maxScale={3}
          wheel={{ 
            step: 0.1,
            smoothStep: 0.005,
            wheelDisabled: false
          }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: false, step: 0.5 }}
          onTransformed={(ref) => {
            const { scale, positionX, positionY } = ref.state;
            onZoomChange(scale);
            onPanChange({ x: positionX, y: positionY });
          }}
          centerOnInit={true}
          limitToBounds={false}
          smooth={true}
          velocityAnimation={{
            sensitivity: 1,
            animationTime: 400,
            animationType: "easeOut"
          }}
        >
          {() => (
            <TransformComponent
              wrapperClass="w-full h-full flex items-center justify-center"
              contentClass="max-w-full max-h-full relative"
            >
              <motion.img
                ref={imageRef}
                src={documentUrl}
                alt="Document"
                className="max-w-full max-h-full object-contain shadow-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
                style={{
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              
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
            </TransformComponent>
          )}
        </TransformWrapper>
      </motion.div>
    </motion.div>
  );
};

export default ImageViewer;