# Technical Implementation

## 1. Technology Stack

### Frontend
| Category | Technology | Purpose |
|----------|------------|---------|
| **Core** | React 19, TypeScript | UI Component Library & Type Safety |
| **Build** | Vite | Fast development server and bundler |
| **Styling** | TailwindCSS | Utility-first CSS framework |
| **PDF Rendering** | pdfjs-dist | Parsing and rendering PDF files |
| **DOCX Rendering** | docx-preview | Rendering Word documents in the browser |
| **Interactions** | react-zoom-pan-pinch | Zoom and pan functionality for viewers |
| **Icons** | Lucide React | Modern, consistent icon set |
| **Storage** | Dexie.js | Wrapper for IndexedDB for local data persistence |

### Backend
| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | FastAPI | High-performance web framework for APIs |
| **Server** | Uvicorn | ASGI server implementation |
| **Database** | SQLite | Serverless SQL database engine |
| **ORM** | SQLAlchemy (Implied) | Database abstraction |

## 2. Project Structure

### Backend (`/backend`)
- **`main.py`**: Entry point of the application. Configures FastAPI, CORS, and routes.
- **`app/api/`**: Contains API route definitions.
- **`app/core/`**: Configuration settings (e.g., environment variables).
- **`app/database/`**: Database connection and initialization logic.
- **`uploads/`**: Directory where uploaded files are stored.

### Frontend (`/frontend`)
- **`src/components/`**: Reusable UI components.
    - `PDFViewer.tsx`: Handles PDF rendering and annotations.
    - `DocxViewer.tsx`: Handles DOCX rendering.
    - `ImageViewer.tsx`: Handles Image rendering.
    - `Header.tsx`: Application navigation and global controls.
- **`src/hooks/`**: Custom React hooks for logic reuse.
- **`src/services/`**: API client modules for communicating with the backend.
- **`src/utils/`**: Helper functions and constants.

## 3. Key Implementation Details

### Document Rendering
- **PDF**: Uses `pdfjs-dist` to render PDF pages onto HTML `<canvas>` elements. This allows for high-performance rendering and pixel-perfect accuracy.
- **DOCX**: Utilizes `docx-preview` to convert DOCX content into HTML/CSS for display within a container.
- **Images**: Standard HTML `<img>` tags are used, wrapped in `react-zoom-pan-pinch` for interactive capabilities.

### Annotation System
- **Coordinate System**: Annotations are stored with normalized coordinates (0-1 range) relative to the document container. This ensures they remain correctly positioned regardless of zoom level or screen size.
- **Persistence**: Annotations are saved to the backend database via API calls and cached locally in IndexedDB for performance.

### Zoom & Pan
- Implemented using `react-zoom-pan-pinch`, providing a unified experience across all document types (PDF, DOCX, Image).
- Custom controls in the toolbar trigger these transformations programmatically.
