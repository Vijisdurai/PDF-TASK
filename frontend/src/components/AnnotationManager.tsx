/**
 * AnnotationManager Component
 * 
 * Provides shared annotation logic for both document and image viewers:
 * - Coordinate transformation utilities
 * - Annotation validation
 * - Error handling
 * - Shared annotation marker rendering
 * 
 * This component acts as a utility wrapper and doesn't render UI directly.
 * Instead, it provides hooks and utilities for managing annotations.
 */

import React, { useCallback, useMemo } from 'react';
import type { Annotation, DocumentAnnotation, ImageAnnotation } from '../contexts/AppContext';
import {
  screenToPercentage,
  percentageToScreen,
  screenToPixel,
  pixelToScreen,
  isWithinDocumentBounds,
  isValidPercentage,
  isValidPixel,
  isAnnotationVisible,
  type TransformContext,
  type ScreenCoordinates,
  type PercentageCoordinates,
  type PixelCoordinates
} from '../utils/coordinateTransforms';
import {
  validateDocumentAnnotation,
  validateImageAnnotation,
  validateAnnotation,
  sanitizeContent,
  isValidHexColor,
  normalizeHexColor,
  type ValidationResult
} from '../utils/annotationValidation';

export interface AnnotationManagerProps {
  // Document/viewer context
  documentId: string;
  documentType: 'document' | 'image';
  
  // Transform context
  containerWidth: number;
  containerHeight: number;
  documentWidth: number;
  documentHeight: number;
  scale: number;
  panOffset: { x: number; y: number };
  
  // Current page (for document annotations)
  currentPage?: number;
  
  // Annotations
  annotations: Annotation[];
  
  // Callbacks
  onAnnotationCreate?: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => void;
  onAnnotationDelete?: (id: string) => void;
  onError?: (error: AnnotationError) => void;
  
  // Children render prop
  children: (utils: AnnotationManagerUtils) => React.ReactNode;
}

export interface AnnotationError {
  type: 'validation' | 'coordinate' | 'operation';
  message: string;
  details?: string[];
}

export interface AnnotationManagerUtils {
  // Coordinate transformations
  screenToPercentage: (screenX: number, screenY: number) => PercentageCoordinates;
  percentageToScreen: (xPercent: number, yPercent: number) => ScreenCoordinates;
  screenToPixel: (screenX: number, screenY: number) => PixelCoordinates;
  pixelToScreen: (xPixel: number, yPixel: number) => ScreenCoordinates;
  
  // Validation
  isWithinBounds: (screenX: number, screenY: number) => boolean;
  validateAnnotation: (annotation: Partial<Annotation>) => ValidationResult;
  sanitizeContent: (content: string) => string;
  
  // Annotation operations
  createAnnotation: (
    screenX: number,
    screenY: number,
    content: string,
    options?: { color?: string; page?: number }
  ) => void;
  updateAnnotation: (
    id: string,
    updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>
  ) => void;
  deleteAnnotation: (id: string) => void;
  
  // Filtering and visibility
  getVisibleAnnotations: () => Annotation[];
  getAnnotationScreenPosition: (annotation: Annotation) => ScreenCoordinates | null;
  isAnnotationVisible: (annotation: Annotation) => boolean;
  
  // Error handling
  handleError: (error: AnnotationError) => void;
}

/**
 * AnnotationManager component
 * Provides utilities for managing annotations through a render prop pattern
 */
