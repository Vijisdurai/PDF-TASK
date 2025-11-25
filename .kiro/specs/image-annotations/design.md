# Design Document

## Overview

This document outlines the technical design for implementing pixel-locked image annotations in the document viewer application. The feature enables users to create, view, edit, and delete annotations on image documents with annotations maintaining their exact pixel positions during zoom and pan operations. The design replicates the existing PDF annotation system architecture for consistency.

The system uses a coordinate transformation approach where annotations are stored in pixel coordinates relative to the original image dimensions, then transformed to screen coordinates based on the current zoom scale and pan offset. This ensures annotations remain visually locked to the same image location regardless of viewport transformations.

## Architecture

### Component Hierarchy

```
DocumentViewerPage
├── DocumentViewer (routing component)
│   └── ImageViewer (for image documents)
│       ├── Image rendering with transform
│       └── AnnotationOverlay
│           ├── AnnotationMarker (multiple)
│           └── AnnotationInput (conditional)
└── Notes Panel (sidebar)
    ├── Notes List View
    └── Note Detail View
```

### Data Flow

1. **Annotation Creation**: User double-clicks → AnnotationOverlay captures screen coordinates → Transforms to pixel coordinates → Calls parent handler → API creates annotation → State updates → Re-render
2. **Annotation Display**: Annotations loaded from API → Stored in AppContext → Filtered by document → Transformed to screen coordinates → Rendered as markers
3. **Annotation Interaction**: User clicks marker → Handler triggered → Notes panel opens (if closed) → Selected annotation displayed → User can edit/delete


## Components and Interfaces

### ImageViewer Component

**Purpose**: Displays image documents with zoom, pan, and annotation capabilities.

**Props**:
```typescript
interface ImageViewerProps {
  documentUrl: string;
  documentId: string;
  zoomScale?: number;
  onZoomChange?: (scale: number) => void;
  annotations?: ImageAnnotation[];
  onAnnotationCreate?: (annotation: Omit<ImageAnnotation, "id" | "createdAt" | "updatedAt">) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Omit<ImageAnnotation, "id" | "documentId" | "createdAt">>) => void;
  onAnnotationDelete?: (id: string) => void;
  onAnnotationClick?: (annotation: ImageAnnotation) => void;
  className?: string;
}
```

**State**:
- `imgNatural`: Original image dimensions (width, height)
- `containerSize`: Viewport dimensions
- `scale`: Current zoom scale factor
- `translate`: Pan offset (x, y) in pixels
- `isLoaded`: Image load status
- `isDragging`: Pan drag state

**Key Behaviors**:
- Renders image with CSS transform for zoom/pan
- Passes scale and panOffset to AnnotationOverlay
- Handles wheel events for zoom
- Handles mouse events for pan
- Prevents annotation creation during drag operations


### AnnotationOverlay Component

**Purpose**: Manages annotation rendering, creation, and coordinate transformations.

**Props**:
```typescript
interface AnnotationOverlayProps {
  annotations: Annotation[];
  documentType: 'pdf' | 'docx' | 'image';
  currentPage?: number;
  containerWidth: number;
  containerHeight: number;
  documentWidth: number;
  documentHeight: number;
  scale?: number;
  panOffset?: { x: number; y: number };
  onAnnotationClick: (id: string) => void;
  onCreateAnnotation: (x: number, y: number, content: string) => void;
}
```

**Key Functions**:

1. **screenToStorage(screenX, screenY)**: Converts screen coordinates to storage coordinates
   - For images: `xPixel = (screenX - panOffset.x) / scale`
   - For images: `yPixel = (screenY - panOffset.y) / scale`
   - For PDFs: Uses percentage-based calculation

2. **storageToScreen(annotation)**: Converts storage coordinates to screen coordinates
   - For images: `screenX = xPixel * scale + panOffset.x`
   - For images: `screenY = yPixel * scale + panOffset.y`
   - For PDFs: Uses percentage-based calculation

3. **handleDoubleClick(event)**: Captures click location and opens annotation input
4. **handleInputSave(content)**: Creates annotation with stored coordinates
5. **handleMarkerClick(id)**: Triggers parent annotation click handler


