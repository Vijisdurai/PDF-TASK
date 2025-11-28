# User Manual & Feature Specifications

## 1. Getting Started
Upon launching the application, you will be greeted with the main dashboard. From here, you can upload new documents or select existing ones to view.

## 2. Features

### 2.1 Document Upload
- **Supported Formats**: PDF (`.pdf`), Word (`.docx`), Images (`.jpg`, `.png`).
- **How to Upload**: Click the "Upload" button in the header or drag and drop files into the upload area.
- **Processing**: Files are automatically processed and prepared for viewing immediately after upload.

### 2.2 Document Viewing
The viewer provides a rich interface for reading documents:
- **Zoom Controls**: Use the `+` and `-` buttons to zoom in and out.
- **Fit Modes**:
    - **Fit to Width**: Adjusts the document to fill the width of the screen.
    - **Fit to Page**: Adjusts the zoom so the entire page is visible.
- **Navigation**: Scroll vertically to move through pages. For multi-page documents (PDF/DOCX), pages are rendered continuously.

### 2.3 Annotation System
Add notes and highlights to your documents:
- **Adding an Annotation**: Double-click anywhere on the document surface to place a marker.
- **Editing**:
    - **Inline Edit**: Click the "Edit" (pencil) icon on a selected note to edit content directly in the panel.
    - **Color Selection**: Choose a color for your annotation marker from the color picker during creation or editing.
- **Deleting**: Select an annotation and click the "Delete" (trash can) icon.
- **Visibility**: Annotations remain fixed to their position on the document, scaling correctly when you zoom or pan.
- **Persistence**: Annotation colors and content are saved automatically and persist even after reloading the page.

### 2.4 Image Viewer Specifics
- **Windows-Style Toolbar**: The image viewer features a floating glassmorphic toolbar similar to the Windows Photos app.
- **Controls**: Includes specific controls for image manipulation like rotation (if implemented) and specialized zoom presets.

## 3. User Interface Guide

### Header / Navigation Bar
- Located at the top of the screen.
- Contains global actions: Home, Upload, and Theme Toggle (if available).

### Annotation Panel
- Appears when an annotation is selected.
- Allows for text input and saving of notes.

### Viewer Toolbar
- Floating toolbar within the document view.
- Contains Zoom In/Out, Reset Zoom, and Fit toggles.
