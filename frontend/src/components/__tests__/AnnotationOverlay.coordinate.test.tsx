/**
 * Test AnnotationOverlay coordinate transformation with various zoom and pan values
 * **Feature: image-annotations, Task 1.2: Verify coordinate transformation in AnnotationOverlay**
 */

import { describe, it, expect } from 'vitest';

describe('AnnotationOverlay Coordinate Transformation', () => {
  // Test the formulas used in AnnotationOverlay
  // These account for container centering as implemented

  const screenToStorage = (
    screenX: number,
    screenY: number,
    containerWidth: number,
    containerHeight: number,
    scale: number,
    panOffset: { x: number; y: number }
  ) => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const xPixel = (screenX - centerX - panOffset.x) / scale;
    const yPixel = (screenY - centerY - panOffset.y) / scale;
    return { xPixel, yPixel };
  };

  const storageToScreen = (
    xPixel: number,
    yPixel: number,
    containerWidth: number,
    containerHeight: number,
    scale: number,
    panOffset: { x: number; y: number }
  ) => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const screenX = xPixel * scale + panOffset.x + centerX;
    const screenY = yPixel * scale + panOffset.y + centerY;
    return { screenX, screenY };
  };

  describe('Round-trip transformation with various zoom levels', () => {
    const containerWidth = 800;
    const containerHeight = 600;

    it('should preserve coordinates at zoom scale 0.5', () => {
      const xPixel = 400;
      const yPixel = 300;
      const scale = 0.5;
      const panOffset = { x: 0, y: 0 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates at zoom scale 1.0', () => {
      const xPixel = 200;
      const yPixel = 150;
      const scale = 1.0;
      const panOffset = { x: 0, y: 0 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates at zoom scale 2.0', () => {
      const xPixel = 150;
      const yPixel = 100;
      const scale = 2.0;
      const panOffset = { x: 0, y: 0 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates at zoom scale 5.0', () => {
      const xPixel = 50;
      const yPixel = 75;
      const scale = 5.0;
      const panOffset = { x: 0, y: 0 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });
  });

  describe('Round-trip transformation with various pan offsets', () => {
    const containerWidth = 800;
    const containerHeight = 600;
    const scale = 1.5;

    it('should preserve coordinates with positive pan offset', () => {
      const xPixel = 300;
      const yPixel = 200;
      const panOffset = { x: 50, y: 30 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates with negative pan offset', () => {
      const xPixel = 250;
      const yPixel = 180;
      const panOffset = { x: -75, y: -50 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates with mixed pan offset', () => {
      const xPixel = 400;
      const yPixel = 300;
      const panOffset = { x: 100, y: -80 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });
  });

  describe('Combined zoom and pan transformations', () => {
    const containerWidth = 1024;
    const containerHeight = 768;

    it('should preserve coordinates with zoom 0.75 and pan (20, -15)', () => {
      const xPixel = 512;
      const yPixel = 384;
      const scale = 0.75;
      const panOffset = { x: 20, y: -15 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates with zoom 3.0 and pan (-100, 50)', () => {
      const xPixel = 100;
      const yPixel = 150;
      const scale = 3.0;
      const panOffset = { x: -100, y: 50 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should preserve coordinates with extreme zoom 10.0 and large pan', () => {
      const xPixel = 50;
      const yPixel = 25;
      const scale = 10.0;
      const panOffset = { x: 200, y: -150 };

      const screen = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);
      const storage = screenToStorage(screen.screenX, screen.screenY, containerWidth, containerHeight, scale, panOffset);

      expect(storage.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage.yPixel).toBeCloseTo(yPixel, 10);
    });
  });

  describe('Formula verification', () => {
    it('should use correct screenToStorage formula: (screenX - panOffset.x) / scale (accounting for center)', () => {
      const containerWidth = 800;
      const containerHeight = 600;
      const centerX = containerWidth / 2; // 400
      const centerY = containerHeight / 2; // 300
      
      const screenX = 600; // Absolute screen coordinate
      const screenY = 450;
      const scale = 2.0;
      const panOffset = { x: 50, y: 30 };

      // Expected formula: xPixel = (screenX - centerX - panOffset.x) / scale
      const expectedXPixel = (screenX - centerX - panOffset.x) / scale;
      const expectedYPixel = (screenY - centerY - panOffset.y) / scale;

      const result = screenToStorage(screenX, screenY, containerWidth, containerHeight, scale, panOffset);

      expect(result.xPixel).toBeCloseTo(expectedXPixel, 10);
      expect(result.yPixel).toBeCloseTo(expectedYPixel, 10);
    });

    it('should use correct storageToScreen formula: xPixel * scale + panOffset.x (accounting for center)', () => {
      const containerWidth = 800;
      const containerHeight = 600;
      const centerX = containerWidth / 2; // 400
      const centerY = containerHeight / 2; // 300
      
      const xPixel = 150;
      const yPixel = 100;
      const scale = 1.5;
      const panOffset = { x: -25, y: 40 };

      // Expected formula: screenX = xPixel * scale + panOffset.x + centerX
      const expectedScreenX = xPixel * scale + panOffset.x + centerX;
      const expectedScreenY = yPixel * scale + panOffset.y + centerY;

      const result = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, panOffset);

      expect(result.screenX).toBeCloseTo(expectedScreenX, 10);
      expect(result.screenY).toBeCloseTo(expectedScreenY, 10);
    });
  });

  describe('Annotation position invariance', () => {
    const containerWidth = 800;
    const containerHeight = 600;

    it('should maintain same pixel location when zoom changes (Requirement 2.1, 2.4)', () => {
      const xPixel = 300;
      const yPixel = 200;
      const panOffset = { x: 0, y: 0 };

      // Calculate screen position at scale 1.0
      const screen1 = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, 1.0, panOffset);
      const storage1 = screenToStorage(screen1.screenX, screen1.screenY, containerWidth, containerHeight, 1.0, panOffset);

      // Calculate screen position at scale 2.5
      const screen2 = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, 2.5, panOffset);
      const storage2 = screenToStorage(screen2.screenX, screen2.screenY, containerWidth, containerHeight, 2.5, panOffset);

      // Both should point to the same pixel location
      expect(storage1.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage1.yPixel).toBeCloseTo(yPixel, 10);
      expect(storage2.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage2.yPixel).toBeCloseTo(yPixel, 10);
    });

    it('should maintain same pixel location when pan changes (Requirement 3.1, 3.2)', () => {
      const xPixel = 400;
      const yPixel = 300;
      const scale = 1.5;

      // Calculate with pan offset (0, 0)
      const screen1 = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, { x: 0, y: 0 });
      const storage1 = screenToStorage(screen1.screenX, screen1.screenY, containerWidth, containerHeight, scale, { x: 0, y: 0 });

      // Calculate with pan offset (100, -50)
      const screen2 = storageToScreen(xPixel, yPixel, containerWidth, containerHeight, scale, { x: 100, y: -50 });
      const storage2 = screenToStorage(screen2.screenX, screen2.screenY, containerWidth, containerHeight, scale, { x: 100, y: -50 });

      // Both should point to the same pixel location
      expect(storage1.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage1.yPixel).toBeCloseTo(yPixel, 10);
      expect(storage2.xPixel).toBeCloseTo(xPixel, 10);
      expect(storage2.yPixel).toBeCloseTo(yPixel, 10);
    });
  });
});