### DocumentViewerPage Component

**Purpose**: Orchestrates document viewing, annotation management, and notes panel.

**Key Responsibilities**:
- Manages notes panel open/close state
- Handles annotation click events from viewers
- Opens notes panel when annotation marker is clicked
- Displays selected annotation in notes panel
- Provides edit/delete functionality for annotations

**Annotation Click Flow**:
```typescript
handleAnnotationClick(annotation) {
  // Find full annotation object
  const fullAnnotation = state.annotations.find(a => a.id === annotation.id);
  
  // Open notes panel if closed
  if (!state.isNotePanelOpen) {
    dispatch({ type: 'TOGGLE_NOTE_PANEL' });
  }
  
  // Set selected annotation for display
  setSelectedNote(fullAnnotation);
}
```


## Data Models

### ImageAnnotation Type

```typescript
interface ImageAnnotation extends AnnotationBase {
  type: 'image';
  xPixel: number;      // X coordinate in original image pixels
  yPixel: number;      // Y coordinate in original image pixels
  color?: string;      // Optional hex color code for marker
}

interface AnnotationBase {
  id: string;
  documentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Storage Format**: Annotations are stored with pixel coordinates relative to the original image dimensions. This ensures consistency regardless of how the image is displayed.

**Example**:
```json
{
  "id": "ann-123",
  "type": "image",
  "documentId": "doc-456",
  "xPixel": 450,
  "yPixel": 300,
  "content": "Important detail here",
  "color": "#FFEB3B",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Coordinate transformation round-trip

*For any* pixel coordinates (xPixel, yPixel), zoom scale, and pan offset, transforming to screen coordinates and back to pixel coordinates should yield the original values.

**Validates: Requirements 2.2, 2.3, 8.1, 8.2**

### Property 2: Annotation position invariance under zoom

*For any* annotation and any two different zoom scales, the annotation should point to the same pixel location on the original image.

**Validates: Requirements 2.1, 2.4**

### Property 3: Annotation position invariance under pan

*For any* annotation and any pan offset change, the annotation should maintain its position relative to the image pixels.

**Validates: Requirements 3.1, 3.2**

### Property 4: Marker count equals annotation count

*For any* set of annotations for a document, the number of rendered markers should equal the number of annotations.

**Validates: Requirements 4.1**

### Property 5: Marker numbering follows chronological order

*For any* set of annotations with different creation timestamps, markers should be numbered sequentially from oldest to newest.

**Validates: Requirements 4.2**


### Property 6: Marker color preservation

*For any* annotation with a color property, the rendered marker should display that exact color.

**Validates: Requirements 4.4**

### Property 7: Annotation click triggers correct handler

*For any* annotation marker, clicking it should trigger the click handler with the correct annotation ID and complete annotation object.

**Validates: Requirements 5.1, 5.2**

### Property 8: Annotation updates preserve required fields

*For any* annotation update, the system should persist the changes while maintaining documentId, xPixel, yPixel, and updating the timestamp.

**Validates: Requirements 5.4**

### Property 9: Annotation deletion removes marker

*For any* annotation, deleting it should reduce the total marker count by exactly one.

**Validates: Requirements 6.1, 6.2**

### Property 10: Deletion preserves chronological numbering

*For any* set of annotations, after deleting one annotation, the remaining markers should still be numbered in chronological order.

**Validates: Requirements 6.3**

### Property 11: Annotation storage includes all required fields

*For any* newly created annotation, the stored data should include documentId, xPixel, yPixel, content, color (if provided), createdAt, and updatedAt.

**Validates: Requirements 7.1, 7.4**

### Property 12: Annotation content preservation

*For any* annotation with text content, saving and retrieving the annotation should return the exact same content string.

**Validates: Requirements 1.3**


## Error Handling

### Coordinate Transformation Errors

**Scenario**: Invalid scale or pan offset values
**Handling**: Clamp scale to valid range (0.01 - 10.0), clamp pan offset to prevent image from moving completely out of view

**Scenario**: Division by zero in inverse transformation
**Handling**: Guard against zero scale values, use minimum scale of 0.01

### Annotation Creation Errors

**Scenario**: API failure during annotation creation
**Handling**: Display error toast, do not add annotation to local state, allow user to retry

**Scenario**: Invalid pixel coordinates (negative or beyond image bounds)
**Handling**: Clamp coordinates to valid range [0, imageWidth] and [0, imageHeight]

### Annotation Loading Errors

**Scenario**: API failure when loading annotations
**Handling**: Display error message, allow viewer to function without annotations, provide retry mechanism

**Scenario**: Malformed annotation data
**Handling**: Skip invalid annotations, log error, display remaining valid annotations

### UI Interaction Errors

**Scenario**: Double-click during drag operation
**Handling**: Ignore annotation creation if isDragging flag is true

**Scenario**: Click on annotation marker during pan
**Handling**: Stop event propagation to prevent pan and trigger annotation click handler


## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

1. **Coordinate Transformation Functions**
   - Test screenToStorage with various scale and pan values
   - Test storageToScreen with various pixel coordinates
   - Test edge cases: scale=1.0, panOffset=(0,0), extreme zoom levels

2. **Annotation Handlers**
   - Test handleAnnotationCreate with valid and invalid coordinates
   - Test handleAnnotationClick with existing and non-existent IDs
   - Test handleAnnotationDelete and verify state updates

3. **UI Interaction Logic**
   - Test that double-click during drag does not create annotation
   - Test that clicking marker stops event propagation
   - Test annotation input dialog open/close behavior

4. **Notes Panel Integration**
   - Test that clicking marker opens notes panel if closed
   - Test that clicking marker selects correct annotation
   - Test navigation between list and detail views

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript/TypeScript property testing library):

