import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnnotationMarker from './AnnotationMarker';
import AnnotationInput from './AnnotationInput';

interface AnnotationPoint {
  id: string;
  xPercent: number; // Percentage-based coordinate (0-100)
  yPercent: number; // Percentage-based coordinate (0-100)
  page: number; // Page number (1-based)
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationOverlayProps {
  documentId: string;
  currentPage?: number;
  zoomScale: number;
  panOffset: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  documentWidth: number;
  documentHeight: number;
  onAnnotationCreate: (annotation: Omit<AnnotationPoint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate: (id: string, content: string) => void;
  onAnnotationDelete: (id: string) => void;
  annotations: AnnotationPoint[];
  onAnnotationClick?: (annotation: AnnotationPoint) => void;
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  documentId,
  currentPage = 1,
  zoomScale,
  panOffset,
  containerWidth,
  containerHeight,
  documentWidth,
  documentHeight,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  annotations,
  onAnnotationClick
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [inputState, setInputState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    annotationId?: string;
    isEditing: boolean;
    content: string;
    pendingCoords?: { xPercent: number; yPercent: number };
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isEditing: false,
    content: ''
  });

  // Transform screen coordinates to document percentage coordinates
  const screenToDocumentCoords = useCallback((screenX: number, screenY: number) => {
    if (!overlayRef.current) return { x: 0, y: 0 };

    const rect = overlayRef.current.getBoundingClientRect();
    
    // Get relative position within the overlay
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    
    // Account for pan offset and zoom
    const documentX = (relativeX - panOffset.x) / zoomScale;
    const documentY = (relativeY - panOffset.y) / zoomScale;
    
    // Convert to percentage coordinates
    const percentX = (documentX / documentWidth) * 100;
    const percentY = (documentY / documentHeight) * 100;
    
    // Clamp to valid range
    return {
      x: Math.max(0, Math.min(100, percentX)),
      y: Math.max(0, Math.min(100, percentY))
    };
  }, [panOffset, zoomScale, documentWidth, documentHeight]);

  // Transform document percentage coordinates to screen coordinates
  const documentToScreenCoords = useCallback((xPercent: number, yPercent: number) => {
    const documentX = (xPercent / 100) * documentWidth;
    const documentY = (yPercent / 100) * documentHeight;
    
    const screenX = documentX * zoomScale + panOffset.x;
    const screenY = documentY * zoomScale + panOffset.y;
    
    return { x: screenX, y: screenY };
  }, [panOffset, zoomScale, documentWidth, documentHeight]);

  // Handle double-click events for annotation creation
  const handleOverlayDoubleClick = useCallback((event: React.MouseEvent) => {
    // Prevent event bubbling to document viewer
    event.stopPropagation();
    
    if (isCreatingAnnotation || inputState.isOpen) return;
    
    const coords = screenToDocumentCoords(event.clientX, event.clientY);
    
    // Validate coordinates are within 0-100 range before proceeding
    if (coords.x < 0 || coords.x > 100 || coords.y < 0 || coords.y > 100) {
      console.warn('Annotation coordinates out of bounds:', coords);
      return;
    }
    
    setIsCreatingAnnotation(true);
    
    // Open annotation input at click position
    setInputState({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      isEditing: false,
      content: '',
      annotationId: undefined,
      pendingCoords: { xPercent: coords.x, yPercent: coords.y }
    });
  }, [screenToDocumentCoords, isCreatingAnnotation, inputState.isOpen]);

  // Handle annotation marker clicks
  const handleAnnotationClick = useCallback((annotation: AnnotationPoint, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedAnnotationId(annotation.id);
    
    // Open annotation input for editing
    const screenCoords = documentToScreenCoords(annotation.xPercent, annotation.yPercent);
    setInputState({
      isOpen: true,
      x: screenCoords.x,
      y: screenCoords.y,
      annotationId: annotation.id,
      isEditing: true,
      content: annotation.content || ''
    });
    
    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }
  }, [onAnnotationClick, documentToScreenCoords]);

