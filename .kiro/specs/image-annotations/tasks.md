# Implementation Plan

- [x] 1. Verify and fix ImageViewer annotation integration









- [x] 1.1 Verify AnnotationOverlay is correctly integrated in ImageViewer


  - Confirm scale and panOffset props are passed correctly
  - Verify documentWidth and documentHeight use imgNatural dimensions
  - Ensure containerWidth and containerHeight are passed
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 1.2 Verify coordinate transformation in AnnotationOverlay



  - Confirm screenToStorage uses formula: `(screenX - panOffset.x) / scale`
  - Confirm storageToScreen uses formula: `xPixel * scale + panOffset.x`
  - Test with various zoom and pan values
  - _Requirements: 2.2, 2.3, 8.1, 8.2_

- [ ]* 1.3 Write property test for coordinate transformation round-trip
  - **Property 1: Coordinate transformation round-trip**
  - **Validates: Requirements 2.2, 2.3, 8.1, 8.2**

- [ ]* 1.4 Write property test for zoom invariance
  - **Property 2: Annotation position invariance under zoom**
  - **Validates: Requirements 2.1, 2.4**

- [ ]* 1.5 Write property test for pan invariance
  - **Property 3: Annotation position invariance under pan**
  - **Validates: Requirements 3.1, 3.2**



- [x] 2. Implement notes panel integration for annotation clicks



- [x] 2.1 Update ImageViewer to pass onAnnotationClick prop

  - Modify ImageViewer component to accept onAnnotationClick prop

  - Pass prop through to AnnotationOverlay
  - Ensure click handler receives full annotation object
  - _Requirements: 5.1, 5.2, 11.1, 11.5_

- [x] 2.2 Update DocumentViewer to pass annotation click handler to ImageViewer

  - Add onAnnotationClick prop to ImageViewer instantiation
  - Pass handleAnnotationClick from DocumentViewerPage
  - Test that clicks propagate correctly
  - _Requirements: 5.1, 5.2_

- [x] 2.3 Implement notes panel opening logic in DocumentViewerPage


  - Modify handleAnnotationClick to check if notes panel is open
  - Dispatch TOGGLE_NOTE_PANEL action if panel is closed
  - Set selected annotation for display
  - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [ ]* 2.4 Write unit tests for annotation click flow
  - Test that clicking marker opens notes panel if closed
  - Test that clicking marker selects correct annotation
  - Test that clicking marker when panel is open navigates to annotation
  - _Requirements: 11.1, 11.2, 11.4_

- [ ]* 2.5 Write property test for annotation click handler
  - **Property 7: Annotation click triggers correct handler**
  - **Validates: Requirements 5.1, 5.2**


- [-] 3. Verify annotation creation and storage



- [x] 3.1 Verify annotation creation handler in ImageViewer












  - Confirm handleAnnotationCreate converts screen to pixel coordinates
  - Verify annotation includes documentId, xPixel, yPixel, content, color
  - Test with various click locations
  - _Requirements: 1.1, 1.2, 1.3, 1.5_
-

- [x] 3.2 Verify annotation persistence through API






  - Test that created annotations are saved to backend
  - Verify annotations load correctly on document reopen
  - Confirm all required fields are stored
  - _Requirements: 7.1, 7.2, 7.4_

- [ ]* 3.3 Write property test for annotation storage fields
  - **Property 11: Annotation storage includes all required fields**
  - **Validates: Requirements 7.1, 7.4**

- [ ]* 3.4 Write property test for content preservation
  - **Property 12: Annotation content preservation**
  - **Validates: Requirements 1.3**

- [x] 4. Verify annotation rendering and display




- [x] 4.1 Verify marker rendering for all annotations


  - Confirm all annotations for current document are displayed
  - Verify marker count matches annotation count
  - Test with 0, 1, and multiple annotations
  - _Requirements: 4.1_

- [x] 4.2 Verify marker numbering and ordering


  - Confirm markers are numbered sequentially
  - Verify numbering follows creation timestamp order
  - Test with annotations created in different orders
  - _Requirements: 4.2_

