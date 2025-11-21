# Design Document

## Overview

The Advanced Document Viewer system provides a professional-grade viewing experience for PDFs and images with Chrome-style controls for PDFs and Pinterest-style deep zoom for images. The architecture follows a component-based design with shared toolbar controls, gesture handling, and a collapsible notes panel.

## Architecture

### Component Hierarchy

```
DocumentViewer (Route Component)
├── ViewerToolbar (Shared Controls)
│   ├── ZoomControls
│   ├── FitModeButtons
│   ├── PageNavigation (PDF only)
│   └── ActionButtons (Notes, Reset, Fullscreen)
├── PdfViewer (PDF Rendering)
│   ├── PdfCanvas (per page)
│   ├── ZoomHandler
│   └── PanHandler
├── ImageViewer (Image Rendering)
│   ├── TransformableImage
│   ├── ZoomHandler
│   └── PanHandler
└── NotesPanel (Collapsible Sidebar)
    ├── NotesHeader
    ├── NotesList
    └── NoteEditor
```

### State Management

Use React Context for viewer state:
- `ViewerContext`: Manages zoom, pan, page, fit mode, notes visibility
- `DocumentContext`: Manages document metadata, type, loading state
- `NotesContext`: Manages notes data and CRUD operations

### Technology Stack

- **PDF Rendering**: pdfjs-dist
- **Gesture Handling**: React Pointer Events + custom hooks
- **Animation**: requestAnimationFrame for smooth transforms
- **Styling**: Tailwind CSS with glassmorphic design
- **Backend**: FastAPI with file streaming

## Components and Interfaces

### 1. PdfViewer Component

**Props:**
```typescript
interface PdfViewerProps {
  documentId: string;
  fileUrl: string;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}
```

**State:**
```typescript
interface PdfViewerState {
  scale: number;
  pageNumber: number;
  totalPages: number;
  fitMode: 'fitWidth' | 'fitPage' | 'fitScreen' | 'custom';
  rotation: number;
  translateX: number;
  translateY: number;
  isPanning: boolean;
}
```

**Key Methods:**
- `loadPdf(url: string)`: Initialize PDF.js and load document
- `renderPage(pageNum: number)`: Render specific page to canvas
- `handleZoom(delta: number, cursorX: number, cursorY: number)`: Apply cursor-centered zoom
- `handlePan(deltaX: number, deltaY: number)`: Update translate values
- `setFitMode(mode: FitMode)`: Calculate and apply fit scale
- `goToPage(page: number)`: Navigate to specific page

**Rendering Logic:**
```typescript
// Canvas rendering at high DPI
const canvas = canvasRef.current;
const context = canvas.getContext('2d');
const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });

canvas.width = viewport.width;
canvas.height = viewport.height;
canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

await page.render({ canvasContext: context, viewport }).promise;
```

**Cursor-Centered Zoom:**
```typescript
const handleWheelZoom = (e: WheelEvent) => {
  // Only zoom if explicitly activated (Requirement 2.3)
  if (!isZoomActivated) return;
  
  e.preventDefault();
  
  const rect = containerRef.current.getBoundingClientRect();
  const cursorX = e.clientX - rect.left;
  const cursorY = e.clientY - rect.top;
  
  // Image-space coordinates before zoom
  const imgX = (cursorX - translateX) / scale;
  const imgY = (cursorY - translateY) / scale;
  
  // Apply zoom
  const newScale = clamp(scale * (1 - e.deltaY * 0.001), minScale, maxScale);
  
  // Adjust translate to keep cursor position fixed
  const newTranslateX = cursorX - imgX * newScale;
  const newTranslateY = cursorY - imgY * newScale;
  
  setState({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
};
```

### 2. ImageViewer Component

**Props:**
```typescript
interface ImageViewerProps {
  documentId: string;
  imageUrl: string;
  onZoomChange?: (zoom: number) => void;
}
```

**State:**
```typescript
interface ImageViewerState {
  scale: number;
  translateX: number;
  translateY: number;
  minScale: number;
  maxScale: number;
  isDragging: boolean;
  velocity: { x: number; y: number };
  lastTapTime: number;
}
```

**Key Methods:**
- `handleWheelZoom(e: WheelEvent)`: Continuous scroll zoom (only when activated)
- `handleDoubleTap(e: PointerEvent)`: Toggle zoom in/out
- `handlePinchZoom(e1: PointerEvent, e2: PointerEvent)`: Two-finger zoom
- `handleDrag(deltaX: number, deltaY: number)`: Pan with drag
- `applyInertia()`: Velocity-based momentum after release
- `clampBoundaries()`: Ensure minimum 100px of image remains visible (Requirement 2.10)

**Transform Application:**
```typescript
<div
  ref={imageContainerRef}
  style={{
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
    transformOrigin: '0 0',
    willChange: 'transform',
    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
  }}
>
  <img src={imageUrl} alt="Document" />
</div>
```

