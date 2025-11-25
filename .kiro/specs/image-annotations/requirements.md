# Requirements Document

## Introduction

This document specifies the requirements for pixel-locked image annotation functionality in the document viewer application. The feature enables users to create, view, edit, and delete annotations directly on image documents, with annotations maintaining their exact pixel positions during zoom and pan operations. This feature replicates the existing PDF annotation system for image documents.

## Glossary

- **ImageViewer**: The React component responsible for displaying image documents with zoom and pan capabilities
- **Annotation**: A user-created note or marker placed at a specific location on an image
- **Pixel Coordinates**: Absolute position values (xPixel, yPixel) representing the annotation's location on the original image
- **Coordinate Transform**: Mathematical conversion between screen coordinates and storage coordinates accounting for zoom scale and pan offset
- **AnnotationOverlay**: The React component that renders annotation markers and handles annotation creation
- **Storage Coordinates**: The persisted coordinate values (pixel-based for images, percentage-based for PDFs)
- **Screen Coordinates**: The visual position of annotations in the viewport after applying zoom and pan transformations

## Requirements

### Requirement 1

**User Story:** As a user, I want to create annotations on images by double-clicking, so that I can mark specific areas of interest with notes.

#### Acceptance Criteria

1. WHEN a user double-clicks on an image THEN the ImageViewer SHALL display an annotation input dialog at the clicked location
2. WHEN the annotation input dialog is displayed THEN the ImageViewer SHALL capture the pixel coordinates of the click location
3. WHEN a user enters text and saves the annotation THEN the ImageViewer SHALL store the annotation with pixel coordinates relative to the original image dimensions
4. WHEN a user cancels the annotation input THEN the ImageViewer SHALL close the dialog without creating an annotation
5. WHERE the user provides optional color selection THEN the ImageViewer SHALL store the color value with the annotation

### Requirement 2

**User Story:** As a user, I want annotations to remain fixed at their pixel positions during zoom operations, so that annotations always point to the same image location regardless of zoom level.

#### Acceptance Criteria

1. WHEN a user changes the zoom scale THEN the ImageViewer SHALL recalculate annotation screen positions using the new scale factor
2. WHEN rendering annotations THEN the ImageViewer SHALL apply the coordinate transform formula: screenX = xPixel * scale + panOffset.x
3. WHEN rendering annotations THEN the ImageViewer SHALL apply the coordinate transform formula: screenY = yPixel * scale + panOffset.y
4. WHEN zoom scale changes from any value to any other value THEN the ImageViewer SHALL maintain the annotation's position relative to the underlying image pixels
5. WHEN zoom scale is 1.0 THEN the ImageViewer SHALL display annotations at their exact stored pixel coordinates

### Requirement 3

**User Story:** As a user, I want annotations to remain fixed at their pixel positions during pan operations, so that annotations move with the image as I navigate.

#### Acceptance Criteria

1. WHEN a user pans the image THEN the ImageViewer SHALL update annotation screen positions using the current pan offset
2. WHEN the pan offset changes THEN the ImageViewer SHALL recalculate all annotation positions in real-time
3. WHEN rendering annotations THEN the ImageViewer SHALL include the pan offset in the coordinate transformation
4. WHEN the image is centered THEN the ImageViewer SHALL display annotations at positions calculated from zero pan offset

### Requirement 4

**User Story:** As a user, I want to view all annotations on an image with numbered markers, so that I can easily identify and reference different annotations.

#### Acceptance Criteria

1. WHEN annotations exist on an image THEN the ImageViewer SHALL display a numbered marker for each annotation
2. WHEN multiple annotations exist THEN the ImageViewer SHALL number markers sequentially based on creation timestamp
3. WHEN rendering annotation markers THEN the ImageViewer SHALL position each marker at the transformed screen coordinates
4. WHERE an annotation has a color property THEN the ImageViewer SHALL render the marker using that color
5. WHERE an annotation has no color property THEN the ImageViewer SHALL render the marker using a default color (black)

### Requirement 5

**User Story:** As a user, I want to click on annotation markers to view or edit their content, so that I can review and modify my notes.

#### Acceptance Criteria

1. WHEN a user clicks an annotation marker THEN the ImageViewer SHALL trigger the annotation click handler with the annotation ID
2. WHEN an annotation click event occurs THEN the ImageViewer SHALL pass the complete annotation object to the parent component
3. WHEN the parent component receives an annotation click THEN the system SHALL display the annotation content for viewing or editing
4. WHEN a user updates annotation content THEN the system SHALL persist the changes with an updated timestamp