export const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  documentId,
  documentType,
  containerWidth,
  containerHeight,
  documentWidth,
  documentHeight,
  scale,
  panOffset,
  currentPage = 1,
  annotations,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onError,
  children
}) => {
  // Create transform context
  const transformContext: TransformContext = useMemo(() => ({
    containerWidth,
    containerHeight,
    documentWidth,
    documentHeight,
    scale,
    panOffset
  }), [containerWidth, containerHeight, documentWidth, documentHeight, scale, panOffset]);
  
  // Error handler
  const handleError = useCallback((error: AnnotationError) => {
    console.error(`[AnnotationManager] ${error.type} error:`, error.message, error.details);
    onError?.(error);
  }, [onError]);
  
  // Coordinate transformation utilities
  const screenToPercentageUtil = useCallback((screenX: number, screenY: number) => {
    return screenToPercentage(screenX, screenY, transformContext);
  }, [transformContext]);
  
  const percentageToScreenUtil = useCallback((xPercent: number, yPercent: number) => {
    return percentageToScreen(xPercent, yPercent, transformContext);
  }, [transformContext]);
  
  const screenToPixelUtil = useCallback((screenX: number, screenY: number) => {
    return screenToPixel(screenX, screenY, transformContext);
  }, [transformContext]);
  
  const pixelToScreenUtil = useCallback((xPixel: number, yPixel: number) => {
    return pixelToScreen(xPixel, yPixel, transformContext);
  }, [transformContext]);
  
  // Validation utilities
  const isWithinBoundsUtil = useCallback((screenX: number, screenY: number) => {
    return isWithinDocumentBounds(screenX, screenY, transformContext);
  }, [transformContext]);
  
  const validateAnnotationUtil = useCallback((annotation: Partial<Annotation>) => {
    return validateAnnotation(annotation, documentWidth, documentHeight);
  }, [documentWidth, documentHeight]);
  
  // Create annotation
  const createAnnotation = useCallback((
    screenX: number,
    screenY: number,
    content: string,
    options: { color?: string; page?: number } = {}
  ) => {
    if (!onAnnotationCreate) {
      handleError({
        type: 'operation',
        message: 'Annotation creation not supported'
      });
      return;
    }
    
    // Check if coordinates are within bounds
    if (!isWithinDocumentBounds(screenX, screenY, transformContext)) {
      handleError({
        type: 'coordinate',
        message: 'Annotation coordinates are outside document bounds'
      });
      return;
    }
    
    // Sanitize content
    const sanitizedContent = sanitizeContent(content);
    if (!sanitizedContent) {
      handleError({
        type: 'validation',
        message: 'Annotation content cannot be empty'
      });
      return;
    }
    
    try {
      if (documentType === 'document') {
        // Create document annotation with percentage coordinates
        const coords = screenToPercentage(screenX, screenY, transformContext);
        
        const annotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'document',
          documentId,
          page: options.page ?? currentPage,
          xPercent: coords.xPercent,
          yPercent: coords.yPercent,
          content: sanitizedContent
        };
        
        // Validate before creating
        const validation = validateDocumentAnnotation(annotation);
        if (!validation.isValid) {
          handleError({
            type: 'validation',
            message: 'Invalid document annotation',
            details: validation.errors
          });
          return;
        }
        
        onAnnotationCreate(annotation);
      } else {
        // Create image annotation with pixel coordinates
        const coords = screenToPixel(screenX, screenY, transformContext);
        
        // Validate pixel coordinates
        if (!isValidPixel(coords, documentWidth, documentHeight)) {
          handleError({
            type: 'coordinate',
            message: 'Pixel coordinates are outside image bounds'
          });
          return;
        }
        
        const annotation: Omit<ImageAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'image',
          documentId,
          xPixel: coords.xPixel,
          yPixel: coords.yPixel,
          content: sanitizedContent,
          color: options.color ? normalizeHexColor(options.color) : undefined
        };
        
        // Validate before creating
        const validation = validateImageAnnotation(annotation, documentWidth, documentHeight);
        if (!validation.isValid) {
          handleError({
            type: 'validation',
            message: 'Invalid image annotation',
            details: validation.errors
          });
          return;
        }
        
        onAnnotationCreate(annotation);
      }
    } catch (error) {
      handleError({
        type: 'operation',
        message: 'Failed to create annotation',
        details: [error instanceof Error ? error.message : String(error)]
      });
    }
  }, [
    documentType,
    documentId,
    currentPage,
    transformContext,
    documentWidth,
    documentHeight,
    onAnnotationCreate,
    handleError
  ]);
  
  // Update annotation
  const updateAnnotation = useCallback((
    id: string,
    updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>
  ) => {
    if (!onAnnotationUpdate) {
      handleError({
        type: 'operation',
        message: 'Annotation update not supported'
      });
      return;
    }
    
    try {
      // Sanitize content if provided
      if (updates.content) {
        updates.content = sanitizeContent(updates.content);
        if (!updates.content) {
          handleError({
            type: 'validation',
            message: 'Annotation content cannot be empty'
          });
          return;
        }
      }
      
      // Normalize color if provided
      if ('color' in updates && updates.color) {
        updates.color = normalizeHexColor(updates.color);
      }
      
      onAnnotationUpdate(id, updates);
    } catch (error) {
      handleError({
        type: 'operation',
        message: 'Failed to update annotation',
        details: [error instanceof Error ? error.message : String(error)]
      });
    }
  }, [onAnnotationUpdate, handleError]);
  
  // Delete annotation
  const deleteAnnotation = useCallback((id: string) => {
    if (!onAnnotationDelete) {
      handleError({
        type: 'operation',
        message: 'Annotation deletion not supported'
      });
      return;
    }
    
    try {
      onAnnotationDelete(id);
    } catch (error) {
      handleError({
        type: 'operation',
        message: 'Failed to delete annotation',
        details: [error instanceof Error ? error.message : String(error)]
      });
    }
  }, [onAnnotationDelete, handleError]);
  
  // Get visible annotations (filtered by page for documents)
  const getVisibleAnnotations = useCallback(() => {
    if (documentType === 'document') {
      return annotations.filter(
        (a): a is DocumentAnnotation => 
          a.type === 'document' && a.page === currentPage
      );
    }
    return annotations.filter((a): a is ImageAnnotation => a.type === 'image');
  }, [annotations, documentType, currentPage]);
  
  // Get annotation screen position
  const getAnnotationScreenPosition = useCallback((annotation: Annotation): ScreenCoordinates | null => {
    try {
      if (annotation.type === 'document') {
        return percentageToScreen(annotation.xPercent, annotation.yPercent, transformContext);
      } else {
        return pixelToScreen(annotation.xPixel, annotation.yPixel, transformContext);
      }
    } catch (error) {
      handleError({
        type: 'coordinate',
        message: 'Failed to calculate annotation position',
        details: [error instanceof Error ? error.message : String(error)]
      });
      return null;
    }
  }, [transformContext, handleError]);
  
  // Check if annotation is visible in viewport
  const isAnnotationVisibleUtil = useCallback((annotation: Annotation): boolean => {
    const screenPos = getAnnotationScreenPosition(annotation);
    if (!screenPos) return false;
    
    return isAnnotationVisible(screenPos, containerWidth, containerHeight);
  }, [getAnnotationScreenPosition, containerWidth, containerHeight]);
  
  // Create utilities object
  const utils: AnnotationManagerUtils = useMemo(() => ({
    // Coordinate transformations
    screenToPercentage: screenToPercentageUtil,
    percentageToScreen: percentageToScreenUtil,
    screenToPixel: screenToPixelUtil,
    pixelToScreen: pixelToScreenUtil,
    
    // Validation
    isWithinBounds: isWithinBoundsUtil,
    validateAnnotation: validateAnnotationUtil,
    sanitizeContent,
    
    // Annotation operations
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    
    // Filtering and visibility
    getVisibleAnnotations,
    getAnnotationScreenPosition,
    isAnnotationVisible: isAnnotationVisibleUtil,
    
    // Error handling
    handleError
  }), [
    screenToPercentageUtil,
    percentageToScreenUtil,
    screenToPixelUtil,
    pixelToScreenUtil,
    isWithinBoundsUtil,
    validateAnnotationUtil,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getVisibleAnnotations,
    getAnnotationScreenPosition,
    isAnnotationVisibleUtil,
    handleError
  ]);
  
  return <>{children(utils)}</>;
};

export default AnnotationManager;
