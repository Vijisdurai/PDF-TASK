# Implementation Plan

- [x] 1. Create AnnotationMarker component with adaptive styling





  - Create AnnotationMarker.tsx component with circular marker design (24px diameter)
  - Implement number display inside marker with white text on black background by default
  - Add automatic color contrast logic: if background is white (#FFFFFF) or high luminance, switch number to black
  - Apply hover effect with scale transform (1.1x)
  - Add click handler prop for marker interaction
  - Style with Tailwind classes: rounded-full, flex, items-center, justify-center
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create AnnotationOverlay component for unified marker rendering





  - Create AnnotationOverlay.tsx that renders markers on top of document/image
  - Implement double-click handler to capture coordinates for new annotations
  - Add coordinate transformation logic to convert screen clicks to storage coordinates
  - Filter annotations by current page for PDF/DOCX documents
  - Apply scale transforms for image annotation positioning
  - Calculate sequential marker numbers based on annotation creation order
  - Render AnnotationMarker components at correct screen positions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 5.1, 5.2, 5.3_

- [x] 3. Create useCoordinateMapper hook for coordinate transformations





  - Create useCoordinateMapper.ts hook with screenToStorage and storageToScreen functions
  - Implement percentage-based transformation for PDF/DOCX: (x/width)*100 and reverse
  - Implement pixel-based transformation for images: (x-panX)/scale and reverse
  - Handle container dimensions dynamically using containerRef
  - Support scale and pan parameters for image transformations
  - Return memoized transformation functions to prevent unnecessary re-renders
  - _Requirements: 2.2, 2.4, 5.2, 5.4_

- [ ] 4. Create useAnnotations hook for state management
  - Create useAnnotations.ts hook that manages annotation CRUD operations
  - Implement fetchAnnotations function to load annotations for a document on mount
  - Implement createAnnotation with optimistic UI update and backend sync
  - Implement updateAnnotation with optimistic UI update and backend sync
  - Implement deleteAnnotation with optimistic UI update and backend sync
  - Add error handling with retry logic for failed operations
  - Support offline mode by queuing operations in IndexedDB
  - Return annotations array, CRUD functions, loading state, and error state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [ ] 5. Create EditAnnotationModal component
  - Create EditAnnotationModal.tsx with modal overlay and backdrop
  - Add text area for editing annotation content
  - Add color picker input for changing marker color
  - Display formatted timestamp using date-fns format: "MMM dd, yyyy – h:mm a"
  - Display creator name (read-only)
  - Add Save button that calls onSave with updated content and color
  - Add Delete button with confirmation dialog that calls onDelete
  - Add Cancel button to close modal without saving
  - Style with Tailwind classes for modal layout
  - _Requirements: 4.2, 4.3, 4.4, 6.1, 6.2_

- [ ] 6. Create AnnotationsSidebar component
  - Creatay creator name for each annotation
  - Display formatted timestamp: "MMM dd, yyyy – h:mm a" (NO coordinate display)
  - Display annotation content text
  - Group annotations by page number for PDF documents
  - Add click handler on each note to highlight corresponding marker
  - Add edit button that opens EditAnnotationModal
  - Add delete button with confirmation
  - Style with Tailwind classes for sidebar layout
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 3.3_

- [ ] 7. Update PDFViewer component for annotation integration
  - Integrate AnnotationOverlay component into PDFViewer
  - Pass PDF.js viewport coordinates to useCoordinateMapper
  - Ensure annotations use percentage-based coordinates mapped to pdfRenderedViewport
  - Filter annotations to show only current page markers
  - Handle multi-page navigation with page-specific annotation display
  - Connect useAnnotations hook for CRUD operations
  - Pass annotations to AnnotationsSidebar component
  - DO NOT modify existing zoom controls, page navigation, or document loading logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Update DocxViewer component for annotation integration
  - Integrate AnnotationOverlay component into DocxViewer
  - Use rendered container's bounding box for coordinate mapping with useCoordinateMapper
  - Ensure annotations use percentage-based coordinates
  - Handle scroll behavior (DOCX scrolls rather than zooms)
  - Connect useAnnotations hook for CRUD operations
  - Pass annotations to AnnotationsSidebar component
  - Apply identical annotation logic as PDFViewer
  - DO NOT modify existing container size, toolbar, or document rendering logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 9. Update ImageViewer component for annotation integration
  - Integrate AnnotationOverlay component into ImageViewer
  - Pass natural image size, scale, and pan values to useCoordinateMapper
  - Ensure annotations use pixel-based coordinates with scale transforms
  - Verify markers remain anchored during zoom and pan operations
  - Connect useAnnotations hook for CRUD operations
  - Pass annotations to AnnotationsSidebar component
  - DO NOT modify existing zoom controls (zoom in/out/reset buttons, mouse wheel zoom)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 10. Update backend Annotation model for new fields
  - Add createdBy field (String) to Annotation model for creator name
  - Ensure annotation_type field exists ('document' or 'image')
  - Ensure color field exists (String, 7 chars for hex color)
  - Ensure page, x_percent, y_percent fields exist for document annotations
  - Ensure x_pixel, y_pixel fields exist for image annotations
  - Add database migration to add new fields to existing schema
  - Set default values: color='#000000', createdBy='User'
  - _Requirements: 1.3, 4.3, 6.1, 7.1_

- [ ] 11. Update annotation API schemas and validation
  - Update AnnotationCreate schema to include createdBy and color fields
  - Add validation for color field (must be valid hex format: #RRGGBB)
  - Add validation for annotation_type ('document' or 'image')
  - Ensure document annotations require page, x_percent, y_percent
  - Ensure image annotations require x_pixel, y_pixel
  - Update AnnotationResponse schema to include all new fields
  - _Requirements: 1.1, 4.1, 7.1_

- [ ] 12. Update IndexedDB schema and DatabaseService
  - Update Dexie schema to version 3 with createdBy and color fields
  - Add migration logic to set default color='#000000' and createdBy='User' for existing annotations
  - Update addAnnotation method to store new fields
  - Update getAnnotationsByDocument to return all fields
  - Ensure updateAnnotation preserves all fields including color
  - Ensure deleteAnnotation works correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13. Add TypeScript interfaces for complete type safety
  - Define AnnotationBase interface with id, documentId, content, createdAt, updatedAt, createdBy, color
  - Define DocumentAnnotation interface extending AnnotationBase with type='document', page, xPercent, yPercent
  - Define ImageAnnotation interface extending AnnotationBase with type='image', xPixel, yPixel
  - Define union type: Annotation = DocumentAnnotation | ImageAnnotation
  - Define CreateAnnotationData type for annotation creation
  - Define UpdateAnnotationData type for annotation updates
  - Export all interfaces from shared types file
  - _Requirements: 2.2, 5.2, 7.3_

- [ ] 14. Implement annotation sync and offline support
  - Add syncStatus field to IndexedDB annotations ('synced' | 'pending' | 'error')
  - Queue annotation operations when offline
  - Implement sync logic to push pending annotations when connection restored
  - Add retry logic with exponential backoff for failed syncs
  - Show sync status indicators in AnnotationsSidebar
  - Handle conflict resolution using last-write-wins based on updatedAt timestamp
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Add date-fns library for timestamp formatting
  - Install date-fns package: npm install date-fns
  - Import format function in AnnotationsSidebar and EditAnnotationModal
  - Use format(new Date(annotation.createdAt), "MMM dd, yyyy – h:mm a") for display
  - Ensure timestamps are displayed consistently across all components
  - _Requirements: 6.2_

- [ ]* 16. Write unit tests for coordinate transformations
  - Test percentage to screen conversion for PDF/DOCX at various container sizes
  - Test screen to percentage conversion for PDF/DOCX
  - Test pixel to screen conversion for images at various zoom levels and pan offsets
  - Test screen to pixel conversion for images
  - Test boundary conditions (0%, 100%, negative values, out of bounds)
  - _Requirements: 2.2, 2.4, 5.2, 5.4_

- [ ]* 17. Write unit tests for annotation marker styling
  - Test default marker appearance (black background, white number)
  - Test automatic color inversion when background is white
  - Test luminance calculation for automatic contrast
  - Test marker size (22-26px range)
  - Test hover state styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 18. Write integration tests for annotation CRUD operations
  - Test creating annotation via double-click on PDF document
  - Test creating annotation via double-click on DOCX document
  - Test creating annotation via double-click on image
  - Test editing annotation content through EditAnnotationModal
  - Test changing annotation color through color picker
  - Test deleting annotation with confirmation
  - Test annotation persistence after page reload
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [ ]* 19. Write integration tests for multi-page PDF annotations
  - Test creating annotations on different pages
  - Test that only current page annotations are displayed
  - Test navigation between pages with annotations
  - Test sidebar grouping by page number
  - Test clicking sidebar note navigates to correct page
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 20. Write integration tests for image zoom and pan with annotations
  - Test that annotations remain anchored during zoom in
  - Test that annotations remain anchored during zoom out
  - Test that annotations remain anchored during pan operations
  - Test annotation positioning at various zoom levels (0.5x, 1x, 2x, 4x)
  - Test creating annotations at different zoom levels
  - _Requirements: 5.3, 5.4, 5.5, 5.6_