**Inertia Implementation:**
```typescript
const applyInertia = () => {
  if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
    return; // Stop animation
  }
  
  const newTranslateX = translateX + velocity.x;
  const newTranslateY = translateY + velocity.y;
  
  // Apply friction
  velocity.x *= 0.95;
  velocity.y *= 0.95;
  
  setState({ 
    translateX: clampX(newTranslateX), 
    translateY: clampY(newTranslateY),
    velocity 
  });
  
  requestAnimationFrame(applyInertia);
};

// Boundary clamping to maintain 100px minimum visible (Requirement 2.10)
const clampX = (x: number) => {
  const minX = viewportWidth - imageWidth * scale + 100;
  const maxX = -100;
  return clamp(x, minX, maxX);
};

const clampY = (y: number) => {
  const minY = viewportHeight - imageHeight * scale + 100;
  const maxY = -100;
  return clamp(y, minY, maxY);
};
```

### 3. ViewerToolbar Component

**Props:**
```typescript
interface ViewerToolbarProps {
  documentType: 'pdf' | 'image';
  scale: number;
  currentPage?: number;
  totalPages?: number;
  fitMode: FitMode;
  isNotesOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onFitModeChange: (mode: FitMode) => void;
  onPageChange?: (page: number) => void;
  onToggleNotes: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}
```

**Layout:**
```
[Fit to Screen] [Zoom Out] [125%] [Zoom In] | [Page 1 of 10] | [Notes] [Reset] [Fullscreen]
```

**Editable Zoom Input:**
```typescript
const [isEditingZoom, setIsEditingZoom] = useState(false);
const [zoomInput, setZoomInput] = useState('');

const handleZoomClick = () => {
  setIsEditingZoom(true);
  setZoomInput(Math.round(scale * 100).toString());
};

const handleZoomSubmit = () => {
  const value = parseInt(zoomInput);
  if (!isNaN(value)) {
    // Constrain to 10-500% range (Requirement 1.5)
    const clampedZoom = clamp(value, 10, 500) / 100;
    onZoomChange(clampedZoom);
  }
  setIsEditingZoom(false);
};
```

### 4. NotesPanel Component

**Props:**
```typescript
interface NotesPanelProps {
  documentId: string;
  currentPage?: number;
  isOpen: boolean;
  onClose: () => void;
}
```

**State:**
```typescript
interface Note {
  id: string;
  documentId: string;
  page?: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Notes    Page 5 • 12 notes  │ ← Header (matches toolbar height)
├─────────────────────────────┤
│ [Note 1]                    │
│ [Note 2]                    │
│ [Note 3]                    │
│ ...                         │
└─────────────────────────────┘
```

**Key Methods:**
- `fetchNotes(documentId: string)`: Load notes from backend
- `createNote(content: string, page?: number)`: Add new note
- `updateNote(id: string, content: string)`: Edit existing note
- `deleteNote(id: string)`: Remove note
- `filterByPage(page: number)`: Show only notes for current page

## Data Models

### Document Metadata

```typescript
interface DocumentMetadata {
  id: string;
  type: 'pdf' | 'image';
  title: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  pageCount?: number; // PDF only
  width?: number; // Image only
  height?: number; // Image only
  uploadedAt: Date;
  tags: string[];
}
```

### Viewer State

```typescript
interface ViewerState {
  // Common
  scale: number;
  translateX: number;
  translateY: number;
  fitMode: 'fitWidth' | 'fitPage' | 'fitScreen' | 'custom';
  isNotesOpen: boolean;
  
  // PDF specific
  pageNumber?: number;
  totalPages?: number;
  rotation?: number;
  
  // Image specific
  minScale?: number;
  maxScale?: number;
  velocity?: { x: number; y: number };
}
```

## Error Handling

### PDF Loading Errors
- Display error message if PDF.js fails to load
- Retry mechanism with exponential backoff
- Fallback to download link if rendering fails

### Image Loading Errors
- Show placeholder while loading
- Display error state if image fails to load
- Support for progressive image loading

### API Errors
- Handle 404 for missing documents
- Handle 403 for unauthorized access
- Display user-friendly error messages
- Retry failed requests with exponential backoff

## Testing Strategy

### Unit Tests
- Zoom calculation logic
- Pan boundary clamping
- Cursor-centered zoom math
- Fit mode calculations
- Page navigation bounds

### Integration Tests
- PDF.js integration
- Gesture event handling
- Keyboard shortcuts
- Notes CRUD operations
- File upload and retrieval

### E2E Tests
- Complete PDF viewing workflow
- Complete image viewing workflow
- Notes panel interactions
- Multi-touch gestures on mobile
- Keyboard navigation

### Performance Tests
- Large PDF rendering (100+ pages)
- High-resolution image zoom
- Smooth 60fps pan and zoom
- Memory usage during long sessions

## Performance Considerations

### PDF Rendering
- Render only visible pages + 1 page buffer
- Use canvas pooling to reduce memory
- Implement virtual scrolling for page list
- Cache rendered pages in memory (LRU)

### Image Zoom
- Use CSS transforms (GPU accelerated)
- Implement tile-based loading for very large images
- Lazy load high-res version only when zoomed
- Use `will-change: transform` for smooth animations

### Gesture Handling
- Debounce wheel events
- Use passive event listeners where possible
- Implement RAF-based animation loop
- Cancel animations on new user input

## Accessibility

- Keyboard navigation support
- ARIA labels for all controls
- Focus management for modal states
- Screen reader announcements for page changes
- High contrast mode support
- Zoom level announcements

## Security Considerations

- Validate file types on upload
- Sanitize filenames
- Implement file size limits
- Use secure file streaming (no direct file system access)
- Validate user permissions before serving files
- Prevent XSS in notes content
