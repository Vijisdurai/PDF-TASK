import { describe, it, expect } from 'vitest';
import {
  calculateFitScale,
  calculateDisplayScale,
  screenToImageSpace,
  imageToScreenSpace,
  imageToPercentage,
  percentageToImage,
  clamp,
  calculatePanBounds,
  constrainPan,
  calculateZoomPan,
  type ViewerState,
  type Point
} from '../coordinateUtils';

describe('coordinateUtils', () => {
  describe('calculateFitScale', () => {
    it('should calculate fit scale for landscape image in portrait container', () => {
      const scale = calculateFitScale(800, 1200, 1600, 900, 40);
      // Available: 720x1120, Image: 1600x900
      // scaleX = 720/1600 = 0.45, scaleY = 1120/900 = 1.244
      // Should use smaller scale (0.45)
      expect(scale).toBeCloseTo(0.45, 2);
    });

    it('should calculate fit scale for portrait image in landscape container', () => {
      const scale = calculateFitScale(1200, 800, 900, 1600, 40);
      // Available: 1120x720, Image: 900x1600
      // scaleX = 1120/900 = 1.244, scaleY = 720/1600 = 0.45
      // Should use smaller scale (0.45)
      expect(scale).toBeCloseTo(0.45, 2);
    });

    it('should not scale up beyond 100%', () => {
      const scale = calculateFitScale(1000, 1000, 500, 500, 40);
      // Image is smaller than container, should not scale up
      expect(scale).toBe(1);
    });
  });

  describe('calculateDisplayScale', () => {
    it('should multiply fitScale by zoom', () => {
      expect(calculateDisplayScale(0.5, 2)).toBe(1);
      expect(calculateDisplayScale(0.8, 1.5)).toBeCloseTo(1.2, 2);
    });
  });

  describe('imageToPercentage and percentageToImage', () => {
    it('should convert image coordinates to percentage', () => {
      const result = imageToPercentage({ x: 400, y: 300 }, 800, 600);
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('should convert percentage to image coordinates', () => {
      const result = percentageToImage({ x: 50, y: 50 }, 800, 600);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('should be reversible', () => {
      const original: Point = { x: 123, y: 456 };
      const percent = imageToPercentage(original, 1000, 1000);
      const back = percentageToImage(percent, 1000, 1000);
      expect(back.x).toBeCloseTo(original.x, 2);
      expect(back.y).toBeCloseTo(original.y, 2);
    });
  });

  describe('screenToImageSpace and imageToScreenSpace', () => {
    const viewerState: ViewerState = {
      zoom: 1,
      translate: { x: 0, y: 0 },
      containerSize: { width: 800, height: 600 },
      imageSize: { width: 400, height: 300 },
      isPanning: false,
      panStart: { x: 0, y: 0 },
      fitScale: 1
    };

    it('should convert screen to image space at center', () => {
      // Center of container (400, 300) should map to center of image (200, 150)
      const result = screenToImageSpace({ x: 400, y: 300 }, viewerState);
      expect(result.x).toBeCloseTo(200, 1);
      expect(result.y).toBeCloseTo(150, 1);
    });

    it('should convert image to screen space at center', () => {
      // Center of image (200, 150) should map to center of container (400, 300)
      const result = imageToScreenSpace({ x: 200, y: 150 }, viewerState);
      expect(result.x).toBeCloseTo(400, 1);
      expect(result.y).toBeCloseTo(300, 1);
    });

    it('should be reversible', () => {
      const original: Point = { x: 100, y: 75 };
      const screen = imageToScreenSpace(original, viewerState);
      const back = screenToImageSpace(screen, viewerState);
      expect(back.x).toBeCloseTo(original.x, 1);
      expect(back.y).toBeCloseTo(original.y, 1);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('calculatePanBounds', () => {
    it('should return zero bounds when image is smaller than container', () => {
      const viewerState: ViewerState = {
        zoom: 1,
        translate: { x: 0, y: 0 },
        containerSize: { width: 1000, height: 800 },
        imageSize: { width: 400, height: 300 },
        isPanning: false,
        panStart: { x: 0, y: 0 },
        fitScale: 1
      };

      const bounds = calculatePanBounds(viewerState);
      expect(bounds.maxX).toBe(0);
      expect(bounds.maxY).toBe(0);
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
    });

    it('should calculate correct bounds when image is larger than container', () => {
      const viewerState: ViewerState = {
        zoom: 2,
        translate: { x: 0, y: 0 },
        containerSize: { width: 800, height: 600 },
        imageSize: { width: 1000, height: 800 },
        isPanning: false,
        panStart: { x: 0, y: 0 },
        fitScale: 0.5
      };

      const bounds = calculatePanBounds(viewerState);
      // Display size: 1000 * 0.5 * 2 = 1000, 800 * 0.5 * 2 = 800
      // maxX = (1000 - 800) / 2 = 100
      // maxY = (800 - 600) / 2 = 100
      expect(bounds.maxX).toBe(100);
      expect(bounds.maxY).toBe(100);
      expect(bounds.minX).toBe(-100);
      expect(bounds.minY).toBe(-100);
    });
  });

  describe('constrainPan', () => {
    it('should constrain pan within bounds', () => {
      const viewerState: ViewerState = {
        zoom: 2,
        translate: { x: 200, y: 200 },
        containerSize: { width: 800, height: 600 },
        imageSize: { width: 1000, height: 800 },
        isPanning: false,
        panStart: { x: 0, y: 0 },
        fitScale: 0.5
      };

      const constrained = constrainPan({ x: 200, y: 200 }, viewerState);
      // Should be clamped to maxX=100, maxY=100
      expect(constrained.x).toBe(100);
      expect(constrained.y).toBe(100);
    });
  });

  describe('calculateZoomPan', () => {
    it('should keep cursor position fixed during zoom', () => {
      const viewerState: ViewerState = {
        zoom: 1,
        translate: { x: 0, y: 0 },
        containerSize: { width: 800, height: 600 },
        imageSize: { width: 400, height: 300 },
        isPanning: false,
        panStart: { x: 0, y: 0 },
        fitScale: 1
      };

      // Cursor at top-left quadrant (300, 200)
      const cursorPoint: Point = { x: 300, y: 200 };
      const newTranslate = calculateZoomPan(cursorPoint, 1, 2, viewerState);

      // The function should return a new translate value
      // When zooming in on the left side, translate should move right (positive)
      expect(typeof newTranslate.x).toBe('number');
      expect(typeof newTranslate.y).toBe('number');
      expect(newTranslate.x).toBeGreaterThan(0);
      expect(newTranslate.y).toBeGreaterThan(0);
    });
  });
});
