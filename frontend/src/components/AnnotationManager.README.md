# AnnotationManager

A comprehensive annotation management system for document and image viewers with coordinate transformation, validation, and error handling utilities.

## Overview

The AnnotationManager provides a unified interface for managing annotations across different document types (PDF/Word documents and images). It handles:

- **Coordinate Transformations**: Convert between screen, percentage, and pixel coordinate systems
- **Validation**: Ensure annotation data integrity with comprehensive validation rules
- **Error Handling**: Graceful error handling with detailed error messages
- **Shared Components**: Reusable annotation marker components with customizable styling

## Components

### 1. AnnotationManager (Render Prop Pattern)

A component that provides annotation utilities through a render prop pattern.

```tsx
import AnnotationManager from './components/AnnotationManager';

<AnnotationManager
  documentId="doc-123"
  documentType="document"
  containerWidth={800}
  containerHeight={600}
  documentWidth={612}
  documentHeight={792}
  scale={1.0}
  panOffset={{ x: 0, y: 0 }}
  currentPage={1}
  annotations={annotations}
  onAnnotationCreate={handleCreate}
  onAnnotationUpdate={handleUpdate}
  onAnnotationDelete={handleDelete}
  onError={handleError}
>
  {(utils) => (
    <div>
      {/* Use utils.createAnnotation, utils.getVisibleAnnotations, etc. */}
    </div>
  )}
</AnnotationManager>
```

### 2. useAnnotationManager Hook

A simpler hook-based API for annotation management.

```tsx
import { useAnnotationManager } from './hooks/useAnnotationManager';

const annotationManager = useAnnotationManager({
  documentId: "doc-123",
  documentType: "image",
  containerWidth: 800,
  containerHeight: 600,
  documentWidth: 1920,
  documentHeight: 1080,
  scale: 1.0,
  panOffset: { x: 0, y: 0 },
  annotations,
  onAnnotationCreate: handleCreate,
  onAnnotationUpdate: handleUpdate,
  onAnnotationDelete: handleDelete,
});

// Use annotationManager.createAnnotation, annotationManager.visibleAnnotations, etc.
```

### 3. SharedAnnotationMarker

A reusable annotation marker component with customizable styling.

```tsx
import SharedAnnotationMarker from './components/SharedAnnotationMarker';

<SharedAnnotationMarker
  id={annotation.id}
  x={screenX}
  y={screenY}
  content={annotation.content}
  color={annotation.color}
  variant="image"
  size="medium"
  isSelected={selectedId === annotation.id}
  onClick={handleClick}
  onHover={handleHover}
/>
```

## Utilities

### Coordinate Transformations

```tsx
import {
  screenToPercentage,
  percentageToScreen,
  screenToPixel,
  pixelToScreen,
  isWithinDocumentBounds,
  isAnnotationVisible
} from './utils/coordinateTransforms';

// Convert screen coordinates to percentage (for documents)
const percentCoords = screenToPercentage(clientX, clientY, transformContext);

// Convert percentage back to screen
const screenCoords = percentageToScreen(xPercent, yPercent, transformContext);

// Convert screen coordinates to pixels (for images)
const pixelCoords = screenToPixel(clientX, clientY, transformContext);

// Convert pixels back to screen
const screenCoords = pixelToScreen(xPixel, yPixel, transformContext);

// Check if coordinates are within bounds
const isValid = isWithinDocumentBounds(clientX, clientY, transformContext);

// Check if annotation is visible in viewport
const isVisible = isAnnotationVisible(screenCoords, containerWidth, containerHeight);
```

### Validation

```tsx
import {
  validateDocumentAnnotation,
  validateImageAnnotation,
  validateAnnotation,
  sanitizeContent,
  isValidHexColor,
  normalizeHexColor
} from './utils/annotationValidation';

// Validate document annotation
const result = validateDocumentAnnotation(annotation);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}

// Validate image annotation
const result = validateImageAnnotation(annotation, imageWidth, imageHeight);

// Validate any annotation (auto-detects type)
const result = validateAnnotation(annotation, imageWidth, imageHeight);

// Sanitize content (remove HTML, trim, limit length)
const clean = sanitizeContent(userInput);

// Validate and normalize hex colors
if (isValidHexColor(color)) {
  const normalized = normalizeHexColor(color); // Returns uppercase format
}
```

## API Reference

### AnnotationManager Props

