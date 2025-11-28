# API & Data Models

## 1. Data Models

### Annotation Interface
The application uses a unified `Annotation` type that discriminates between document (PDF/DOCX) and image annotations.

```typescript
// Base properties shared by all annotations
interface AnnotationBase {
  id: string;
  documentId: string;
  content: string;
  color?: string; // Hex color code
  createdAt: Date;
  updatedAt: Date;
}

// Document Annotation (PDF/DOCX)
interface DocumentAnnotation extends AnnotationBase {
  type: 'document';
  page: number;      // Page number (1-based)
  xPercent: number;  // Horizontal position (0-100%)
  yPercent: number;  // Vertical position (0-100%)
}

// Image Annotation
interface ImageAnnotation extends AnnotationBase {
  type: 'image';
  xPixel: number;    // Horizontal position in pixels
  yPixel: number;    // Vertical position in pixels
}

type Annotation = DocumentAnnotation | ImageAnnotation;
```

### Document Metadata
```typescript
interface DocumentMetadata {
  id: string;
  filename: string;
  originalFilename?: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  convertedPath?: string; // Path for converted files (e.g., DOCX -> PDF)
}
```

## 2. API Service (`src/services/api.ts`)

The `ApiService` class handles all interactions with the backend REST API.

### Key Methods

#### `getAnnotations(documentId, page?, annotationType?)`
Fetches annotations for a specific document.
- **Parameters**:
  - `documentId`: ID of the document.
  - `page` (optional): Filter by page number.
  - `annotationType` (optional): Filter by 'document' or 'image'.
- **Returns**: `Promise<Annotation[]>`

#### `createAnnotation(annotation)`
Creates a new annotation.
- **Transforms**: Converts frontend camelCase properties to backend snake_case.
- **Payload**:
  - `annotation_type`: 'document' | 'image'
  - `x_percent` / `y_percent` (for documents)
  - `x_pixel` / `y_pixel` (for images)
  - `color`: Hex string

#### `updateAnnotation(id, updates)`
Updates an existing annotation.
- **Supports**: Partial updates (content, color, position).
- **Color Persistence**: Ensures the `color` field is correctly sent to the backend to persist changes.

### Data Transformation
The service implements bidirectional transformation to handle differences between frontend and backend naming conventions:

- **Frontend -> Backend**:
  - `xPercent` -> `x_percent`
  - `yPercent` -> `y_percent`
  - `xPixel` -> `x_pixel`
  - `yPixel` -> `y_pixel`
  - `documentId` -> `document_id`

- **Backend -> Frontend**:
  - `x_percent` -> `xPercent`
  - `y_percent` -> `yPercent`
  - `x_pixel` -> `xPixel`
  - `y_pixel` -> `yPixel`
  - `document_id` -> `documentId`

## 3. Database Service (`src/services/database.ts`)

Manages offline storage using IndexedDB (via Dexie.js).

### Schema
- **documents**: Stores document metadata and sync status.
- **annotations**: Stores annotations with support for compound indices (`[documentId+page]`, `[documentId+type]`) for efficient querying.

### Sync Status
Items in the local database track their synchronization state:
- `'synced'`: Data matches the server.
- `'pending'`: Local changes waiting to be pushed to the server.
- `'error'`: Sync failed.