### Requirement 6

**User Story:** As a user, I want to delete annotations I no longer need, so that I can keep my image workspace clean and organized.

#### Acceptance Criteria

1. WHEN a user requests to delete an annotation THEN the system SHALL remove the annotation from storage
2. WHEN an annotation is deleted THEN the ImageViewer SHALL remove the corresponding marker from the display
3. WHEN an annotation is deleted THEN the ImageViewer SHALL renumber remaining markers based on their creation order
4. WHEN the deletion completes THEN the system SHALL update the annotation list immediately

### Requirement 7

**User Story:** As a user, I want annotations to persist across sessions, so that my notes are available when I reopen the image.

#### Acceptance Criteria

1. WHEN a user creates an annotation THEN the system SHALL store the annotation with documentId, xPixel, yPixel, content, color, and timestamps
2. WHEN a user reopens an image document THEN the system SHALL load all annotations associated with that document ID
3. WHEN annotations are loaded THEN the ImageViewer SHALL render all markers at their stored pixel positions
4. WHEN the system stores annotations THEN the system SHALL use the ImageAnnotation type with pixel-based coordinates

### Requirement 8

**User Story:** As a developer, I want the image annotation system to use the same coordinate transformation logic as the PDF annotation system, so that both systems behave consistently.

#### Acceptance Criteria

1. WHEN converting screen coordinates to storage coordinates THEN the AnnotationOverlay SHALL use the formula: xPixel = (screenX - panOffset.x) / scale
2. WHEN converting screen coordinates to storage coordinates THEN the AnnotationOverlay SHALL use the formula: yPixel = (screenY - panOffset.y) / scale
3. WHEN converting storage coordinates to screen coordinates THEN the AnnotationOverlay SHALL use the formula: screenX = xPixel * scale + panOffset.x
4. WHEN converting storage coordinates to screen coordinates THEN the AnnotationOverlay SHALL use the formula: screenY = yPixel * scale + panOffset.y
5. WHEN the AnnotationOverlay receives documentType "image" THEN the AnnotationOverlay SHALL use pixel-based coordinate transformations
6. WHEN the AnnotationOverlay receives documentType "pdf" or "docx" THEN the AnnotationOverlay SHALL use percentage-based coordinate transformations

### Requirement 9

**User Story:** As a user, I want the annotation creation interface to prevent accidental annotations during pan operations, so that I only create annotations when intentionally double-clicking.

#### Acceptance Criteria

1. WHEN a user is dragging to pan the image THEN the ImageViewer SHALL not trigger annotation creation on double-click
2. WHEN a user double-clicks on an existing annotation marker THEN the ImageViewer SHALL trigger the annotation click handler instead of creating a new annotation
3. WHEN the annotation input dialog is open THEN the ImageViewer SHALL prevent pan operations from interfering with text input
4. WHEN a user clicks outside the annotation input dialog THEN the ImageViewer SHALL cancel the annotation creation

### Requirement 10

**User Story:** As a user, I want annotations to work correctly in fullscreen mode, so that I can annotate images while viewing them at maximum size.

#### Acceptance Criteria

1. WHEN the ImageViewer enters fullscreen mode THEN the system SHALL continue to render annotations at correct positions
2. WHEN the ImageViewer exits fullscreen mode THEN the system SHALL maintain annotation positions correctly
3. WHEN in fullscreen mode THEN the ImageViewer SHALL support all annotation operations including create, view, edit, and delete
4. WHEN the container dimensions change due to fullscreen toggle THEN the ImageViewer SHALL recalculate annotation positions based on the coordinate transform

### Requirement 11

**User Story:** As a user, I want clicking an annotation marker in fullscreen mode to open the notes panel and display that annotation, so that I can view and edit annotation details without exiting fullscreen.

#### Acceptance Criteria

1. WHEN a user clicks an annotation marker in fullscreen mode THEN the system SHALL open the notes panel
2. WHEN the notes panel opens from an annotation click THEN the system SHALL display the clicked annotation's content
3. WHEN the notes panel opens from an annotation click THEN the system SHALL focus on the selected annotation for editing
4. WHEN the notes panel is already open and a user clicks an annotation marker THEN the system SHALL navigate to that annotation in the panel
5. WHEN a user clicks an annotation marker in normal mode THEN the system SHALL open the notes panel with the same behavior as fullscreen mode