- [x] 4.3 Verify marker color display


  - Confirm markers display annotation color when provided
  - Verify default color is used when color is not provided
  - Test with various color values
  - _Requirements: 4.4, 4.5_

- [ ]* 4.4 Write property test for marker count
  - **Property 4: Marker count equals annotation count**
  - **Validates: Requirements 4.1**

- [ ]* 4.5 Write property test for marker numbering
  - **Property 5: Marker numbering follows chronological order**
  - **Validates: Requirements 4.2**

- [ ]* 4.6 Write property test for marker color
  - **Property 6: Marker color preservation**
  - **Validates: Requirements 4.4**


- [ ] 5. Verify annotation editing and deletion
- [ ] 5.1 Verify annotation update functionality
  - Test updating annotation content through notes panel
  - Verify updates persist to backend
  - Confirm timestamp is updated on edit
  - _Requirements: 5.4_

- [ ] 5.2 Verify annotation deletion functionality
  - Test deleting annotation through notes panel
  - Verify marker is removed from display
  - Confirm remaining markers are renumbered correctly
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 5.3 Write property test for annotation updates
  - **Property 8: Annotation updates preserve required fields**
  - **Validates: Requirements 5.4**

- [ ]* 5.4 Write property test for annotation deletion
  - **Property 9: Annotation deletion removes marker**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 5.5 Write property test for deletion renumbering
  - **Property 10: Deletion preserves chronological numbering**
  - **Validates: Requirements 6.3**

- [ ] 6. Verify UI interaction edge cases
- [ ] 6.1 Verify annotation creation is prevented during drag
  - Test that double-clicking while dragging does not create annotation
  - Verify isDragging flag prevents annotation input dialog
  - _Requirements: 9.1_

- [ ] 6.2 Verify double-click on marker triggers click handler
  - Test that double-clicking marker opens notes panel
  - Verify new annotation is not created
  - Confirm event propagation is stopped
  - _Requirements: 9.2_

- [ ] 6.3 Verify annotation input dialog behavior
  - Test that clicking outside dialog cancels annotation
  - Verify dialog does not interfere with pan operations
  - Test save and cancel buttons
  - _Requirements: 1.4, 9.3, 9.4_

- [ ]* 6.4 Write unit tests for UI interaction edge cases
  - Test drag prevention
  - Test marker click priority
  - Test dialog cancel behavior
  - _Requirements: 9.1, 9.2, 9.3, 9.4_


- [ ] 7. Verify fullscreen mode support
- [ ] 7.1 Test annotations in fullscreen mode
  - Enter fullscreen and verify annotations display correctly
  - Test annotation creation in fullscreen
  - Test annotation clicks open notes panel in fullscreen
  - Exit fullscreen and verify annotations still work
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1_

- [ ]* 7.2 Write unit tests for fullscreen annotation operations
  - Test annotation creation in fullscreen
  - Test annotation clicks in fullscreen
  - Test notes panel opening in fullscreen
  - _Requirements: 10.3, 11.1_

- [ ] 8. Add error handling and edge case handling
- [ ] 8.1 Implement coordinate validation and clamping
  - Add scale clamping to range [0.01, 10.0]
  - Add coordinate clamping to image bounds
  - Handle division by zero in transformations
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8.2 Implement API error handling
  - Add error handling for annotation creation failures
  - Add error handling for annotation loading failures
  - Display user-friendly error messages
  - Provide retry mechanisms
  - _Requirements: 1.3, 7.2_

- [ ] 8.3 Implement malformed data handling
  - Skip invalid annotations during loading
  - Log errors for debugging
  - Display valid annotations even if some are invalid
  - _Requirements: 7.2_

- [ ]* 8.4 Write unit tests for error handling
  - Test coordinate clamping
  - Test API error scenarios
  - Test malformed data handling
  - _Requirements: 2.1, 2.2, 2.3, 7.2_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
