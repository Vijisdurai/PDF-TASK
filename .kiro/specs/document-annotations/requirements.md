# Requirements Document

## Introduction

This document specifies requirements for a unified annotation system that works consistently across PDF, DOCX, and image files. The system will enable users to create, edit, and persist notes with circular numbered markers that remain position-anchored across zoom levels, pan operations, and sessions. The annotation system provides a consistent user experience regardless of document type, with markers that adapt their appearance for readability and a sidebar that displays notes with human-readable timestamps.

## Glossary

- **Annotation System**: The software component responsible for managing user-created notes and comments on documents and images
- **Annotation Marker**: A circular visual indicator (22-26px) with a numbered label that marks the position of a note on a document or image
- **Document Viewer**: The application component that displays PDF and DOCX documents to users
- **Image Viewer**: The application component that displays image files to users
- **Page Coordinate**: A position reference system that identifies a specific location on a document page using percentage-based coordinates
- **Pixel Coordinate**: A position reference system that identifies a specific pixel location on an image
- **Zoom Level**: A numerical value representing the magnification factor applied to displayed content
- **Persistence Layer**: The storage mechanism that saves annotation data between user sessions
- **Note Panel**: The sidebar component that displays all annotations with creator information and timestamps

## Requirements

### Requirement 1: Unified Annotation Marker Appearance

**User Story:** As a document reviewer, I want annotation markers to be clearly visible and readable on any document background, so that I can easily identify and distinguish between multiple annotations.

#### Acceptance Criteria

1. THE Annotation System SHALL render each annotation marker as a circle with a diameter between 22 and 26 pixels
2. THE Annotation System SHALL display a sequential number inside each marker in white text
3. THE Annotation System SHALL use black as the default background color for annotation markers
4. WHEN a marker background color is set to white, THE Annotation System SHALL automatically switch the inner number color to black
5. THE Annotation System SHALL ensure markers remain readable regardless of the document background color

### Requirement 2: PDF and DOCX Document Annotations

**User Story:** As a document reviewer, I want to add notes to specific locations on PDF and DOCX document pages, so that I can record my thoughts and feedback directly on the document.

#### Acceptance Criteria

1. WHEN a user double-clicks a location on a document page, THE Annotation System SHALL provide an interface to create a new note
2. THE Annotation System SHALL store each note with its associated page number and percentage-based page coordinates
3. WHEN a user views a document page with existing notes, THE Document Viewer SHALL display all annotation markers at their correct page coordinates
4. WHILE a document is displayed at any zoom level, THE Document Viewer SHALL maintain annotation markers at the correct visual position relative to document content
5. THE Annotation System SHALL apply identical annotation logic to both PDF and DOCX file types

### Requirement 3: Multi-Page PDF Annotation Management

**User Story:** As a document reviewer working with multi-page PDFs, I want annotations to be page-specific and grouped by page in the sidebar, so that I can navigate and manage notes across different pages efficiently.

#### Acceptance Criteria

1. THE Annotation System SHALL associate each PDF annotation with a specific page number
2. WHEN a user navigates to a different page, THE Document Viewer SHALL display only annotations for the current page
3. THE Note Panel SHALL group annotations by page number when displaying multi-page document notes
4. THE Annotation System SHALL maintain page-specific annotation positioning when users navigate between pages

### Requirement 4: Annotation CRUD Operations

**User Story:** As a document reviewer, I want to create, edit, and delete annotations on any document type, so that I can manage my review notes effectively.

#### Acceptance Criteria

1. WHEN a user creates a new annotation, THE Annotation System SHALL immediately display the marker on the document and the note in the sidebar
2. WHEN a user clicks an annotation marker, THE Annotation System SHALL provide an edit dialog with a text field for content modification
3. WHEN a user edits an annotation, THE Annotation System SHALL provide a color picker to change the marker color
4. WHEN a user deletes an annotation, THE Annotation System SHALL remove both the marker from the document and the note from the sidebar
5. THE Annotation System SHALL update state consistently so that changes propagate immediately to all UI components without disappearing markers

### Requirement 5: Image Annotations with Zoom and Pan

**User Story:** As an image reviewer, I want to add notes directly on images at specific pixel locations that remain anchored during zoom and pan operations, so that I can mark and comment on specific visual elements.

#### Acceptance Criteria

1. WHEN a user double-clicks a location on an image, THE Annotation System SHALL provide an interface to create a new note
2. THE Annotation System SHALL store each image note with pixel coordinates relative to the natural image size
3. WHEN a user views an image with existing notes, THE Image Viewer SHALL display all annotation markers at their correct pixel coordinates
4. WHILE the image is zoomed or panned, THE Image Viewer SHALL maintain annotation markers at the same pixel positions relative to image content using scale transforms
5. THE Image Viewer SHALL provide zoom-in, zoom-out, and reset button controls
6. WHEN a user scrolls the mouse wheel over an image, THE Image Viewer SHALL adjust the zoom level accordingly

### Requirement 6: Note Panel Display Requirements

**User Story:** As a document reviewer, I want to see my annotations listed in a sidebar with clear metadata, so that I can quickly review and navigate my notes without seeing technical coordinate information.

#### Acceptance Criteria

1. THE Note Panel SHALL display the creator name for each annotation
2. THE Note Panel SHALL display a human-readable timestamp for each annotation in the format "MMM DD, YYYY – HH:MM AM/PM"
3. THE Note Panel SHALL NOT display coordinate values or percentage positions to users
4. THE Note Panel SHALL display the annotation content text
5. WHEN a user clicks on a note in the sidebar, THE Annotation System SHALL highlight or focus the corresponding marker on the document

### Requirement 7: Annotation Persistence Across Sessions

**User Story:** As a document reviewer, I want my annotations to persist between sessions with all their properties intact, so that I can continue my review work later.

#### Acceptance Criteria

1. WHEN a user creates or modifies an annotation, THE Persistence Layer SHALL save the note data including coordinates, color, content, and timestamps
2. WHEN a user reopens a document or image, THE Annotation System SHALL retrieve all notes associated with that file
3. THE Annotation System SHALL render each retrieved annotation at its stored coordinates with the correct marker color and content
4. THE Annotation System SHALL preserve annotation positioning accuracy across sessions regardless of document type
