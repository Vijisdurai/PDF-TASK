# Unified Document Viewer - Complete Documentation

## 🎯 Overview

A production-ready PDF/DOCX viewer with browser-like behavior, smooth zoom/pan, and proper centering.

## ✅ Features Delivered

### 1. **Initial Load Behavior** (Matches Chrome/Edge PDF Viewer)
- ✅ Auto-detects PDF page size
- ✅ Calculates "fit-to-screen" scale automatically
- ✅ Centers PDF both horizontally and vertically
- ✅ Fixed container with PDF scaling inside (not zooming the container)
- ✅ Smooth rendering with no jitter

### 2. **Zoom Behavior**
- ✅ Zoom In / Zoom Out buttons
- ✅ Reset Zoom button
- ✅ Fit to Screen button
- ✅ Zoom applies to PDF canvas only (not container)
- ✅ PDF remains centered during zoom
- ✅ Smooth CSS transform transitions
- ✅ Min/max zoom limits (0.25x to 4x)
- ✅ Mouse wheel zoom (Ctrl+Scroll)
- ✅ Keyboard shortcuts (+, -, 0)
- ✅ No infinite zoom issues

### 3. **Pan Behavior**
- ✅ Click & drag to pan when zoomed in
- ✅ Panning has boundary limits
- ✅ Page cannot escape container
- ✅ Natural and smooth movement
- ✅ Cursor changes to grab/grabbing
- ✅ Panning disabled when at fit-to-screen scale

### 4. **Scroll Behavior**
- ✅ Normal page navigation with arrow buttons
- ✅ Smooth page transitions
- ✅ Zoomed pages stay within bounds

### 5. **Code Quality**
- ✅ Complete working React component
- ✅ TypeScript with full type safety
- ✅ TailwindCSS styling
- ✅ Framer Motion for smooth animations
- ✅ Modular utility functions
- ✅ Clean, production-ready code

---

## 📐 Coordinate System Explained

### **The Problem with Traditional Approaches**
Most PDF viewers zoom the entire container, causing:
- Content escaping boundaries
- Chaotic panning
- Poor centering
- Infinite zoom issues

### **Our Solution: Canvas Transform System**

```
┌─────────────────────────────────────┐
│         Container (Fixed)            │
│  ┌─────────────────────────────┐   │
│  │                              │   │
│  │    Canvas (Transformed)      │   │
│  │    • Position: absolute      │   │
│  │    • Left/Top: offset        │   │
│  │    • Transform: scale()      │   │
│  │                              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key Concepts:**

1. **Canvas renders at scale 1** (actual PDF size)
2. **CSS transform scales the canvas** (not the container)
3. **Offsets position the canvas** (for centering and panning)
4. **Clamping keeps content within bounds**

### **Coordinate Calculations**

```typescript
// Fit-to-screen scale (initial load)
fitScale = min(
  (containerWidth - padding) / pageWidth,
  (containerHeight - padding) / pageHeight
)

// Center offsets
offsetX = (containerWidth - pageWidth * scale) / 2
offsetY = (containerHeight - pageHeight * scale) / 2

// Clamp offsets (prevent escape)
if (scaledContent <= container) {
  offset = (container - scaledContent) / 2  // Center
} else {
  offset = clamp(offset, minOffset, maxOffset)  // Bound
}
```

---

## 🔧 Usage

### **Basic Usage**

```tsx
import UnifiedDocumentViewer from './components/UnifiedDocumentViewer';

function App() {
  return (
    <div className="h-screen">
      <UnifiedDocumentViewer
        documentUrl="/path/to/document.pdf"
        documentType="pdf"
        onPageChange={(page) => console.log('Page:', page)}
        onZoomChange={(zoom) => console.log('Zoom:', zoom)}
      />
    </div>
  );
}
```

### **Props**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `documentUrl` | `string` | ✅ | URL or path to the document |
| `documentType` | `'pdf' \| 'docx' \| 'image'` | ✅ | Type of document |
| `onPageChange` | `(page: number) => void` | ❌ | Callback when page changes |
| `onZoomChange` | `(zoom: number) => void` | ❌ | Callback when zoom changes |

### **Keyboard Shortcuts**

| Key | Action |
|-----|--------|
| `+` or `=` | Zoom In |
| `-` | Zoom Out |
| `0` | Reset Zoom |
| `Ctrl + Scroll` | Zoom towards cursor |

---

## 🎨 How It Matches Browser PDF Behavior

### **Chrome/Edge PDF Viewer Behavior**
1. Opens with entire page visible
2. Centers the page
3. Adds padding around edges
4. Smooth zoom towards cursor
5. Pan only when zoomed in

### **Our Implementation**
```typescript
// 1. Calculate fit scale (like browser)
const fitScale = calculateFitScale(
  pageWidth, pageHeight,
  containerWidth, containerHeight,
  padding: 40  // Same as browser padding
);

