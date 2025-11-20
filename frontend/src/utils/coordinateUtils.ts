/**
 * Coordinate System Utilities for Image Viewer
 * 
 * This module provides utilities for converting between different coordinate spaces:
 * - Image Space: Natural pixel coordinates of the image (0,0 = top-left of image)
 * - Screen Space: Pixel coordinates on the screen (0,0 = top-left of container)
 * - Percentage Space: Normalized coordinates (0-100% of image dimensions)
 */

/**
 * Represents a point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents the complete state of the image viewer
 */
export interface ViewerState {
  // Zoom level (1 = fit-to-screen, >1 = zoomed in, <1 = zoomed out)
  zoom: number;
  
  // Translation offset in screen pixels (for panning)
  translate: Point;
  
  // Container dimensions in pixels
  containerSize: {
    width: number;
    height: number;
  };
  
  // Image natural dimensions in pixels
  imageSize: {
    width: number;
    height: number;
  };
  
  // Panning state
  isPanning: boolean;
  panStart: Point;
  
  // Fit-to-screen scale (calculated based on container and image size)
  fitScale: number;
}

/**
 * Calculate the fit-to-screen scale factor
 * This ensures the entire image fits within the container with padding
 */
export function calculateFitScale(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  padding: number = 40
): number {
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);
  
  const scaleX = availableWidth / imageWidth;
  const scaleY = availableHeight / imageHeight;
  
  // Use the smaller scale to ensure entire image fits
  // Don't scale up beyond 100% (max scale = 1)
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Calculate the display scale (fitScale * zoom)
 * This is the actual scale applied to the image
 */
export function calculateDisplayScale(fitScale: number, zoom: number): number {
  return fitScale * zoom;
}

/**
 * Convert screen coordinates to image-space coordinates
 * 
 * @param screenPoint - Point in screen space (relative to container)
 * @param viewerState - Current viewer state
 * @returns Point in image space (natural pixel coordinates)
 */
export function screenToImageSpace(
  screenPoint: Point,
  viewerState: ViewerState
): Point {
  const displayScale = calculateDisplayScale(viewerState.fitScale, viewerState.zoom);
  
  // Get the center of the container
  const containerCenterX = viewerState.containerSize.width / 2;
  const containerCenterY = viewerState.containerSize.height / 2;
  
  // Calculate the image's top-left corner in screen space
  const imageDisplayWidth = viewerState.imageSize.width * displayScale;
  const imageDisplayHeight = viewerState.imageSize.height * displayScale;
  
  const imageScreenLeft = containerCenterX + viewerState.translate.x - (imageDisplayWidth / 2);
  const imageScreenTop = containerCenterY + viewerState.translate.y - (imageDisplayHeight / 2);
  
  // Convert screen point to image space
  const imageX = (screenPoint.x - imageScreenLeft) / displayScale;
  const imageY = (screenPoint.y - imageScreenTop) / displayScale;
  
  return { x: imageX, y: imageY };
}

/**
 * Convert image-space coordinates to screen coordinates
 * 
 * @param imagePoint - Point in image space (natural pixel coordinates)
 * @param viewerState - Current viewer state
 * @returns Point in screen space (relative to container)
 */
export function imageToScreenSpace(
  imagePoint: Point,
  viewerState: ViewerState
): Point {
  const displayScale = calculateDisplayScale(viewerState.fitScale, viewerState.zoom);
  
  // Get the center of the container
  const containerCenterX = viewerState.containerSize.width / 2;
  const containerCenterY = viewerState.containerSize.height / 2;
  
  // Calculate the image's top-left corner in screen space
  const imageDisplayWidth = viewerState.imageSize.width * displayScale;
  const imageDisplayHeight = viewerState.imageSize.height * displayScale;
  
  const imageScreenLeft = containerCenterX + viewerState.translate.x - (imageDisplayWidth / 2);
  const imageScreenTop = containerCenterY + viewerState.translate.y - (imageDisplayHeight / 2);
  
  // Convert image point to screen space
  const screenX = imageScreenLeft + (imagePoint.x * displayScale);
  const screenY = imageScreenTop + (imagePoint.y * displayScale);
  
  return { x: screenX, y: screenY };
}

