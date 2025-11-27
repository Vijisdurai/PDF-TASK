import React, { useRef, useCallback, useState } from 'react';
import AnnotationMarker from './AnnotationMarker';
import AnnotationInput from './AnnotationInput';
import type { Annotation, DocumentAnnotation, ImageAnnotation } from '../contexts/AppContext';
import { useAppContext } from '../contexts/AppContext';

interface AnnotationOverlayProps {
  annotations: Annotation[];
  documentType: 'pdf' | 'docx' | 'image';
  currentPage?: number; // For PDF/DOCX
  containerWidth: number;
  containerHeight: number;
  documentWidth: number;
  documentHeight: number;
  scale?: number; // For images
  panOffset?: { x: number; y: number }; // For images
  isDragging?: boolean; // For images
  onAnnotationClick: (annotation: Annotation) => void;
  onCreateAnnotation: (x: number, y: number, content: string, color: string) => void;
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  documentType,
  currentPage = 1,
  containerWidth,
  containerHeight,
  documentWidth,
  documentHeight,
  scale = 1,
  panOffset = { x: 0, y: 0 },
  isDragging = false,
  onAnnotationClick,
  onCreateAnnotation
}) => {
  const { state } = useAppContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inputState, setInputState] = useState<{
    isOpen: boolean;
    screenX: number;
    screenY: number;
    storageX: number;
    storageY: number;
  } | null>(null);

  // Type guard functions
  const isDocumentAnnotation = (annotation: Annotation): annotation is DocumentAnnotation => {
    return annotation.type === 'document';
  };

  const isImageAnnotation = (annotation: Annotation): annotation is ImageAnnotation => {
    return annotation.type === 'image';
  };

  // Coordinate transformation: screen to storage
  const screenToStorage = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!overlayRef.current) return { x: 0, y: 0 };

    const rect = overlayRef.current.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    if (documentType === 'image') {
      // For images: pixel-based coordinates relative to top-left
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // Calculate distance from center in screen pixels, then unscale
      // xPixel = (screenDelta / scale) + (width / 2)
      const xPixel = (relativeX - centerX - panOffset.x) / scale + documentWidth / 2;
      const yPixel = (relativeY - centerY - panOffset.y) / scale + documentHeight / 2;

      return { x: xPixel, y: yPixel };
    } else {
      // For PDF/DOCX: percentage-based coordinates
      const xPercent = (relativeX / documentWidth) * 100;
      const yPercent = (relativeY / documentHeight) * 100;
      return {
        x: Math.max(0, Math.min(100, xPercent)),
        y: Math.max(0, Math.min(100, yPercent))
      };
    }
  }, [documentType, documentWidth, documentHeight, containerWidth, containerHeight, scale, panOffset]);

  // Coordinate transformation: storage to screen
  const storageToScreen = useCallback((annotation: Annotation): { x: number; y: number } => {
    if (isImageAnnotation(annotation)) {
      // For images: apply scale transform to pixel coordinates
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // Convert from top-left based pixel coords to screen coords
      // screenX = (xPixel - width/2) * scale + centerX + panOffset
      const screenX = (annotation.xPixel - documentWidth / 2) * scale + panOffset.x + centerX;
      const screenY = (annotation.yPixel - documentHeight / 2) * scale + panOffset.y + centerY;

      return { x: screenX, y: screenY };
    } else if (isDocumentAnnotation(annotation)) {
      // For PDF/DOCX: convert percentage to screen coordinates
      const screenX = (annotation.xPercent / 100) * documentWidth;
      const screenY = (annotation.yPercent / 100) * documentHeight;
      return { x: screenX, y: screenY };
    }

    return { x: 0, y: 0 };
  }, [documentWidth, documentHeight, containerWidth, containerHeight, scale, panOffset]);

  // Handle double-click for annotation creation
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    event.preventDefault();
    event.stopPropagation();

    const coords = screenToStorage(event.clientX, event.clientY);
    setInputState({
      isOpen: true,
      screenX: event.clientX,
      screenY: event.clientY,
      storageX: coords.x,
      storageY: coords.y
    });
  }, [screenToStorage, isDragging]);

  // Handle annotation input save
  const handleInputSave = useCallback((content: string, color: string) => {
    if (inputState) {
      onCreateAnnotation(inputState.storageX, inputState.storageY, content, color);
    }
    setInputState(null);
  }, [inputState, onCreateAnnotation]);

  // Handle annotation input cancel
  const handleInputCancel = useCallback(() => {
    setInputState(null);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (annotation) {
      onAnnotationClick(annotation);
    }
  }, [annotations, onAnnotationClick]);

  // Filter annotations by current page for PDF/DOCX documents
  const filteredAnnotations = (documentType === 'pdf' || documentType === 'docx')
    ? annotations.filter(annotation =>
      isDocumentAnnotation(annotation) && annotation.page === currentPage
    )
    : annotations;

  // Calculate sequential marker numbers based on creation order
  const sortedAnnotations = [...filteredAnnotations].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <>
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-auto"
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'crosshair' }}
      >
        {/* Render annotation markers at correct screen positions */}
        {sortedAnnotations.map((annotation, index) => {
          const screenPos = storageToScreen(annotation);
          const markerColor = annotation.color;

          return (
            <AnnotationMarker
              key={annotation.id}
              number={index + 1}
              color={markerColor}
              position={screenPos}
              onClick={() => handleMarkerClick(annotation.id)}
            />
          );
        })}

        {/* Render preview marker when creating a new annotation */}
        {inputState && (
          <AnnotationMarker
            number={sortedAnnotations.length + 1}
            color={state.selectedColor}
            position={{ x: inputState.screenX, y: inputState.screenY }}
            onClick={() => { }} // No-op for preview marker
            isHighlighted={true} // Highlight the preview marker
          />
        )}
      </div>

      {/* Annotation input dialog */}
      {inputState && (
        <AnnotationInput
          isOpen={inputState.isOpen}
          x={inputState.screenX}
          y={inputState.screenY}
          onSave={handleInputSave}
          onCancel={handleInputCancel}
        />
      )}
    </>
  );
};

export default AnnotationOverlay;