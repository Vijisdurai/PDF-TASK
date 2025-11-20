# Implementation Plan

- [x] 1. Extend backend annotation model and API
















  - Add `annotation_type`, `x_pixel`, `y_pixel`, and `color` fields to Annotation model
  - Update database schema with migration to add new columns
  - Add CHECK constraint to ensure correct fields are populated based on annotation_type
  - Create database indexes for (document_id, page) and (document_id, annotation_type)
  - _Requirements: 1.1, 1.2, 4.2, 5.1_

- [x] 1.1 Update annotation schemas for new fields


  - Modify AnnotationBase schema to include annotation_type discriminator
  - Create separate schemas for DocumentAnnotationCreate and ImageAnnotationCreate
  - Add color field validation (hex color format) to ImageAnnotationCreate
  - Update AnnotationResponse to include all new fields
  - Add validation logic to ensure document annotations have page/percentage fields and image annotations have pixel fields
  - _Requirements: 1.1, 4.2, 5.1, 5.2_

- [x] 1.2 Extend annotation API endpoints


  - Update POST /api/annotations endpoint to handle both annotation types
  - Modify GET /api/annotations/{document_id} to filter by annotation_type query parameter
  - Update PUT /api/annotations/{id} to handle updates for both annotation types
  - Add validation in API layer to ensure coordinate fields match annotation_type
  - _Requirements: 1.1, 1.4, 4.5, 4.6_

- [x] 2. Update frontend TypeScript interfaces and IndexedDB schema





  - Define DocumentAnnotation and ImageAnnotation TypeScript interfaces with proper type discrimination
  - Create union type Annotation = DocumentAnnotation | ImageAnnotation
  - Update IndexedDB schema to version 2 with new annotation fields
  - Write migration logic to set annotation_type = 'document' for existing annotations
  - Update Dexie indexes to include type and [documentId+type] compound index
  - _Requirements: 1.2, 4.2, 5.1_

- [x] 2.1 Update DatabaseService for new annotation fields


  - Modify addAnnotation to handle both annotation types
  - Update getAnnotationsByDocument to support filtering by annotation type
  - Add getAnnotationsByDocumentAndType helper method
  - Ensure all annotation CRUD operations preserve new fields (color, pixel coordinates)
  - _Requirements: 2.1, 6.1, 6.2_

- [x] 3. Enhance ImageViewer annotation functionality





  - Update ImageViewer to use ImageAnnotation type instead of generic AnnotationPoint
  - Add color picker UI to annotation creation dialog (replace prompt with modal)
  - Implement color selection for annotation markers (apply color to marker background)
  - Update annotation marker rendering to display custom colors
  - Ensure pixel coordinates are correctly stored and retrieved
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_

- [x] 3.1 Improve annotation edit/delete UI in ImageViewer

  - Replace prompt-based editing with a proper modal dialog
  - Add color picker to edit dialog for changing annotation color
  - Add delete button with confirmation to edit dialog
  - Display annotation metadata (created date, updated date) in edit dialog
  - _Requirements: 4.5, 4.6_

- [x] 4. Create PDFViewer component for document annotations





  - Create new PDFViewer component that displays converted document images page by page
  - Implement page navigation controls (previous, next, page number input)
  - Add click handler to capture coordinates and convert to percentage-based coordinates
  - Implement annotation marker rendering at percentage-based positions
  - Ensure annotations are filtered to show only current page annotations
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4.1 Implement document annotation creation in PDFViewer


  - Add double-click handler to create annotations on document pages
  - Convert screen coordinates to percentage coordinates (0-100 range)
  - Create annotation creation modal with content input
  - Store annotation with page number and percentage coordinates
  - Validate coordinates are within 0-100 range before saving
  - _Requirements: 1.1, 1.2_


- [x] 4.2 Implement document annotation edit/delete in PDFViewer

  - Add click handler on annotation markers to open edit dialog
  - Create edit modal for updating annotation content
  - Add delete functionality with confirmation
  - Update annotation position if user drags marker (optional enhancement)
  - _Requirements: 1.4, 1.5_

- [x] 5. Create AnnotationManager component for shared logic





  - Extract common annotation logic into reusable AnnotationManager component
  - Implement coordinate transformation utilities (percentage ↔ screen, pixel ↔ screen)
  - Create shared annotation marker component with customizable styling
  - Implement annotation validation logic (bounds checking, required fields)
  - Add error handling for invalid coordinates and failed operations
  - _Requirements: 1.2, 1.3, 4.3, 4.4_

- [x] 6. Implement annotation persistence and sync








  - Update API service to call new annotation endpoints with correct payload structure
  - Implement offline annotation creation with syncStatus tracking
  - Add sync logic to push pending annotations when connection restored
  - Implement conflict resolution using last-write-wins strategy based on updated_at
  - Add error handling for sync failures with retry logic
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_

- [x] 6.1 Add annotation sync status indicators to UI


  - Display sync status badge on annotations (synced, pending, error)
  - Add global sync status indicator in app header
  - Implement manual sync trigger button
  - Show toast notifications for sync success/failure
  - _Requirements: 2.1, 6.1_

- [x] 7. Update document viewer routing and integration





  - Update document viewer page to detect document type (PDF/Word vs Image)
  - Route to PDFViewer for PDF/Word documents
  - Route to ImageViewer for image files
  - Pass appropriate props (documentId, annotations, handlers) to each viewer
  - Ensure annotations are loaded for the current document on mount
  - _Requirements: 1.1, 4.1_

- [ ] 8. Add annotation filtering and search
  - Implement filter UI to show/hide annotations by type
  - Add search functionality to find annotations by content
  - Create annotation list sidebar showing all annotations for current document
  - Add click handler on list items to navigate to annotation location
  - _Requirements: 1.3, 4.3_

- [ ]* 9. Write coordinate transformation tests
  - Write unit tests for percentage to screen coordinate conversion
  - Write unit tests for pixel to screen coordinate conversion with various zoom/pan values
  - Test boundary conditions (0%, 100%, negative values, out of bounds)
  - Test coordinate transformation accuracy at different zoom levels
  - _Requirements: 1.3, 2.4, 4.4_

- [ ]* 10. Write annotation validation tests
  - Test annotation type validation (document vs image)
  - Test required field validation for each annotation type
  - Test coordinate range validation (0-100 for percentages, within image bounds for pixels)
  - Test content validation (non-empty, max length)
  - Test color validation (valid hex format)
  - _Requirements: 1.1, 4.1, 5.1_

- [ ]* 11. Write integration tests for annotation CRUD
  - Test creating document annotation via PDFViewer
  - Test creating image annotation via ImageViewer with custom color
  - Test editing annotation content and color
  - Test deleting annotation
  - Test annotation persistence across page navigation
  - _Requirements: 1.1, 1.4, 1.5, 4.1, 4.5, 4.6_

- [ ]* 12. Write zoom and pan tests with annotations
  - Test that image annotations stay at correct pixel positions during zoom
  - Test that document annotations stay at correct percentage positions during zoom
  - Test annotation rendering at various zoom levels (0.25x, 1x, 2x, 4x)
  - Test pan boundaries with annotations visible
  - _Requirements: 2.4, 3.4, 4.4_
