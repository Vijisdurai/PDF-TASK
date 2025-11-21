# Implementation Plan

- [x] 1. Set up viewer routing and document type detection






  - Create DocumentViewer route component that accepts documentId parameter
  - Implement document type detection logic (PDF vs Image) based on file metadata
  - Set up conditional rendering to display PdfViewer or ImageViewer based on document type
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement PDF viewer core rendering





  - [x] 2.1 Initialize PDF.js and load PDF documents


    - Install and configure pdfjs-dist library
    - Create PDF loading function that fetches document from backend API
    - Implement error handling for PDF loading failures
    - _Requirements: 1.1_
  

  - [x] 2.2 Implement canvas-based page rendering

    - Create canvas element for PDF page rendering
    - Implement high DPI rendering using devicePixelRatio multiplied by zoom level
    - Set canvas dimensions and styles to match viewport requirements
    - Render PDF pages to canvas using pdfjs-dist render method
    - _Requirements: 1.1_
  
  - [x] 2.3 Create PDF viewer state management

    - Implement state for scale, pageNumber, totalPages, fitMode, rotation, translateX, translateY, isPanning
    - Create state initialization logic when PDF loads
    - _Requirements: 1.2_

- [ ] 3. Implement PDF zoom controls
  - [ ] 3.1 Create zoom in/out button handlers
    - Implement zoom in handler that increases scale by predefined increment
    - Implement zoom out handler that decreases scale by predefined increment
    - Apply scale changes with smooth transitions
    - _Requirements: 1.3, 1.4_
  
  - [ ] 3.2 Implement editable zoom percentage display
    - Create zoom percentage display that shows current scale as percentage
    - Implement click handler to transform display into editable input field
    - Create submit handler that validates numeric input, constrains to 10-500% range, and applies zoom
    - _Requirements: 1.5, 1.6_
  
  - [ ] 3.3 Implement fit mode controls
    - Create Fit to Screen handler that calculates scale as viewportHeight divided by pdfHeight
    - Create Fit to Width handler that calculates scale as viewportWidth divided by pdfWidth
    - Create Fit to Page handler that calculates scale to fit entire page within viewport
    - Update fitMode state when fit mode changes
    - _Requirements: 1.7, 1.8, 1.9_

- [ ] 4. Implement PDF page navigation
  - [ ] 4.1 Create page navigation button handlers
    - Implement Next button handler that navigates to next page
    - Implement Previous button handler that navigates to previous page
    - Add boundary checks to prevent navigation beyond first/last page
    - _Requirements: 1.11, 1.12_
  
  - [ ] 4.2 Implement editable page number display
    - Create page number display showing current page and total pages
    - Implement click handler to transform display into editable input field
    - Create submit handler that validates page number and navigates to specified page
    - _Requirements: 1.13_

- [ ] 5. Implement PDF keyboard shortcuts
  - [ ] 5.1 Create keyboard event handlers for PDF viewer
    - Implement arrow key handlers for page navigation (right/down for next, left/up for previous)
    - Implement Ctrl+Plus handler to increase zoom level
    - Implement Ctrl+Minus handler to decrease zoom level
    - Implement Ctrl+0 handler to reset to current fit mode
    - Add event listener cleanup on component unmount
    - _Requirements: 1.14, 1.15, 1.16, 1.17, 1.18, 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Implement PDF touch gesture support
  - [ ] 6.1 Create pinch zoom handler for PDF viewer
    - Implement pointer event handlers to track two-finger touch
    - Calculate distance between fingers and detect pinch gestures
    - Adjust zoom level and pan position simultaneously during pinch
    - _Requirements: 1.10, 3.6_
  
  - [ ] 6.2 Create pan handler for PDF viewer
    - Implement mouse drag handler for desktop panning
    - Update translateX and translateY values based on drag delta
    - _Requirements: 3.5_

- [ ] 7. Implement image viewer core rendering
  - [ ] 7.1 Create transformable image container
    - Create div wrapper with transform translate3d and scale CSS properties
    - Set transformOrigin to '0 0' and willChange to 'transform'
    - Implement conditional transition (none during drag, ease-out otherwise)
    - _Requirements: 2.1_
  
  - [ ] 7.2 Create image viewer state management
    - Implement state for scale, translateX, translateY, minScale, maxScale, isDragging, velocity, lastTapTime
    - Initialize minScale and maxScale based on image dimensions
    - _Requirements: 2.2_

