# Document Panning Guide

## Overview
The AdvancedDocumentViewer supports panning (dragging) for both PDF and image documents when zoomed in.

## How Panning Works

### PDF Documents (PDFViewer)
- **When enabled**: Panning is enabled when `zoomScale !== 1.0` (i.e., when zoomed in or out from default)
- **How to pan**: Click and drag with the mouse
- **Visual feedback**: 
  - Cursor changes to `grab` when hovering (pannable state)
  - Cursor changes to `grabbing` when actively dragging
- **Smooth animation**: Uses framer-motion for smooth spring-based transitions

### Image Documents (ImageViewer)
- **When enabled**: Panning is always available
- **How to pan**: Click and drag with pointer (mouse/touch)
- **Clamping**: Pan is automatically clamped to prevent dragging the image outside the viewport
- **Smart behavior**: 
  - If image is smaller than viewport, it stays centered
  - If image is larger than viewport, you can pan to see all parts
- **Pointer capture**: Uses `setPointerCapture` for reliable drag tracking

## Zoom Controls

Both viewers support multiple zoom methods:

1. **Mouse wheel**: Ctrl/Cmd + scroll to zoom
2. **Toolbar buttons**: Zoom In (+), Zoom Out (-), Reset (↻)
3. **Keyboard shortcuts** (ImageViewer):
   - `+` or `=`: Zoom in
   - `-`: Zoom out
   - `0`: Reset view

## State Management

Pan and zoom state is managed globally through the AppContext:
- `viewerState.zoomScale`: Current zoom level
- `viewerState.panOffset`: Current pan position `{ x, y }`

This allows the state to persist when switching between documents or navigating away and back.

## Implementation Details

### PDFViewer Panning
```typescript
const isPannable = zoomScale !== 1.0;

const handleMouseDown = (event: React.MouseEvent) => {
  if (!isPannable) return;
  setIsDragging(true);
  setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
};

const handleMouseMove = (event: React.MouseEvent) => {
  if (!isDragging || !isPannable) return;
  const newOffset = {
    x: event.clientX - dragStart.x,
    y: event.clientY - dragStart.y
  };
  onPanChange(newOffset);
};
```

### ImageViewer Panning
```typescript
const onPointerDown = (e: React.PointerEvent) => {
  setIsPanning(true);
  dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
};

const onPointerMove = (e: React.PointerEvent) => {
  if (!isPanning || !dragStart.current) return;
  const nx = e.clientX - dragStart.current.x;
  const ny = e.clientY - dragStart.current.y;
  clampAndSetPan(nx, ny);
};
```

## Testing Panning

To test panning functionality:

1. Navigate to `/viewer/:documentId` with a valid document ID
2. Use zoom controls to zoom in (must be > 100% for PDFs)
3. Click and drag to pan around the document
4. Verify cursor changes appropriately
5. Verify smooth transitions and clamping behavior
