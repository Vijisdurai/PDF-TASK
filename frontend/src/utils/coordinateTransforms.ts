/**
 * Coordinate transformation utilities for annotations
 * Handles conversion between different coordinate systems:
 * - Screen coordinates (viewport pixels)
 * - Document percentage coordinates (0-100)
 * - Image pixel coordinates (natural image pixels)
 */

export interface ScreenCoordinates {
  x: number;
  y: number;
}

export interface PercentageCoordinates {
  xPercent: number;
  yPercent: number;
}

export interface PixelCoordinates {
  xPixel: number;
  yPixel: number;
}

export interface TransformContext {
  // Container/viewport dimensions
  containerWidth: number;
  containerHeight: number;
  
  // Document/image dimensions
  documentWidth: number;
  documentHeight: number;
  
  // Transform state
  scale: number;
  panOffset: { x: number; y: number };
}

/**
 * Convert screen coordinates to document percentage coordinates (0-100)
 * Used for PDF/Word document annotations
 */
export function screenToPercentage(
  screenX: number,
  screenY: number,
  context: TransformContext
): PercentageCoordinates {
  const { documentWidth, documentHeight, scale, panOffset } = context;
  
  // Account for pan offset and zoom
  const documentX = (screenX - panOffset.x) / scale;
  const documentY = (screenY - panOffset.y) / scale;
  
  // Convert to percentage coordinates
  const xPercent = (documentX / documentWidth) * 100;
  const yPercent = (documentY / documentHeight) * 100;
  
  // Clamp to valid range (0-100)
  return {
    xPercent: Math.max(0, Math.min(100, xPercent)),
    yPercent: Math.max(0, Math.min(100, yPercent))
  };
}

/**
 * Convert document percentage coordinates to screen coordinates
 * Used for rendering PDF/Word document annotations
 */
export function percentageToScreen(
  xPercent: number,
  yPercent: number,
  context: TransformContext
): ScreenCoordinates {
  const { documentWidth, documentHeight, scale, panOffset } = context;
  
  // Convert percentage to document coordinates
  const documentX = (xPercent / 100) * documentWidth;
  const documentY = (yPercent / 100) * documentHeight;
  
  // Apply zoom and pan
  const screenX = documentX * scale + panOffset.x;
  const screenY = documentY * scale + panOffset.y;
  
  return { x: screenX, y: screenY };
}

/**
 * Convert screen coordinates to image pixel coordinates
 * Used for image annotations
 */
export function screenToPixel(
  screenX: number,
  screenY: number,
  context: TransformContext
): PixelCoordinates {
  const { scale, panOffset } = context;
  
  // Account for pan offset and zoom to get natural image coordinates
  const xPixel = (screenX - panOffset.x) / scale;
  const yPixel = (screenY - panOffset.y) / scale;
  
  return {
    xPixel: Math.round(xPixel),
    yPixel: Math.round(yPixel)
  };
}

/**
 * Convert image pixel coordinates to screen coordinates
 * Used for rendering image annotations
 */
export function pixelToScreen(
  xPixel: number,
  yPixel: number,
  context: TransformContext
): ScreenCoordinates {
  const { scale, panOffset } = context;
  
  // Apply zoom and pan
  const screenX = xPixel * scale + panOffset.x;
  const screenY = yPixel * scale + panOffset.y;
  
  return { x: screenX, y: screenY };
}

/**
 * Check if screen coordinates are within the document bounds
 */
export function isWithinDocumentBounds(
  screenX: number,
  screenY: number,
  context: TransformContext
): boolean {
  const { documentWidth, documentHeight, scale, panOffset } = context;
  
  const documentX = (screenX - panOffset.x) / scale;
  const documentY = (screenY - panOffset.y) / scale;
  
  return (
    documentX >= 0 &&
    documentX <= documentWidth &&
    documentY >= 0 &&
    documentY <= documentHeight
  );
}

/**
 * Check if percentage coordinates are valid (0-100 range)
 */
export function isValidPercentage(coords: PercentageCoordinates): boolean {
  return (
    coords.xPercent >= 0 &&
    coords.xPercent <= 100 &&
    coords.yPercent >= 0 &&
    coords.yPercent <= 100
  );
}

/**
 * Check if pixel coordinates are within image bounds
 */
export function isValidPixel(
  coords: PixelCoordinates,
  imageWidth: number,
  imageHeight: number
): boolean {
  return (
    coords.xPixel >= 0 &&
    coords.xPixel <= imageWidth &&
    coords.yPixel >= 0 &&
    coords.yPixel <= imageHeight
  );
}

/**
 * Check if annotation is visible within the viewport
 */
export function isAnnotationVisible(
  screenCoords: ScreenCoordinates,
  containerWidth: number,
  containerHeight: number,
  margin: number = 20
): boolean {
  return (
    screenCoords.x >= -margin &&
    screenCoords.x <= containerWidth + margin &&
    screenCoords.y >= -margin &&
    screenCoords.y <= containerHeight + margin
  );
}