  // Handle annotation marker hover
  const handleAnnotationHover = useCallback((annotationId: string, isHovered: boolean) => {
    setHoveredAnnotationId(isHovered ? annotationId : null);
  }, []);

  // Handle annotation input save
  const handleAnnotationSave = useCallback((content: string) => {
    if (inputState.isEditing && inputState.annotationId) {
      // Update existing annotation
      onAnnotationUpdate(inputState.annotationId, content);
    } else if (inputState.pendingCoords) {
      // Validate coordinates are within 0-100 range before saving
      const { xPercent, yPercent } = inputState.pendingCoords;
      if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
        console.error('Invalid annotation coordinates:', { xPercent, yPercent });
        return;
      }
      
      // Create new annotation with page number and percentage coordinates
      const newAnnotation = {
        xPercent,
        yPercent,
        page: currentPage,
        content
      };
      onAnnotationCreate(newAnnotation);
    }
    
    // Close input and reset state
    setInputState({
      isOpen: false,
      x: 0,
      y: 0,
      isEditing: false,
      content: ''
    });
    setIsCreatingAnnotation(false);
    setSelectedAnnotationId(null);
  }, [inputState, onAnnotationUpdate, onAnnotationCreate, currentPage]);

  // Handle annotation input cancel
  const handleAnnotationCancel = useCallback(() => {
    setInputState({
      isOpen: false,
      x: 0,
      y: 0,
      isEditing: false,
      content: ''
    });
    setIsCreatingAnnotation(false);
    setSelectedAnnotationId(null);
  }, []);

  // Handle annotation delete
  const handleAnnotationDelete = useCallback(() => {
    if (inputState.annotationId) {
      onAnnotationDelete(inputState.annotationId);
      setInputState({
        isOpen: false,
        x: 0,
        y: 0,
        isEditing: false,
        content: ''
      });
      setSelectedAnnotationId(null);
    }
  }, [inputState.annotationId, onAnnotationDelete]);

  // Filter annotations for current page
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.page === currentPage
  );

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto z-10"
      onDoubleClick={handleOverlayDoubleClick}
      style={{
        cursor: isCreatingAnnotation ? 'wait' : 'crosshair'
      }}
    >
      {/* Render annotation markers */}
      {currentPageAnnotations.map((annotation, index) => {
        const screenCoords = documentToScreenCoords(annotation.xPercent, annotation.yPercent);
        
        // Only render if annotation is visible within the container
        const isVisible = 
          screenCoords.x >= -20 && 
          screenCoords.x <= containerWidth + 20 &&
          screenCoords.y >= -20 && 
          screenCoords.y <= containerHeight + 20;
        
        if (!isVisible) return null;
        
        return (
          <AnnotationMarker
            key={annotation.id}
            id={annotation.id}
            x={screenCoords.x}
            y={screenCoords.y}
            content={annotation.content}
            number={index + 1}
            isSelected={selectedAnnotationId === annotation.id}
            isHovered={hoveredAnnotationId === annotation.id}
            onClick={(e) => handleAnnotationClick(annotation, e)}
            onHover={(isHovered) => handleAnnotationHover(annotation.id, isHovered)}
          />
        );
      })}
      
      {/* Visual feedback for annotation creation */}
      {isCreatingAnnotation && !inputState.isEditing && (
        <motion.div
          className="absolute inset-0 bg-ocean-blue/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Annotation input component */}
      <AnnotationInput
        isOpen={inputState.isOpen}
        x={inputState.x}
        y={inputState.y}
        initialContent={inputState.content}
        isEditing={inputState.isEditing}
        onSave={handleAnnotationSave}
        onCancel={handleAnnotationCancel}
        onDelete={inputState.isEditing ? handleAnnotationDelete : undefined}
      />
    </div>
  );
};

export default AnnotationOverlay;