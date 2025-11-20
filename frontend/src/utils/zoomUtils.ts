/**
 * Zoom Utilities for Document Viewer
 * Handles all zoom calculations with proper centering
 */

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface PageDimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Calculate the scale needed to fit content inside container
 * Matches Chrome PDF viewer behavior: fit entire page with padding
 */
export const calculateFitScale = (
  container: ContainerDimensions,
  page: PageDimensions,
  padding: number = 40
): number => {
  const availableWidth = container.width - padding * 2;
  const availableHeight = container.height - padding * 2;

  const scaleX = availableWidth / page.width;
  const scaleY = availableHeight / page.height;

  // Use smaller scale to ensure entire page fits
  return Math.min(scaleX, scaleY);
};

/**
 * Apply zoom in a direction (in/out)
 * Returns new scale value
 */
export const applyZoom = (
  currentScale: number,
  direction: 'in' | 'out',
  step: number = 0.25
): number => {
  if (direction === 'in') {
    return currentScale + step;
  } else {
    return currentScale - step;
  }
};

/**
 * Clamp scale between min and max values
 */
export const clampScale = (
  scale: number,
  minScale: number,
  maxScale: number
): number => {
  return Math.max(minScale, Math.min(maxScale, scale));
};

/**
 * Calculate new position to keep content centered during zoom
 * This ensures the point under the cursor stays in place
 */
export const keepCenterPosition = (
  oldScale: number,
  newScale: number,
  cursorPosition: Position,
  currentPosition: Position,
  containerCenter: Position
): Position => {
  // If no cursor position provided, zoom towards container center
  const zoomPoint = cursorPosition || containerCenter;

  // Calculate the ratio of scale change
  const scaleRatio = newScale / oldScale;

  // Calculate new position to keep zoom point stable
  const newX = zoomPoint.x - (zoomPoint.x - currentPosition.x) * scaleRatio;
  const newY = zoomPoint.y - (zoomPoint.y - currentPosition.y) * scaleRatio;

  return { x: newX, y: newY };
};

/**
 * Calculate centered position for content
 * Used for initial load and when content is smaller than container
 */
export const calculateCenteredPosition = (
  container: ContainerDimensions,
  content: PageDimensions,
  scale: number
): Position => {
  const scaledWidth = content.width * scale;
  const scaledHeight = content.height * scale;

  return {
    x: (container.width - scaledWidth) / 2,
    y: (container.height - scaledHeight) / 2
  };
};

/**
 * Check if content is larger than container at current scale
 */
export const isContentLargerThanContainer = (
  container: ContainerDimensions,
  content: PageDimensions,
  scale: number
): boolean => {
  const scaledWidth = content.width * scale;
  const scaledHeight = content.height * scale;

  return scaledWidth > container.width || scaledHeight > container.height;
};