/**
 * Convert image-space coordinates to percentage coordinates
 * 
 * @param imagePoint - Point in image space (natural pixel coordinates)
 * @param imageWidth - Natural width of the image
 * @param imageHeight - Natural height of the image
 * @returns Point with x and y as percentages (0-100)
 */
export function imageToPercentage(
  imagePoint: Point,
  imageWidth: number,
  imageHeight: number
): Point {
  return {
    x: (imagePoint.x / imageWidth) * 100,
    y: (imagePoint.y / imageHeight) * 100
  };
}

/**
 * Convert percentage coordinates to image-space coordinates
 * 
 * @param percentPoint - Point with x and y as percentages (0-100)
 * @param imageWidth - Natural width of the image
 * @param imageHeight - Natural height of the image
 * @returns Point in image space (natural pixel coordinates)
 */
export function percentageToImage(
  percentPoint: Point,
  imageWidth: number,
  imageHeight: number
): Point {
  return {
    x: (percentPoint.x / 100) * imageWidth,
    y: (percentPoint.y / 100) * imageHeight
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate pan bounds to prevent showing background
 * 
 * @param viewerState - Current viewer state
 * @returns Maximum allowed translation in each direction
 */
export function calculatePanBounds(viewerState: ViewerState): {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
} {
  const displayScale = calculateDisplayScale(viewerState.fitScale, viewerState.zoom);
  
  const imageDisplayWidth = viewerState.imageSize.width * displayScale;
  const imageDisplayHeight = viewerState.imageSize.height * displayScale;
  
  const containerWidth = viewerState.containerSize.width;
  const containerHeight = viewerState.containerSize.height;
  
  // If image is smaller than container, center it (no panning)
  if (imageDisplayWidth <= containerWidth && imageDisplayHeight <= containerHeight) {
    return { maxX: 0, maxY: 0, minX: 0, minY: 0 };
  }
  
  // Calculate max pan distances
  const maxX = Math.max(0, (imageDisplayWidth - containerWidth) / 2);
  const maxY = Math.max(0, (imageDisplayHeight - containerHeight) / 2);
  
  return {
    maxX,
    maxY,
    minX: -maxX,
    minY: -maxY
  };
}

/**
 * Constrain pan offset to stay within bounds
 * 
 * @param translate - Current translation offset
 * @param viewerState - Current viewer state
 * @returns Constrained translation offset
 */
export function constrainPan(translate: Point, viewerState: ViewerState): Point {
  const bounds = calculatePanBounds(viewerState);
  
  return {
    x: clamp(translate.x, bounds.minX, bounds.maxX),
    y: clamp(translate.y, bounds.minY, bounds.maxY)
  };
}

/**
 * Calculate new pan offset to keep a point stationary during zoom
 * 
 * @param cursorScreenPoint - Cursor position in screen space
 * @param oldZoom - Previous zoom level
 * @param newZoom - New zoom level
 * @param viewerState - Current viewer state (with old zoom)
 * @returns New translation offset
 */
export function calculateZoomPan(
  cursorScreenPoint: Point,
  oldZoom: number,
  newZoom: number,
  viewerState: ViewerState
): Point {
  const containerCenterX = viewerState.containerSize.width / 2;
  const containerCenterY = viewerState.containerSize.height / 2;
  
  // Get cursor position relative to container center
  const cursorX = cursorScreenPoint.x - containerCenterX;
  const cursorY = cursorScreenPoint.y - containerCenterY;
  
  // Calculate scale ratio
  const oldDisplayScale = calculateDisplayScale(viewerState.fitScale, oldZoom);
  const newDisplayScale = calculateDisplayScale(viewerState.fitScale, newZoom);
  const scaleRatio = newDisplayScale / oldDisplayScale;
  
  // Calculate new pan to keep cursor position fixed
  const newTranslateX = cursorX - (cursorX - viewerState.translate.x) * scaleRatio;
  const newTranslateY = cursorY - (cursorY - viewerState.translate.y) * scaleRatio;
  
  return { x: newTranslateX, y: newTranslateY };
}
