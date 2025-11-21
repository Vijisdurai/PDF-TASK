# Requirements Document

## Introduction

This document outlines the requirements for an Advanced Document Viewer system that provides Chrome-style PDF viewing and Pinterest-style image viewing with deep zoom capabilities. The system will support advanced navigation, zoom controls, pan gestures, and an integrated notes panel.

## Glossary

- **PDF Viewer**: A component that renders PDF documents with Chrome-like controls and navigation
- **Image Viewer**: A component that displays images with Pinterest-style deep zoom and pan capabilities
- **Viewer Toolbar**: A unified control bar shared between PDF and Image viewers
- **Notes Panel**: A collapsible sidebar for viewing and managing document annotations
- **Fit Mode**: Display mode determining how content scales (fitWidth, fitPage, fitScreen, custom)
- **Document Grid**: The main library view displaying all uploaded documents
- **Backend API**: FastAPI service providing document storage and retrieval endpoints

## Requirements

### Requirement 1: PDF Viewer with Chrome-style Controls

**User Story:** As a user, I want to view PDF documents with professional controls similar to Chrome's PDF viewer, so that I can navigate and zoom documents efficiently.

#### Acceptance Criteria

1. WHEN the PDF Viewer loads a PDF document, THE PDF Viewer SHALL render pages using pdfjs-dist onto canvas elements at resolution equal to devicePixelRatio multiplied by zoom level
2. THE PDF Viewer SHALL maintain state for scale, pageNumber, fitMode, isNotesOpen, rotation, and documentMetadata
3. WHEN a user clicks Zoom In button, THE PDF Viewer SHALL increase the scale by predefined increment
4. WHEN a user clicks Zoom Out button, THE PDF Viewer SHALL decrease the scale by predefined increment
5. WHEN a user clicks the zoom percentage display, THE PDF Viewer SHALL transform the display into an editable input field
6. WHEN a user enters a zoom value and submits, THE PDF Viewer SHALL validate the numeric value, constrain the value to range between 10 percent and 500 percent, and apply the scale with smooth transition
7. WHEN a user selects Fit to Screen mode, THE PDF Viewer SHALL update fitMode and calculate scale as viewportHeight divided by pdfHeight
8. WHEN a user selects Fit to Width mode, THE PDF Viewer SHALL update fitMode and calculate scale as viewportWidth divided by pdfWidth
9. WHEN a user selects Fit to Page mode, THE PDF Viewer SHALL update fitMode and calculate scale to fit entire page within viewport
10. WHEN a user performs touch pinch gesture, THE PDF Viewer SHALL adjust zoom level and pan position simultaneously
11. WHEN a user clicks Next button, THE PDF Viewer SHALL navigate to the next page
12. WHEN a user clicks Previous button, THE PDF Viewer SHALL navigate to the previous page
13. WHEN a user clicks the page number display, THE PDF Viewer SHALL transform the display into an editable input field for direct page navigation
14. WHEN a user presses right arrow key or down arrow key, THE PDF Viewer SHALL navigate to the next page
15. WHEN a user presses left arrow key or up arrow key, THE PDF Viewer SHALL navigate to the previous page
16. WHEN a user presses Ctrl plus key combination, THE PDF Viewer SHALL increase zoom level
17. WHEN a user presses Ctrl minus key combination, THE PDF Viewer SHALL decrease zoom level
18. WHEN a user presses Ctrl 0 key combination, THE PDF Viewer SHALL reset to the current fit mode

### Requirement 2: Image Viewer with Pinterest-style Deep Zoom

**User Story:** As a user, I want to view images with smooth deep zoom and pan capabilities like Pinterest, so that I can examine image details closely.

#### Acceptance Criteria

1. THE Image Viewer SHALL wrap images in a transformable div element with transform translate3d and scale properties
2. THE Image Viewer SHALL maintain state for scale, translateX, translateY, minScale, maxScale, and zoomMode
3. WHILE the Image Viewer is in inactive zoom state, THE Image Viewer SHALL ignore mouse-wheel events
4. WHEN a user performs pinch gesture on mobile device, THE Image Viewer SHALL track two-finger distance change and zoom toward midpoint of fingers
5. WHEN zoom level changes, THE Image Viewer SHALL apply cursor-centered zoom formula computing image coordinates before zoom and adjusting translate values after zoom
6. WHEN a user clicks and drags on desktop device, THE Image Viewer SHALL pan the image
7. WHEN a user performs two-finger drag on mobile device, THE Image Viewer SHALL pan the image
8. WHEN a user releases pointer after dragging, THE Image Viewer SHALL continue motion with velocity decay for inertia effect
9. THE Image Viewer SHALL constrain pan boundaries to maintain at least 100 pixels of image content within viewport edges







### Requirement 3: Keyboard and Gesture Support

**User Story:** As a user, I want comprehensive keyboard shortcuts and touch gestures, so that I can interact efficiently on any device.

#### Acceptance Criteria

1. WHEN a user presses arrow keys while viewing PDF document, THE Viewer System SHALL navigate between pages
2. WHEN a user presses Ctrl plus key combination, THE Viewer System SHALL increase zoom level
3. WHEN a user presses Ctrl minus key combination, THE Viewer System SHALL decrease zoom level
4. WHEN a user presses Ctrl 0 key combination, THE Viewer System SHALL reset to the current fit mode
5. WHEN a user clicks and drags with mouse, THE Viewer System SHALL pan the content
6. WHEN a user performs touch pinch gesture on mobile device, THE Viewer System SHALL adjust zoom level
7. WHEN a user performs two-finger drag on mobile device, THE Viewer System SHALL pan the content