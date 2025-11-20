# Automatic Pan Mode - PDF Viewer

## Overview
The PDF viewer now automatically activates pan mode when the rendered page overflows the viewport, providing a seamless viewing experience similar to Chrome's PDF viewer.

## Pan Mode Activation

### Automatic Detection
Pan mode activates automatically when:
- **Horizontal overflow**: Document width > viewport width
- **Vertical overflow**: Document height > viewport height
- **Either dimension**: If the document is larger in ANY dimension, pan mode is enabled

```typescript
const isPannable = useMemo(() => {
  const docWidth = documentDimensions.width;
  const docHeight = documentDimensions.height;
  const containerWidth = containerDimensions.width;
  const containerHeight = containerDimensions.height;
  
  // Pan mode activates when document is larger than viewport in either dimension
  return docWidth > containerWidth || docHeight > containerHeight;
}, [documentDimensions, containerDimensions]);
```

## Interaction Methods

### 1. Mouse Drag
- **When**: Pan mode is active (document overflows viewport)
- **How**: Click and drag anywhere on the PDF
- **Visual feedback**: Cursor changes to 'grab' (hovering) or 'grabbing' (dragging)
- **Constraint**: Pan is clamped to document boundaries

### 2. Touch Drag (Mobile/Tablet)
- **When**: Pan mode is active
- **How**: Touch and drag with one finger
- **Behavior**: Same as mouse drag, with touch-optimized handling
- **Constraint**: Pan is clamped to document boundaries
- **Touch action**: Set to 'none' to prevent default browser scrolling

### 3. Normal Scrolling (Mouse Wheel)
- **When**: Pan mode is active
- **How**: Scroll with mouse wheel (no modifier keys)
- **Behavior**: 
  - Vertical scroll: Pans document up/down
  - Horizontal scroll (trackpad): Pans document left/right
- **Constraint**: Pan is clamped to document boundaries

### 4. Zoom (Ctrl/Cmd + Scroll)
- **When**: Always available
- **How**: Hold Ctrl (Windows/Linux) or Cmd (Mac) and scroll
- **Behavior**: Zooms in/out
- **Range**: 0.25x to 3x

## Pan Clamping Logic

The pan is always constrained to keep the document visible:

```typescript
// Horizontal clamping
if (docWidth > containerWidth) {
  const minX = containerWidth - docWidth;  // Left edge limit
  const maxX = 0;                          // Right edge limit
  clampedX = Math.max(minX, Math.min(maxX, rawX));
} else {
  // Center if document is smaller than viewport
  clampedX = (containerWidth - docWidth) / 2;
}

// Vertical clamping
if (docHeight > containerHeight) {
  const minY = containerHeight - docHeight;  // Top edge limit
  const maxY = 0;                            // Bottom edge limit
  clampedY = Math.max(minY, Math.min(maxY, rawY));
} else {
  // Center if document is smaller than viewport
  clampedY = (containerHeight - docHeight) / 2;
}
```

## User Experience

### Scenario 1: Document Fits in Viewport
- **Pan mode**: Disabled
- **Cursor**: Default pointer
- **Scrolling**: No effect (document already fully visible)
- **Zoom**: Available via Ctrl+scroll

### Scenario 2: Document Overflows Horizontally
- **Pan mode**: Enabled
- **Cursor**: Grab/grabbing
- **Scrolling**: Pans left/right
- **Drag**: Pans left/right
- **Vertical**: Centered (no vertical pan)

### Scenario 3: Document Overflows Vertically
- **Pan mode**: Enabled
- **Cursor**: Grab/grabbing
- **Scrolling**: Pans up/down
- **Drag**: Pans up/down
- **Horizontal**: Centered (no horizontal pan)

### Scenario 4: Document Overflows Both Dimensions
- **Pan mode**: Enabled
- **Cursor**: Grab/grabbing
- **Scrolling**: Pans in both directions
- **Drag**: Pans in both directions
- **Full 2D panning**: Available

## Technical Implementation

### Event Handlers

1. **Mouse Events**
   - `onMouseDown`: Initiates drag
   - `onMouseMove`: Updates pan position
   - `onMouseUp`: Ends drag
   - `onMouseLeave`: Ends drag (prevents stuck drag state)

2. **Touch Events**
   - `onTouchStart`: Initiates touch drag
   - `onTouchMove`: Updates pan position
   - `onTouchEnd`: Ends touch drag
   - `onTouchCancel`: Ends touch drag

3. **Wheel Events**
   - `onWheel`: Handles both zoom (Ctrl+scroll) and pan (normal scroll)

### State Management

```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
```

### Performance Optimizations

- **Transition control**: No transition during drag, smooth 0.1s transition when released
- **Clamping**: Efficient boundary checking prevents unnecessary calculations
- **useMemo**: Pan mode detection is memoized to prevent recalculation on every render

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: Touch support included
- ✅ Trackpad: Horizontal scroll support

## Testing

To test automatic pan mode:

1. Open a PDF document
2. Zoom in until document overflows viewport
3. Verify cursor changes to 'grab'
4. Test mouse drag - should pan smoothly
5. Test scroll wheel - should pan (not zoom)
6. Test Ctrl+scroll - should zoom (not pan)
7. On mobile: Test touch drag
8. Verify you cannot drag document out of view
9. Zoom out until document fits - pan mode should disable
