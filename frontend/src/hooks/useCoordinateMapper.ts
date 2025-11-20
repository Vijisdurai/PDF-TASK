import { useMemo, RefObject } from 'react';

/**
 * Screen coordinates (viewport pixels)
 */
export interface ScreenCoords {
  x: number;
  y: number;
}

/**
 * Storage coordinates for document annotations (percentage-based)
 */
export interface PercentageStorageCoords {
  xPercent: number;
  yPercent: number;
}

/**
 * Storage coordinates for image annotations (pixel-based)
 */
export interface PixelStorageCoords {
  xPixel: number;
  yPixel: number;
}

/**
 * Union type for storage coordinates
 */
export type StorageCoords = PercentageStorageCoords | PixelStorageCoords;

/**
 * Parameters for image coordinate transformations
 */
export interface ImageTransformParams {
  scale: number;
  panX: number;
  panY: number;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Return type for the coordinate mapper hook
 */
export interface CoordinateMapper {
  screenToStorage: (screenX: number, screenY: number) => StorageCoords;
  storageToScreen: (storageCoords: StorageCoords) => ScreenCoords;
}

/**
 * Custom hook for coordinate transformations between screen and storage coordinates.
 * 
 * Supports two coordinate systems:
 * - Percentage-based (PDF/DOCX): Coordinates stored as 0-100% of container dimensions
 * - Pixel-based (images): Coordinates stored as absolute pixels relative to natural image size
 * 
 * @param documentType - Type of document ('pdf', 'docx', or 'image')
 * @param containerRef - Reference to the container element for dimension calculations
 * @param imageParams - Optional parameters for image transformations (scale, pan, natural size)
 * @returns Object with screenToStorage and storageToScreen transformation functions
 */
export function useCoordinateMapper(
  documentType: 'pdf' | 'docx' | 'image',
  containerRef: RefObject<HTMLElement>,
  imageParams?: ImageTransformParams
): CoordinateMapper {
  // Memoize transformation functions to prevent unnecessary re-renders
  const mapper = useMemo<CoordinateMapper>(() => {
    // For PDF and DOCX: percentage-based transformations
    if (documentType === 'pdf' || documentType === 'docx') {
      return {
        screenToStorage: (screenX: number, screenY: number): PercentageStorageCoords => {
          const container = containerRef.current;
          if (!container) {
            console.warn('Container ref not available for coordinate transformation');
            return { xPercent: 0, yPercent: 0 };
          }

          const rect = container.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;

          // Convert screen coordinates to percentage (0-100)
          const xPercent = (screenX / width) * 100;
          const yPercent = (screenY / height) * 100;

          // Clamp to valid range
          return {
            xPercent: Math.max(0, Math.min(100, xPercent)),
            yPercent: Math.max(0, Math.min(100, yPercent))
          };
        },

        storageToScreen: (storageCoords: StorageCoords): ScreenCoords => {
          const container = containerRef.current;
          if (!container) {
            console.warn('Container ref not available for coordinate transformation');
            return { x: 0, y: 0 };
          }

          // Type guard to ensure we have percentage coordinates
          if (!('xPercent' in storageCoords)) {
            console.error('Expected percentage coordinates for document type');
            return { x: 0, y: 0 };
          }

          const rect = container.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;

          // Convert percentage to screen coordinates
          const x = (storageCoords.xPercent / 100) * width;
          const y = (storageCoords.yPercent / 100) * height;

          return { x, y };
        }
      };
    }

    // For images: pixel-based transformations with scale and pan
    if (documentType === 'image') {
      if (!imageParams) {
        console.error('Image parameters required for image coordinate transformations');
        return {
          screenToStorage: () => ({ xPixel: 0, yPixel: 0 }),
          storageToScreen: () => ({ x: 0, y: 0 })
        };
      }

      return {
        screenToStorage: (screenX: number, screenY: number): PixelStorageCoords => {
          const { scale, panX, panY } = imageParams;

          // Convert screen coordinates to natural image pixels
          // Account for pan offset and scale
          const xPixel = (screenX - panX) / scale;
          const yPixel = (screenY - panY) / scale;

          // Round to nearest pixel and clamp to image bounds
          return {
            xPixel: Math.max(0, Math.min(imageParams.naturalWidth, Math.round(xPixel))),
            yPixel: Math.max(0, Math.min(imageParams.naturalHeight, Math.round(yPixel)))
          };
        },

        storageToScreen: (storageCoords: StorageCoords): ScreenCoords => {
          // Type guard to ensure we have pixel coordinates
          if (!('xPixel' in storageCoords)) {
            console.error('Expected pixel coordinates for image type');
            return { x: 0, y: 0 };
          }

          const { scale, panX, panY } = imageParams;

          // Convert natural image pixels to screen coordinates
          // Apply scale and pan offset
          const x = storageCoords.xPixel * scale + panX;
          const y = storageCoords.yPixel * scale + panY;

          return { x, y };
        }
      };
    }

    // Fallback for unknown document types
    console.error(`Unknown document type: ${documentType}`);
    return {
      screenToStorage: () => ({ xPercent: 0, yPercent: 0 }),
      storageToScreen: () => ({ x: 0, y: 0 })
    };
  }, [documentType, containerRef, imageParams]);

  return mapper;
}