// 2. Center the page (like browser)
offsetX = (containerWidth - pageWidth * fitScale) / 2;
offsetY = (containerHeight - pageHeight * fitScale) / 2;

// 3. Zoom towards cursor (like browser)
const scaleRatio = newScale / oldScale;
newOffsetX = mouseX - (mouseX - offsetX) * scaleRatio;
newOffsetY = mouseY - (mouseY - offsetY) * scaleRatio;

// 4. Clamp to bounds (like browser)
offset = clampOffset(offset, contentSize, containerSize, scale);
```

---

## 🛠️ Utility Functions

### **calculateFitScale**
Calculates the scale needed to fit the entire page in the container.

```typescript
const calculateFitScale = (
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 40
): number => {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  const scaleX = availableWidth / pageWidth;
  const scaleY = availableHeight / pageHeight;
  
  return Math.min(scaleX, scaleY);
};
```

### **clampOffset**
Keeps content within container bounds while allowing panning.

```typescript
const clampOffset = (
  offset: number,
  contentSize: number,
  containerSize: number,
  scale: number
): number => {
  const scaledContentSize = contentSize * scale;
  
  // If content smaller than container, center it
  if (scaledContentSize <= containerSize) {
    return (containerSize - scaledContentSize) / 2;
  }
  
  // If content larger, allow panning within bounds
  const maxOffset = 0;
  const minOffset = containerSize - scaledContentSize;
  
  return Math.max(minOffset, Math.min(maxOffset, offset));
};
```

---

## 🚀 Advanced Features

### **Zoom Towards Cursor**
When using Ctrl+Scroll, the zoom focuses on the cursor position:

```typescript
const handleWheel = (e: React.WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
    
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const scaleRatio = newScale / oldScale;
    const newOffsetX = mouseX - (mouseX - offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - offsetY) * scaleRatio;
    
    updateViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
  }
};
```

### **Smooth Panning**
Panning is only enabled when zoomed beyond fit scale:

```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  // Only allow panning when zoomed in
  if (viewport.scale <= fitScale) return;
  
  setIsPanning(true);
  panStartRef.current = {
    x: e.clientX,
    y: e.clientY,
    offsetX: viewport.offsetX,
    offsetY: viewport.offsetY
  };
};
```

---

## 🎯 Why This Approach Works

### **Problems Solved**

| Problem | Solution |
|---------|----------|
| ❌ Container zooms instead of content | ✅ Canvas transforms with CSS scale |
| ❌ PDF escapes boundaries | ✅ Offset clamping with bounds checking |
| ❌ Poor centering | ✅ Calculated center offsets |
| ❌ Chaotic panning | ✅ Pan only when zoomed, with limits |
| ❌ Infinite zoom | ✅ Min/max scale limits |
| ❌ Jittery rendering | ✅ Smooth CSS transitions |

### **Performance Optimizations**

1. **Canvas renders once at scale 1** - no re-rendering on zoom
2. **CSS transforms for scaling** - GPU accelerated
3. **Refs for pan tracking** - no unnecessary re-renders
4. **Debounced resize handler** - smooth window resizing
5. **Render task cancellation** - prevents memory leaks

---

## 📦 Dependencies

```json
{
  "pdfjs-dist": "^4.0.0",
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.400.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0"
}
```

---

## 🐛 Troubleshooting

### **PDF doesn't center on load**
- Check that container has fixed dimensions
- Ensure `containerSize` state is updated
- Verify `fitScale` calculation

### **Zoom feels wrong**
- Adjust `MIN_SCALE` and `MAX_SCALE` constants
- Check zoom factor in `handleZoomIn/Out` (currently 1.25/0.8)

### **Panning is too sensitive**
- Adjust pan delta calculation
- Add damping factor to mouse movement

### **PDF escapes bounds**
- Verify `clampOffset` is being called
- Check offset calculations in `updateViewport`

---

## 🎓 Learning Resources

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [CSS Transform Origin](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 📝 License

MIT

---

## 👨‍💻 Author

Built with ❤️ by Kiro AI

**Need help?** Open an issue or contact support.