- [ ] 8. Implement image viewer zoom functionality
  - [ ] 8.1 Create cursor-centered zoom logic
    - Implement wheel zoom handler that only activates when zoom state is active
    - Calculate image-space coordinates before zoom
    - Apply new scale and adjust translate values to keep cursor position fixed
    - _Requirements: 2.3, 2.5_
  
  - [ ] 8.2 Create pinch zoom handler for images
    - Implement pointer event handlers to track two-finger distance
    - Calculate midpoint between fingers
    - Zoom toward midpoint while tracking finger distance changes
    - _Requirements: 2.4, 3.6_

- [ ] 9. Implement image viewer pan functionality
  - [ ] 9.1 Create drag pan handlers
    - Implement click and drag handler for desktop devices
    - Implement two-finger drag handler for mobile devices
    - Update translateX and translateY based on drag delta
    - _Requirements: 2.6, 2.7, 3.5, 3.7_
  
  - [ ] 9.2 Implement pan inertia effect
    - Track velocity during drag operations
    - Create inertia animation using requestAnimationFrame
    - Apply velocity decay (multiply by 0.95) for friction effect
    - Stop animation when velocity drops below threshold
    - _Requirements: 2.8_
  
  - [ ] 9.3 Implement pan boundary constraints
    - Create clampX and clampY functions
    - Calculate boundaries to maintain at least 100 pixels of image within viewport
    - Apply clamping to translateX and translateY values
    - _Requirements: 2.9_

- [ ] 10. Create shared ViewerToolbar component
  - [ ] 10.1 Build toolbar layout and structure
    - Create toolbar component with props for documentType, scale, currentPage, totalPages, fitMode, isNotesOpen
    - Implement layout with zoom controls, fit mode buttons, page navigation, and action buttons
    - Add conditional rendering for PDF-specific controls (page navigation)
    - _Requirements: 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.11, 1.12, 1.13_
  
  - [ ] 10.2 Wire toolbar event handlers
    - Connect onZoomIn, onZoomOut, onZoomChange callbacks to parent viewer components
    - Connect onFitModeChange callback for fit mode buttons
    - Connect onPageChange callback for page navigation (PDF only)
    - Connect onToggleNotes, onReset, onFullscreen callbacks for action buttons
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11, 1.12, 1.13_

- [ ] 11. Implement viewer context and state management
  - Create ViewerContext for managing zoom, pan, page, fit mode, notes visibility
  - Create DocumentContext for managing document metadata, type, loading state
  - Wrap DocumentViewer component with context providers
  - _Requirements: 1.2, 2.2_

- [ ] 12. Integrate viewers with backend API
  - [ ] 12.1 Create document fetching service
    - Implement API call to fetch document metadata by documentId
    - Implement file streaming for PDF and image files
    - Add error handling for 404 and 403 responses
    - _Requirements: 1.1, 2.1_
  
  - [ ] 12.2 Implement loading and error states
    - Create loading spinner component for document loading
    - Create error message component for failed loads
    - Implement retry mechanism with exponential backoff
    - _Requirements: 1.1, 2.1_

- [ ] 13. Add NotesPanel component integration
  - Create NotesPanel component with props for documentId, currentPage, isOpen, onClose
  - Implement collapsible sidebar layout
  - Add toggle button in ViewerToolbar to show/hide notes panel
  - _Requirements: 1.2_

- [ ]* 14. Write unit tests for viewer logic
  - Write tests for zoom calculation logic (cursor-centered zoom formula)
  - Write tests for pan boundary clamping functions
  - Write tests for fit mode scale calculations
  - Write tests for page navigation boundary checks
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11, 1.12, 1.13, 2.5, 2.9_

- [ ]* 15. Write integration tests for gesture handling
  - Write tests for keyboard shortcut handlers
  - Write tests for pinch zoom gesture detection
  - Write tests for drag pan gesture handling
  - Write tests for inertia animation
  - _Requirements: 1.14, 1.15, 1.16, 1.17, 1.18, 1.10, 2.4, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
