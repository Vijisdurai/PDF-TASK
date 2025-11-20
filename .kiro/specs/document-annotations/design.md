# Design Document: Document Annotations and Image Zoom

## Overview

This design implements a unified annotation system that works consistently across PDF, DOCX, and image files. The system provides:

- **Unified Marker System**: Circular markers (22-26px) with numbered labels and adaptive color contrast
- **Consistent Behavior**: Identical annotation logic across all document types with position anchoring during zoom/pan
- **Clean UI**: Sidebar with human-readable timestamps and no coordinate display
- **Complete CRUD**: Full create, edit, delete operations with color customization
- **Production-Ready**: No placeholders, complete implementations, deterministic logic

The system builds on existing infrastructure:
- **Backend**: SQLAlchemy models for documents and annotations
- **Frontend**: React components with TypeScript
- **Storage**: IndexedDB (Dexie) for offline-first architecture with sync capabilities

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  ImageViewer     │  │  PDFViewer       │                │
│  │  - Zoom controls │  │  - Page nav      │                │
│  │  - Pixel coords  │  │  - Page coords   │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                            │
│  ┌────────┴─────────────────────┴─────────┐                │
│  │     AnnotationManager Component        │                │
│  │  - Create/Edit/Delete annotations      │                │
│  │  - Color picker for image annotations  │                │
│  │  - Coordinate transformation           │                │
│  └────────┬───────────────────────────────┘                │
│           │                                                  │
│  ┌────────┴───────────────────────────────┐                │
│  │     IndexedDB (Dexie)                  │                │
│  │  - Offline storage                     │                │
│  │  - Sync queue                          │                │
│  └────────┬───────────────────────────────┘                │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ REST API
            │
┌───────────┼──────────────────────────────────────────────────┐
│           │         Backend (FastAPI)                        │
├───────────┴──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐                 │
│  │     Annotation API Router              │                 │
│  │  - CRUD endpoints                      │                 │
│  │  - Bulk operations                     │                 │
│  └────────┬───────────────────────────────┘                 │
│           │                                                  │
│  ┌────────┴───────────────────────────────┐                 │
│  │     SQLAlchemy Models                  │                 │
│  │  - Document model                      │                 │
│  │  - Enhanced Annotation model           │                 │
│  └────────┬───────────────────────────────┘                 │
│           │                                                  │
│  ┌────────┴───────────────────────────────┐                 │
│  │     SQLite Database                    │                 │
│  └────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Annotation Data Model

#### Backend Model Extension

The existing `Annotation` model needs to support both document and image annotations:

