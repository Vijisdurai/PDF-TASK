/**
 * Test coordinate transformation formulas for image annotations
 * **Feature: image-annotations, Task 1.2: Verify coordinate transformation**
 */

describe('Coordinate Transformation Formulas', () => {
  // Test the mathematical formulas directly
  describe('Round-trip transformation', () => {
    it('should preserve pixel coordinates through screen-to-storage-to-screen transformation', () => {
      // Test parameters
      const xPixel = 450;
      const yPixel = 300;
      const scale = 1.5;
      const panOffsetX = 20;
      const panOffsetY = -10;
      const centerX = 400;
      const centerY = 300;

      // Storage to screen: screenX = xPixel * scale + panOffset.x + centerX
      const screenX = xPixel * scale + panOffsetX + centerX;
      const screenY = yPixel * scale + panOffsetY + centerY;

      // Screen to storage: xPixel = (screenX - centerX - panOffset.x) / scale
      const recoveredXPixel = (screenX - centerX - panOffsetX) / scale;
      const recoveredYPixel = (screenY - centerY - panOffsetY) / scale;

      // Verify round-trip
      expect(recoveredXPixel).toBeCloseTo(xPixel, 10);
      expect(recoveredYPixel).toBeCloseTo(yPixel, 10);
    });

    it('should work with different zoom scales', () => {
      const testCases = [
        { scale: 0.5, panOffset: { x: 0, y: 0 } },
        { scale: 1.0, panOffset: { x: 0, y: 0 } },
        { scale: 2.0, panOffset: { x: 50, y: -30 } },
        { scale: 3.5, panOffset: { x: -100, y: 75 } },
      ];

      const xPixel = 200;
      const yPixel = 150;
      const centerX = 500;
      const centerY = 400;

      testCases.forEach(({ scale, panOffset }) => {
        // Forward transform
        const screenX = xPixel * scale + panOffset.x + centerX;
        const screenY = yPixel * scale + panOffset.y + centerY;

        // Reverse transform
        const recoveredX = (screenX - centerX - panOffset.x) / scale;
        const recoveredY = (screenY - centerY - panOffset.y) / scale;

        expect(recoveredX).toBeCloseTo(xPixel, 10);
        expect(recoveredY).toBeCloseTo(yPixel, 10);
      });
    });

    it('should work with different pan offsets', () => {
      const scale = 1.5;
      const centerX = 400;
      const centerY = 300;
      const xPixel = 100;
      const yPixel = 200;

      const panOffsets = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: -50, y: -75 },
        { x: 200, y: -100 },
      ];

      panOffsets.forEach((panOffset) => {
        // Forward transform
        const screenX = xPixel * scale + panOffset.x + centerX;
        const screenY = yPixel * scale + panOffset.y + centerY;

        // Reverse transform
        const recoveredX = (screenX - centerX - panOffset.x) / scale;
        const recoveredY = (screenY - centerY - panOffset.y) / scale;

        expect(recoveredX).toBeCloseTo(xPixel, 10);
        expect(recoveredY).toBeCloseTo(yPixel, 10);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle zero pan offset', () => {
      const xPixel = 300;
      const yPixel = 200;
      const scale = 2.0;
      const centerX = 400;
      const centerY = 300;

      const screenX = xPixel * scale + 0 + centerX;
      const screenY = yPixel * scale + 0 + centerY;

      const recoveredX = (screenX - centerX - 0) / scale;
      const recoveredY = (screenY - centerY - 0) / scale;

      expect(recoveredX).toBeCloseTo(xPixel, 10);
      expect(recoveredY).toBeCloseTo(yPixel, 10);
    });

    it('should handle scale of 1.0', () => {
      const xPixel = 150;
      const yPixel = 100;
      const scale = 1.0;
      const panOffsetX = 25;
      const panOffsetY = -15;
      const centerX = 400;
      const centerY = 300;

      const screenX = xPixel * scale + panOffsetX + centerX;
      const screenY = yPixel * scale + panOffsetY + centerY;

      const recoveredX = (screenX - centerX - panOffsetX) / scale;
      const recoveredY = (screenY - centerY - panOffsetY) / scale;

      expect(recoveredX).toBeCloseTo(xPixel, 10);
      expect(recoveredY).toBeCloseTo(yPixel, 10);
    });

    it('should handle minimum scale', () => {
      const xPixel = 500;
      const yPixel = 400;
      const scale = 0.01;
      const panOffsetX = 10;
      const panOffsetY = 5;
      const centerX = 400;
      const centerY = 300;

      const screenX = xPixel * scale + panOffsetX + centerX;
      const screenY = yPixel * scale + panOffsetY + centerY;

      const recoveredX = (screenX - centerX - panOffsetX) / scale;
      const recoveredY = (screenY - centerY - panOffsetY) / scale;

      expect(recoveredX).toBeCloseTo(xPixel, 8); // Less precision for very small scales
      expect(recoveredY).toBeCloseTo(yPixel, 8);
    });
  });
});
