/**
 * Pan Utilities for Document Viewer
 * Handles panning with proper boundary restrictions
 */

import type { ContainerDimensions, PageDimensions, Position } from './zoomUtils';

/**
 * Restrict pan position to keep content within container bounds
 * Prevents content from escaping the viewport
 */
export const restrictPanBounds = (
  position: Position,
  scale: number,
  container: ContainerDimensions,
  content: PageDimensions
): Position => {
  const scaledWidth = content.width * scale;
  const scaledHeight = content.height * scale;

  let { x, y } = position;

  // Horizontal bounds
  if (scaledWidth <= container.width) {
    // Content smaller than container - center it
    x = (container.width - scaledWidth) / 2;
  } else {
    // Content larger than container - restrict to bounds
    const maxX = 0;
    const minX = container.width - scaledWidth;
    x = Math.max(minX, Math.min(maxX, x));
  }

  // Vertical bounds
  if (scaledHeight <= container.height) {
    // Content smaller than container - center it
    y = (container.height - scaledHeight) / 2;
  } else {
    // Content larger than container - restrict to bounds
    const maxY = 0;
    const minY = container.height - scaledHeight;
    y = Math.max(minY, Math.min(maxY, y));
  }

  return { x, y };
};

/**
 * Calculate pan delta from mouse movement
 */
export const calculatePanDelta = (
  startPosition: Position,
  currentPosition: Position,
  initialOffset: Position
): Position => {
  const deltaX = currentPosition.x - startPosition.x;
  const deltaY = currentPosition.y - startPosition.y;

  return {
    x: initialOffset.x + deltaX,
    y: initialOffset.y + deltaY
  };
};

/**
 * Check if panning should be allowed at current scale
 * Only allow panning when content is larger than container
 */
export const shouldAllowPanning = (
  scale: number,
  fitScale: number,
  threshold: number = 0.01
): boolean => {
  return scale > fitScale + threshold;
};