```python
class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(String(36), primary_key=True)
    document_id = Column(String(36), ForeignKey("documents.id"))
    
    # Coordinate system fields
    annotation_type = Column(String(20), nullable=False)  # 'document' or 'image'
    page = Column(Integer, nullable=True)  # For document annotations
    x_percent = Column(Numeric(5, 2), nullable=True)  # For document annotations
    y_percent = Column(Numeric(5, 2), nullable=True)  # For document annotations
    x_pixel = Column(Integer, nullable=True)  # For image annotations
    y_pixel = Column(Integer, nullable=True)  # For image annotations
    
    # Content and styling
    content = Column(Text, nullable=False)
    color = Column(String(7), nullable=True)  # Hex color code (e.g., '#FFFF00')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**Design Rationale**: 
- Unified model supports both coordinate systems without requiring separate tables
- `annotation_type` discriminator allows validation logic to ensure correct fields are populated
- Nullable coordinate fields allow flexibility while maintaining data integrity through application-level validation

#### Frontend TypeScript Interfaces

```typescript
// Base annotation interface
interface AnnotationBase {
  id: string;
  documentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Document annotation (page-based)
interface DocumentAnnotation extends AnnotationBase {
  type: 'document';
  page: number;
  xPercent: number;  // 0-100
  yPercent: number;  // 0-100
}

// Image annotation (pixel-based)
interface ImageAnnotation extends AnnotationBase {
  type: 'image';
  xPixel: number;
  yPixel: number;
  color?: string;  // Hex color code
}

type Annotation = DocumentAnnotation | ImageAnnotation;
```

### 2. ImageViewer Zoom Enhancement

The existing `ImageViewer` component already has zoom functionality. Enhancements needed:

**Current State**:
- ✅ Zoom in/out buttons
- ✅ Mouse wheel zoom
- ✅ Reset view
- ✅ Smooth transitions
- ✅ Aspect ratio preservation
- ✅ Pixel-locked annotations

**Required Enhancements**:
- Add keyboard shortcuts (already implemented: +/- for zoom, 0 for reset)
- Ensure zoom limits are appropriate (already implemented with MIN/MAX bounds)
- Verify smooth transitions during zoom (already implemented with CSS transitions)

**No major changes needed** - the ImageViewer already meets requirements.

### 3. Annotation Marker Component

Reusable component for rendering circular annotation markers:

```typescript
interface AnnotationMarkerProps {
  number: number;
  color: string;  // Hex color code
  position: { x: number; y: number };  // Screen coordinates
  onClick: () => void;
  isHighlighted?: boolean;
}
```

**Marker Styling Rules**:
- Circle shape with 24px diameter (22-26px range)
- Background color from annotation.color (default: #000000)
- Inner number color: white for dark backgrounds, black for white/light backgrounds
- Automatic contrast calculation: if background is #FFFFFF or luminance > 0.9, use black text
- CSS: `border-radius: 50%`, `display: flex`, `align-items: center`, `justify-content: center`
- Font: bold, 12-14px
- Cursor: pointer
- Hover state: slight scale transform (1.1x)

### 4. Annotation Overlay Component

Component that renders all annotation markers on top of the document/image:

```typescript
interface AnnotationOverlayProps {
  annotations: Annotation[];
  documentType: 'pdf' | 'docx' | 'image';
  currentPage?: number;  // For PDF/DOCX
  containerRef: React.RefObject<HTMLElement>;
  scale?: number;  // For images
  onAnnotationClick: (id: string) => void;
  onCreateAnnotation: (x: number, y: number) => void;
}
```

**Key Responsibilities**:
- Render markers at correct positions using coordinate transformation
- Handle double-click events for annotation creation
- Filter annotations by page for PDF/DOCX
- Apply scale transforms for image annotations
- Manage marker numbering (sequential based on creation order)

### 5. Annotations Sidebar Component

Sidebar component displaying all annotations with metadata:

```typescript
interface AnnotationsSidebarProps {
  annotations: Annotation[];
  documentType: 'pdf' | 'docx' | 'image';
  onAnnotationClick: (id: string) => void;
  onAnnotationEdit: (id: string) => void;
  onAnnotationDelete: (id: string) => void;
}
```

**Display Requirements**:
- Group by page for PDF documents
- Show creator name (from annotation.createdBy or default "User")
- Show formatted timestamp: `format(new Date(annotation.createdAt), "MMM dd, yyyy – h:mm a")`
- Show annotation content text
- NO coordinate display
- Click handler to focus marker on document
- Edit/delete buttons for each annotation

### 6. PDF Viewer Component

Component for displaying PDF documents with page-based annotations:

```typescript
interface PDFViewerProps {
  documentUrl: string;
  documentId: string;
  annotations: DocumentAnnotation[];
  onAnnotationCreate: (annotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<DocumentAnnotation>) => void;
  onAnnotationDelete: (id: string) => void;
}
```

**Implementation Requirements**:
- Use PDF.js for rendering (existing library)
- Map coordinates to pdfRenderedViewport coordinate system
- Handle multi-page navigation (existing controls - DO NOT MODIFY)
- Filter annotations by current page
- Convert double-click coordinates to percentage-based storage
- Maintain marker positions during zoom (existing zoom controls - DO NOT MODIFY)

### 7. DOCX Viewer Component

Component for displaying DOCX documents with annotations:

```typescript
interface DocxViewerProps {
  documentUrl: string;
  documentId: string;
  annotations: DocumentAnnotation[];
  onAnnotationCreate: (annotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<DocumentAnnotation>) => void;
  onAnnotationDelete: (id: string) => void;
}
```

**Implementation Requirements**:
- DOCX rendered as HTML or canvas (existing rendering - DO NOT MODIFY)
- Use rendered container's bounding box for coordinate mapping
- Annotations locked during scroll (viewer scrolls rather than zooms)
- Convert double-click coordinates to percentage-based storage
- Same annotation logic as PDF viewer

### 8. Coordinate Transformation Hooks

Custom hooks for coordinate mapping:

```typescript
// useCoordinateMapper.ts
interface CoordinateMapper {
  screenToStorage: (screenX: number, screenY: number) => StorageCoords;
  storageToScreen: (storageCoords: StorageCoords) => ScreenCoords;
}

function useCoordinateMapper(
  documentType: 'pdf' | 'docx' | 'image',
  containerRef: React.RefObject<HTMLElement>,
  scale?: number,
  naturalSize?: { width: number; height: number }
): CoordinateMapper;
```

**Transformation Logic**:

For PDF/DOCX (percentage-based):
```typescript
screenToStorage: (x, y) => ({
  xPercent: (x / containerWidth) * 100,
  yPercent: (y / containerHeight) * 100
})

storageToScreen: ({ xPercent, yPercent }) => ({
  x: (xPercent / 100) * containerWidth,
  y: (yPercent / 100) * containerHeight
})
```

For Images (pixel-based with scale):
```typescript
screenToStorage: (x, y) => ({
  xPixel: (x - panX) / scale,
  yPixel: (y - panY) / scale
})

storageToScreen: ({ xPixel, yPixel }) => ({
  x: xPixel * scale + panX,
  y: yPixel * scale + panY
})
```

### 9. Annotation State Management Hook

Custom hook for managing annotation CRUD operations:

```typescript
// useAnnotations.ts
interface UseAnnotationsReturn {
  annotations: Annotation[];
  createAnnotation: (data: CreateAnnotationData) => Promise<void>;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

function useAnnotations(documentId: string): UseAnnotationsReturn;
```

**Responsibilities**:
- Fetch annotations on mount
- Optimistic UI updates
- Sync with backend
- Handle offline mode with IndexedDB
- Error handling and retry logic

### 10. Annotation API Endpoints

Extend existing annotation API with new endpoints:

```
POST   /api/annotations                    - Create annotation
GET    /api/annotations/{document_id}      - Get all annotations for document
GET    /api/annotations/{document_id}/page/{page}  - Get annotations for specific page
PUT    /api/annotations/{id}               - Update annotation
DELETE /api/annotations/{id}               - Delete annotation
POST   /api/annotations/bulk               - Bulk create annotations
```

### 11. Edit Annotation Modal Component

Modal dialog for editing annotation content and color:

```typescript
interface EditAnnotationModalProps {
  annotation: Annotation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { content: string; color: string }) => void;
  onDelete: () => void;
}
```

**UI Requirements**:
- Text area for content editing
- Color picker for marker color selection
- Show formatted timestamp (read-only)
- Show creator name (read-only)
- Save button
- Delete button with confirmation
- Cancel button
- Modal overlay with backdrop

### 12. IndexedDB Schema Extension

Extend the existing Dexie schema to support new annotation fields:

```typescript
this.version(2).stores({
  documents: 'id, filename, originalFilename, mimeType, uploadedAt, syncStatus',
  annotations: 'id, documentId, page, type, [documentId+page], [documentId+type], createdAt, syncStatus'
}).upgrade(tx => {
  // Migration logic to add new fields to existing annotations
  return tx.table('annotations').toCollection().modify(annotation => {
    if (!annotation.type) {
      annotation.type = 'document';  // Default existing annotations to document type
    }
    if (!annotation.color) {
      annotation.color = '#000000';  // Default to black
    }
    if (!annotation.createdBy) {
      annotation.createdBy = 'User';  // Default creator
    }
  });
});
```

## Data Models

### Coordinate Systems

#### Document Coordinates (Percentage-Based)

For PDF and Word documents, coordinates are stored as percentages (0-100) relative to the page dimensions:

```
┌─────────────────────────────┐
│ (0, 0)                      │
│                             │
│         📝 (x%, y%)         │
│                             │
│                  (100, 100) │
└─────────────────────────────┘
```

**Advantages**:
- Resolution-independent
- Works across different zoom levels
- Consistent across different display sizes

**Transformation**:
```typescript
// Screen to percentage
const xPercent = (clickX / pageWidth) * 100;
const yPercent = (clickY / pageHeight) * 100;

// Percentage to screen
const screenX = (xPercent / 100) * pageWidth;
const screenY = (yPercent / 100) * pageHeight;
```

#### Image Coordinates (Pixel-Based)

For images, coordinates are stored as absolute pixel positions relative to the natural image size:

```
┌─────────────────────────────┐
│ (0, 0)                      │
│                             │
│      📝 (xPx, yPx)          │
│                             │
│         (naturalW, naturalH)│
└─────────────────────────────┘
```

**Advantages**:
- Precise positioning
- No rounding errors
- Direct mapping to image pixels

**Transformation** (already implemented in ImageViewer):
```typescript
// Screen to pixel (accounting for zoom and pan)
const xPixel = (screenX - panX) / scale;
const yPixel = (screenY - panY) / scale;

// Pixel to screen
const screenX = xPixel * scale + panX;
const screenY = yPixel * scale + panY;
```

### Annotation Storage Schema

#### Backend (SQLite)

```sql
CREATE TABLE annotations (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    annotation_type VARCHAR(20) NOT NULL,  -- 'document' or 'image'
    page INTEGER,
    x_percent DECIMAL(5,2),
    y_percent DECIMAL(5,2),
    x_pixel INTEGER,
    y_pixel INTEGER,
    content TEXT NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CHECK (
        (annotation_type = 'document' AND page IS NOT NULL AND x_percent IS NOT NULL AND y_percent IS NOT NULL) OR
        (annotation_type = 'image' AND x_pixel IS NOT NULL AND y_pixel IS NOT NULL)
    )
);

CREATE INDEX idx_annotations_document ON annotations(document_id);
CREATE INDEX idx_annotations_document_page ON annotations(document_id, page);
CREATE INDEX idx_annotations_type ON annotations(annotation_type);
```

#### Frontend (IndexedDB)

```typescript
interface StoredAnnotation {
  id: string;
  documentId: string;
  type: 'document' | 'image';
  