| Prop | Type | Description |
|------|------|-------------|
| `documentId` | `string` | Unique document identifier |
| `documentType` | `'document' \| 'image'` | Type of document |
| `containerWidth` | `number` | Viewport width in pixels |
| `containerHeight` | `number` | Viewport height in pixels |
| `documentWidth` | `number` | Document/image width |
| `documentHeight` | `number` | Document/image height |
| `scale` | `number` | Current zoom scale |
| `panOffset` | `{ x: number; y: number }` | Pan offset |
| `currentPage` | `number` | Current page (for documents) |
| `annotations` | `Annotation[]` | Array of annotations |
| `onAnnotationCreate` | `function` | Create callback |
| `onAnnotationUpdate` | `function` | Update callback |
| `onAnnotationDelete` | `function` | Delete callback |
| `onError` | `function` | Error callback |
| `children` | `function` | Render prop function |

### AnnotationManagerUtils

The utilities object provided by AnnotationManager includes:

#### Coordinate Transformations
- `screenToPercentage(screenX, screenY)` - Convert screen to percentage coords
- `percentageToScreen(xPercent, yPercent)` - Convert percentage to screen coords
- `screenToPixel(screenX, screenY)` - Convert screen to pixel coords
- `pixelToScreen(xPixel, yPixel)` - Convert pixel to screen coords

#### Validation
- `isWithinBounds(screenX, screenY)` - Check if coords are within document
- `validateAnnotation(annotation)` - Validate annotation data
- `sanitizeContent(content)` - Sanitize annotation content

#### Annotation Operations
- `createAnnotation(screenX, screenY, content, options)` - Create new annotation
- `updateAnnotation(id, updates)` - Update existing annotation
- `deleteAnnotation(id)` - Delete annotation

#### Filtering and Visibility
- `getVisibleAnnotations()` - Get annotations for current page/view
- `getAnnotationScreenPosition(annotation)` - Get screen position of annotation
- `isAnnotationVisible(annotation)` - Check if annotation is in viewport

#### Error Handling
- `handleError(error)` - Handle annotation errors

## Coordinate Systems

### Document Annotations (Percentage-Based)

Document annotations use percentage coordinates (0-100) relative to page dimensions:

```
┌─────────────────────────────┐
│ (0, 0)                      │
│                             │
│         📝 (x%, y%)         │
│                             │
│                  (100, 100) │
└─────────────────────────────┘
```

**Advantages:**
- Resolution-independent
- Works across different zoom levels
- Consistent across different display sizes

### Image Annotations (Pixel-Based)

Image annotations use absolute pixel positions relative to natural image size:

```
┌─────────────────────────────┐
│ (0, 0)                      │
│                             │
│      📝 (xPx, yPx)          │
│                             │
│         (naturalW, naturalH)│
└─────────────────────────────┘
```

**Advantages:**
- Precise positioning
- No rounding errors
- Direct mapping to image pixels

## Validation Rules

### Document Annotations

- `documentId`: Required, non-empty string
- `content`: Required, 1-5000 characters
- `page`: Required, positive integer
- `xPercent`: Required, 0-100 range
- `yPercent`: Required, 0-100 range

### Image Annotations

- `documentId`: Required, non-empty string
- `content`: Required, 1-5000 characters
- `xPixel`: Required, within image width
- `yPixel`: Required, within image height
- `color`: Optional, valid hex format (#RRGGBB)

## Error Handling

The AnnotationManager provides three types of errors:

1. **Validation Errors**: Invalid annotation data
2. **Coordinate Errors**: Coordinates outside bounds
3. **Operation Errors**: Failed CRUD operations

```tsx
const handleError = (error: AnnotationError) => {
  switch (error.type) {
    case 'validation':
      console.error('Validation failed:', error.details);
      break;
    case 'coordinate':
      console.error('Invalid coordinates:', error.message);
      break;
    case 'operation':
      console.error('Operation failed:', error.message);
      break;
  }
};
```

## Examples

See `AnnotationManagerExample.tsx` for complete working examples:

1. **Render Prop Pattern**: Using AnnotationManager component
2. **Hook Pattern**: Using useAnnotationManager hook
3. **Coordinate Transformations**: Converting between coordinate systems
4. **Validation**: Testing validation rules

## Best Practices

1. **Always validate coordinates** before creating annotations
2. **Sanitize user input** to prevent XSS attacks
3. **Handle errors gracefully** with user-friendly messages
4. **Use the hook API** for simpler components
5. **Filter annotations by page** for document viewers
6. **Check visibility** before rendering markers for performance
7. **Normalize colors** to ensure consistent format

## Performance Considerations

- Annotations are filtered by page/visibility before rendering
- Coordinate transformations are memoized
- Validation is performed before database operations
- Screen position calculations are cached

## Browser Compatibility

- Requires ES6+ support
- Uses modern JavaScript features (optional chaining, nullish coalescing)
- Compatible with all modern browsers
- No IE11 support

## License

Part of the document annotation system.
