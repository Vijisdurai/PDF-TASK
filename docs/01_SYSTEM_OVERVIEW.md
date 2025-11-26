# System Overview

## 1. Introduction
The **Document Annotation System** is a web-based application designed to allow users to upload, view, and annotate various document formats, including PDF, DOCX, and images. The system provides a seamless user experience with features like zoom, pan, and persistent annotations.

## 2. Architecture
The system follows a modern **Client-Server Architecture**:

### Frontend (Client)
- **Framework**: React (with TypeScript)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Context & Hooks
- **Storage**: IndexedDB (via Dexie.js) for offline-capable local storage of annotations.

### Backend (Server)
- **Framework**: FastAPI (Python)
- **Database**: SQLite (for metadata and annotation persistence)
- **File Handling**: Local file system storage for uploaded documents.
- **API**: RESTful API for communication between client and server.

## 3. Key Features
- **Multi-Format Support**: View and annotate PDFs, Word documents (DOCX), and Images (JPG, PNG).
- **Annotation System**:
    - Click-to-annotate interface.
    - Persistent storage of annotations.
    - Support for text notes.
- **Interactive Viewer**:
    - Zoom and Pan capabilities.
    - "Fit to Screen" and "Fit to Width" modes.
    - Smooth navigation.
- **Responsive Design**: Optimized for various screen sizes.

## 4. Design Rationale
- **FastAPI**: Chosen for its high performance and automatic documentation generation (Swagger UI).
- **React + Vite**: Ensures a fast, reactive user interface with a great developer experience.
- **SQLite**: Lightweight and serverless, perfect for a standalone application without complex setup requirements.
- **Local Storage (IndexedDB)**: enhances performance by caching annotations locally, reducing server load and enabling potential offline features.