  // Document annotation fields
  page?: number;
  xPercent?: number;
  yPercent?: number;
  
  // Image annotation fields
  xPixel?: number;
  yPixel?: number;
  color?: string;
  
  // Common fields
  content: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}
```

## Error Handling

### Validation Errors

1. **Invalid Coordinates**
   - Document: Ensure percentages are 0-100
   - Image: Ensure pixels are within natural image bounds
   - Response: 400 Bad Request with descriptive error message

2. **Missing Required Fields**
   - Document annotations must have: page, xPercent, yPercent
   - Image annotations must have: xPixel, yPixel
   - Response: 400 Bad Request

3. **Empty Content**
   - Annotations must have non-empty content
   - Response: 400 Bad Request

### Sync Errors

1. **Offline Creation**
   - Store annotations locally with `syncStatus: 'pending'`
   - Retry sync when connection restored
   - Show sync status indicator in UI

2. **Conflict Resolution**
   - Last-write-wins strategy for updates
   - Use `updated_at` timestamp to determine winner
   - Log conflicts for user review

3. **Network Failures**
   - Graceful degradation to offline mode
   - Queue operations for retry
   - Show user-friendly error messages

### UI Error States

1. **Annotation Creation Failure**
   - Show toast notification
   - Keep annotation in draft state
   - Allow retry or cancel

2. **Invalid Position**
   - Prevent annotation creation outside bounds
   - Show visual feedback (cursor change, boundary highlight)

3. **Load Failures**
   - Show placeholder for missing annotations
   - Provide refresh button
   - Log errors for debugging

## Testing Strategy

### Unit Tests

1. **Coordinate Transformation**
   - Test percentage ↔ screen coordinate conversion
   - Test pixel ↔ screen coordinate conversion with zoom/pan
   - Test boundary conditions (0, 100%, max pixels)

2. **Annotation Validation**
   - Test required field validation
   - Test coordinate range validation
   - Test content validation (non-empty, max length)

3. **Data Model**
   - Test annotation type discrimination
   - Test database constraints
   - Test cascade deletion

### Integration Tests

1. **Annotation CRUD Operations**
   - Create annotation via UI
   - Edit annotation content and position
   - Delete annotation
   - Verify persistence across page reloads

2. **Zoom and Pan with Annotations**
   - Verify annotations stay locked to correct positions
   - Test at various zoom levels (0.25x to 4x)
   - Test pan boundaries with annotations

3. **Offline Sync**
   - Create annotations offline
   - Verify sync when online
   - Test conflict resolution

### End-to-End Tests

1. **Document Annotation Workflow**
   - Upload PDF/Word document
   - Navigate to specific page
   - Create annotation at position
   - Verify annotation persists
   - Verify annotation appears on correct page

2. **Image Annotation Workflow**
   - Upload image
   - Zoom to 200%
   - Create annotation with custom color
   - Pan image
   - Verify annotation stays at correct pixel position

3. **Multi-Session Persistence**
   - Create annotations
   - Close browser
   - Reopen application
   - Verify all annotations restored correctly

## Implementation Notes

### Performance Considerations

1. **Annotation Rendering**
   - Render only annotations for current page/view
   - Use virtualization for large annotation sets
   - Debounce position updates during pan/zoom

2. **Database Queries**
   - Index on (document_id, page) for fast page-specific queries
   - Index on (document_id, type) for filtering by annotation type
   - Use pagination for large result sets

3. **Sync Optimization**
   - Batch annotation updates
   - Use incremental sync (only changed annotations)
   - Implement exponential backoff for retries

### Browser Compatibility

- Target modern browsers with ES6+ support
- IndexedDB available in all major browsers
- CSS transforms for smooth zoom transitions
- Pointer events for touch and mouse support

### Accessibility

- Keyboard navigation for annotation management
- ARIA labels for annotation markers
- Screen reader support for annotation content
- High contrast mode support for annotation colors

### Security

- Sanitize annotation content to prevent XSS
- Validate all coordinates server-side
- Implement rate limiting on annotation creation
- Ensure proper authentication for annotation operations