1. **Property 1: Coordinate transformation round-trip**
   - Generate random pixel coordinates, scale, and pan offset
   - Transform to screen coordinates then back to pixel coordinates
   - Verify original values are recovered (within floating-point tolerance)
   - Run 100+ iterations

2. **Property 2: Annotation position invariance under zoom**
   - Generate random annotation and two different zoom scales
   - Calculate screen position at both scales
   - Verify both point to same pixel location when transformed back
   - Run 100+ iterations

3. **Property 3: Annotation position invariance under pan**
   - Generate random annotation and two different pan offsets
   - Calculate screen position with both offsets
   - Verify both point to same pixel location when transformed back
   - Run 100+ iterations

4. **Property 4: Marker count equals annotation count**
   - Generate random number of annotations (0-50)
   - Render component and count markers
   - Verify marker count equals annotation count
   - Run 100+ iterations

5. **Property 5: Marker numbering follows chronological order**
   - Generate random annotations with different timestamps
   - Render component and extract marker numbers
   - Verify numbers are sequential and match chronological order
   - Run 100+ iterations

6. **Property 6: Marker color preservation**
   - Generate random annotations with various color values
   - Render markers and extract color styles
   - Verify rendered colors match annotation colors
   - Run 100+ iterations

7. **Property 7: Annotation click triggers correct handler**
   - Generate random annotations
   - Simulate click on each marker
   - Verify handler called with correct ID and object
   - Run 100+ iterations

8. **Property 8: Annotation updates preserve required fields**
   - Generate random annotation updates
   - Apply updates and verify required fields unchanged
   - Verify timestamp is updated
   - Run 100+ iterations

9. **Property 9: Annotation deletion removes marker**
   - Generate random set of annotations
   - Delete one annotation
   - Verify marker count decreased by one
   - Run 100+ iterations

10. **Property 10: Deletion preserves chronological numbering**
    - Generate random annotations
    - Delete one annotation
    - Verify remaining markers still numbered chronologically
    - Run 100+ iterations

11. **Property 11: Annotation storage includes all required fields**
    - Generate random annotation data
    - Create annotation
    - Verify stored object has all required fields
    - Run 100+ iterations

12. **Property 12: Annotation content preservation**
    - Generate random text content (including special characters, unicode)
    - Create annotation with content
    - Retrieve annotation
    - Verify content matches exactly
    - Run 100+ iterations

**Property Test Tags**: Each property-based test must include a comment with the format:
```typescript
// **Feature: image-annotations, Property 1: Coordinate transformation round-trip**
```

This links the test to the specific correctness property in this design document.

