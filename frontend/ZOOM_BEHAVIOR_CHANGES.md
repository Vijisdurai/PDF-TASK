# Zoom Behavior Changes - Summary

## What Was Changed

### 1. Added State Tracking
```typescript
const [baseDocumentSize, setBaseDocumentSize] = useState({ width: 0, height: 0 }); // Size at scale=1
const [userHasScrolled, setUserHasScrolled] = useState(false);
```

### 2. Store Base Document Size
When rendering the page, we now store the document size at scale=1:
```typescript
const baseViewport = page.getViewport({ scale: 1 });
setBaseDocumentSize({ width: baseViewport.width, height: baseViewport.height });
```

### 3. Cursor-Centered Zoom (Ctrl+Scroll)
When zooming with Ctrl+scroll, the zoom now centers on the cursor position:
- Calculates the document point under the cursor
- Applies the new zoom scale
- Adjusts pan offset to keep that point under the cursor

### 4. Button Zoom Behavior
Zoom In/Out buttons now:
- If user hasn't scrolled: Keep top edge visible (reset pan to 0,0)
- If user has scrolled: Zoom from center of viewport

### 5. Fit Functions
Added three fit modes:
- `handleFitToWidth()`: Scales to fit viewport width
- `handleFitToPage()`: Scales to fit entire page in viewport
- `handleFitToScreen()`: Alias for fit-to-page

### 6. User Scroll Tracking
The `userHasScrolled` flag is set to `true` when:
- User drags/pans the document
- User scrolls with mouse wheel (vertical scroll)

Reset to `false` when:
- Reset view is clicked
- Fit modes are applied

## Current Pan Issue

The pan might not be working properly because we're using a **transform-based approach** instead of **scroll-based approach**.

### Current Implementation (Transform-based)
```typescript
<div style={{
  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
}}>
  <canvas />
</div>
```

### Problem
- Pan offset is managed via CSS transforms
- This doesn't integrate well with native scrolling
- Clamping logic might be incorrect for the current viewport

## What Needs to Be Fixed

The pan is likely not working because:

1. **Pan offset calculation is wrong** - The clamping logic assumes the document is positioned at (0,0) but with transforms it's positioned at the center
2. **No native scroll support** - We're preventing default scroll and manually managing pan, which feels unnatural
3. **Container overflow is hidden** - The container has `overflow: hidden` which prevents natural scrolling

## Recommended Fix

We should switch to a **scroll-based approach** like Chrome PDF viewer:

1. Use `overflow: auto` on container
2. Let the browser handle scrolling naturally
3. Only manage zoom scale
4. Remove manual pan offset management
5. Use `scrollLeft` and `scrollTop` for programmatic positioning

This would make the viewer behave exactly like Chrome's PDF viewer.
