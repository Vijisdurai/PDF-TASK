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

- [x] 4. Create useAnnotations hook for state management
  - Create useAnnotations.ts hook that manages annotation CRUD operations
  - Implement fetchAnnotations function to load annotations for a document on mount
  - Implement createAnnotation with optimistic UI update and backend sync
  - Implement updateAnnotation with optimistic UI update and backend sync
  - Implement deleteAnnotation with optimistic UI update and backend sync
  - Add error handling with retry logic for failed operations
  - Support offline mode by queuing operations in IndexedDB
  - Return annotations array, CRUD functions, loading state, and error state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [x] 5. Create EditAnnotationModal component


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

- [x] 6. Backend Annotation model and API implementation
  - Backend model already has annotation_type, page, x_percent, y_percent, x_pixel, y_pixel, color fields
  - API endpoints already implemented for CRUD operations with proper validation
  - Schemas already support both document and image annotation types
  - Check constraints ensure correct fields are populated based on annotation_type
  - _Requirements: 1.1, 1.3, 4.1, 4.3, 6.1, 7.1_

- [x] 7. IndexedDB schema and DatabaseService implementation
  - Dexie schema version 2 already supports both document and image annotations
  - Migration logic already sets default type='document' for existing annotations
  - All CRUD methods already implemented with proper validation
  - Sync operations already implemented with syncStatus tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. TypeScript interfaces for type safety
  - AnnotationBase, DocumentAnnotation, and ImageAnnotation interfaces already defined in AppContext
  - Union type Annotation already exported
  - Type guards already implemented in database service
  - All interfaces properly exported and used throughout the application
  - _Requirements: 2.2, 5.2, 7.3_

- [x] 9. ImageViewer annotation integration
  - ImageViewer already has full annotation support with pixel-based coordinates
  - Annotations remain anchored during zoom and pan operations
  - Custom modal for creating and editing annotations with color picker
  - All CRUD operations properly implemented
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. date-fns library integration
  - date-fns already installed and used in EditAnnotationModal
  - Timestamp formatting already implemented with "MMM dd, yyyy – h:mm a" format
  - _Requirements: 6.2_

- [ ] 11. Create AnnotationsSidebar component
  - Create AnnotationsSidebar.tsx component with sidebar layout
  - Display creator name for each annotation (default: "User")
  - Display formatted timestamp: "MMM dd, yyyy – h:mm a" (NO coordinate display)
  - Display annotation content text with truncation for long content
  - Group annotations by page number for PDF documents
  - Add click handler on each note to highlight corresponding marker and scroll into view
  - Add edit button that triggers parent callback to open EditAnnotationModal
  - Add delete button with confirmation dialog
  - Show annotation count badge
  - Style with Tailwind classes for sidebar layout with proper spacing
  - Add empty state when no annotations exist
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 3.3_

- [ ] 12. Update PDFViewer component for annotation integration
  - Integrate AnnotationOverlay component into PDFViewer
  - Pass PDF.js viewport dimensions to AnnotationOverlay for coordinate mapping
  - Ensure annotations use percentage-based coordinates
  - Filter annotations to show only current page markers
  - Handle multi-page navigation with page-specific annotation display
  - Connect useAnnotations hook for CRUD operations
  - Add AnnotationsSidebar component to layout
  - Implement marker highlight when clicking sidebar note
  - DO NOT modify existing zoom controls, page navigation, or document loading logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 13. Update DocxViewer component for annotation integration
  - Integrate AnnotationOverlay component into DocxViewer
  - Use rendered container's bounding box for coordinate mapping
  - Ensure annotations use percentage-based coordinates
  - Handle scroll behavior (DOCX scrolls rather than zooms)
  - Connect useAnnotations hook for CRUD operations
  - Add AnnotationsSidebar component to layout
  - Implement marker highlight when clicking sidebar note
  - Apply identical annotation logic as PDFViewer
  - DO NOT modify existing container size, toolbar, or document rendering logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 14. Refactor ImageViewer to use unified annotation components
  - Replace custom annotation modal with AnnotationOverlay and EditAnnotationModal
  - Add AnnotationsSidebar component to ImageViewer layout
  - Ensure pixel-based coordinates continue to work correctly
  - Maintain existing zoom and pan functionality
  - Connect to useAnnotations hook for consistent state management
  - Remove duplicate annotation logic in favor of shared components
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 15. Write unit tests for coordinate transformations
  - Test percentage to screen conversion for PDF/DOCX at various container sizes
  - Test screen to percentage conversion for PDF/DOCX
  - Test pixel to screen conversion for images at various zoom levels and pan offsets
  - Test screen to pixel conversion for images
  - Test boundary conditions (0%, 100%, negative values, out of bounds)
  - _Requirements: 2.2, 2.4, 5.2, 5.4_

- [ ]* 16. Write unit tests for annotation marker styling
  - Test default marker appearance (black background, white number)
  - Test automatic color inversion when background is white
  - Test luminance calculation for automatic contrast
  - Test marker size (22-26px range)
  - Test hover state styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 17. Write integration tests for annotation CRUD operations
  - Test creating annotation via double-click on PDF document
  - Test creating annotation via double-click on DOCX document
  - Test creating annotation via double-click on image
  - Test editing annotation content through EditAnnotationModal
  - Test changing annotation color through color picker
  - Test deleting annotation with confirmation
  - Test annotation persistence after page reload
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [ ]* 18. Write integration tests for multi-page PDF annotations
  - Test creating annotations on different pages
  - Test that only current page annotations are displayed
  - Test navigation between pages with annotations
  - Test sidebar grouping by page number
  - Test clicking sidebar note navigates to correct page
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 19. Write integration tests for image zoom and pan with annotations
  - Test that annotations remain anchored during zoom in
  - Test that annotations remain anchored during zoom out
  - Test that annotations remain anchored during pan operations
  - Test annotation positioning at various zoom levels (0.5x, 1x, 2x, 4x)
  - Test creating annotations at different zoom levels
  - _Requirements: 5.3, 5.4, 5.5, 5.6_
