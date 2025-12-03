/**
 * useAnnotationManager Hook
 * 
 * A custom hook that provides annotation management utilities
 * without requiring the render prop pattern
 */

import { useMemo, useCallback } from 'react';
import type { Annotation } from '../contexts/AppContext';
import {
  screenToPercentage,
  percentageToScreen,
  screenToPixel,
  pixelToScreen,
  isWithinDocumentBounds,
  isAnnotationVisible,
  type TransformContext,
  type ScreenCoordinates
} from '../utils/coordinateTransforms';
import {
  validateAnnotation,
  sanitizeContent,
  normalizeHexColor,
  type ValidationResult
} from '../utils/annotationValidation';

export interface UseAnnotationManagerOptions {
  documentId: string;
  documentType: 'document' | 'image';
  containerWidth: number;
  containerHeight: number;
  documentWidth: number;
  documentHeight: number;
  scale: number;
  panOffset: { x: number; y: number };
  currentPage?: number;
  annotations: Annotation[];
  onAnnotationCreate?: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => void;
  onAnnotationDelete?: (id: string) => void;
  onError?: (error: { type: string; message: string; details?: string[] }) => void;
}

export interface AnnotationManagerResult {
  // Transform context
  transformContext: TransformContext;
  
  // Coordinate transformations
  screenToPercentage: (screenX: number, screenY: number) => { xPercent: number; yPercent: number };
  percentageToScreen: (xPercent: number, yPercent: number) => ScreenCoordinates;
  screenToPixel: (screenX: number, screenY: number) => { xPixel: number; yPixel: number };
  pixelToScreen: (xPixel: number, yPixel: number) => ScreenCoordinates;
  
  // Validation
  isWithinBounds: (screenX: number, screenY: number) => boolean;
  validateAnnotation: (annotation: Partial<Annotation>) => ValidationResult;
  
  // Annotation operations
  createAnnotation: (
    screenX: number,
    screenY: number,
    content: string,
    options?: { color?: string; page?: number }
  ) => boolean;
  updateAnnotation: (
    id: string,
    updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>
  ) => boolean;
  deleteAnnotation: (id: string) => boolean;
  
  // Filtering and visibility
  visibleAnnotations: Annotation[];
  getAnnotationScreenPosition: (annotation: Annotation) => ScreenCoordinates | null;
  isAnnotationVisible: (annotation: Annotation) => boolean;
}

/**
 * Hook for managing annotations with coordinate transformations and validation
 */
export function useAnnotationManager(options: UseAnnotationManagerOptions): AnnotationManagerResult {
  const {
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
    onError
  } = options;
  
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
  const handleError = useCallback((type: string, message: string, details?: string[]) => {
    console.error(`[useAnnotationManager] ${type} error:`, message, details);
    onError?.({ type, message, details });
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
    opts: { color?: string; page?: number } = {}
  ): boolean => {
    if (!onAnnotationCreate) {
      handleError('operation', 'Annotation creation not supported');
      return false;
    }
    
    if (!isWithinDocumentBounds(screenX, screenY, transformContext)) {
      handleError('coordinate', 'Annotation coordinates are outside document bounds');
      return false;
    }
    
    const sanitizedContent = sanitizeContent(content);
    if (!sanitizedContent) {
      handleError('validation', 'Annotation content cannot be empty');
      return false;
    }
    
    try {
      if (documentType === 'document') {
        const coords = screenToPercentage(screenX, screenY, transformContext);
        const annotation = {
          type: 'document' as const,
          documentId,
          page: opts.page ?? currentPage,
          xPercent: coords.xPercent,
          yPercent: coords.yPercent,
          content: sanitizedContent
        };
        
        const validation = validateAnnotation(annotation, documentWidth, documentHeight);
        if (!validation.isValid) {
          handleError('validation', 'Invalid document annotation', validation.errors);
          return false;
        }
        
        onAnnotationCreate(annotation);
        return true;
      } else {
        const coords = screenToPixel(screenX, screenY, transformContext);
        const annotation = {
          type: 'image' as const,
          documentId,
          xPixel: coords.xPixel,
          yPixel: coords.yPixel,
          content: sanitizedContent,
          color: opts.color ? normalizeHexColor(opts.color) : undefined
        };
        
        const validation = validateAnnotation(annotation, documentWidth, documentHeight);
        if (!validation.isValid) {
          handleError('validation', 'Invalid image annotation', validation.errors);
          return false;
        }
        
        onAnnotationCreate(annotation);
        return true;
      }
    } catch (error) {
      handleError('operation', 'Failed to create annotation', [
        error instanceof Error ? error.message : String(error)
      ]);
      return false;
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
  ): boolean => {
    if (!onAnnotationUpdate) {
      handleError('operation', 'Annotation update not supported');
      return false;
    }
    
    try {
      const processedUpdates = { ...updates };
      
      if (processedUpdates.content) {
        processedUpdates.content = sanitizeContent(processedUpdates.content);
        if (!processedUpdates.content) {
          handleError('validation', 'Annotation content cannot be empty');
          return false;
        }
      }
      
      if ('color' in processedUpdates && processedUpdates.color) {
        processedUpdates.color = normalizeHexColor(processedUpdates.color);
      }
      
      onAnnotationUpdate(id, processedUpdates);
      return true;
    } catch (error) {
      handleError('operation', 'Failed to update annotation', [
        error instanceof Error ? error.message : String(error)
      ]);
      return false;
    }
  }, [onAnnotationUpdate, handleError]);
  
  // Delete annotation
  const deleteAnnotation = useCallback((id: string): boolean => {
    if (!onAnnotationDelete) {
      handleError('operation', 'Annotation deletion not supported');
      return false;
    }
    
    try {
      onAnnotationDelete(id);
      return true;
    } catch (error) {
      handleError('operation', 'Failed to delete annotation', [
        error instanceof Error ? error.message : String(error)
      ]);
      return false;
    }
  }, [onAnnotationDelete, handleError]);
  
  // Get visible annotations
  const visibleAnnotations = useMemo(() => {
    if (documentType === 'document') {
      return annotations.filter(
        (a) => a.type === 'document' && a.page === currentPage
      );
    }
    return annotations.filter((a) => a.type === 'image');
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
      handleError('coordinate', 'Failed to calculate annotation position', [
        error instanceof Error ? error.message : String(error)
      ]);
      return null;
    }
  }, [transformContext, handleError]);
  
  // Check if annotation is visible
  const isAnnotationVisibleUtil = useCallback((annotation: Annotation): boolean => {
    const screenPos = getAnnotationScreenPosition(annotation);
    if (!screenPos) return false;
    
    return isAnnotationVisible(screenPos, containerWidth, containerHeight);
  }, [getAnnotationScreenPosition, containerWidth, containerHeight]);
  
  return {
    transformContext,
    screenToPercentage: screenToPercentageUtil,
    percentageToScreen: percentageToScreenUtil,
    screenToPixel: screenToPixelUtil,
    pixelToScreen: pixelToScreenUtil,
    isWithinBounds: isWithinBoundsUtil,
    validateAnnotation: validateAnnotationUtil,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    visibleAnnotations,
    getAnnotationScreenPosition,
    isAnnotationVisible: isAnnotationVisibleUtil
  };
}
