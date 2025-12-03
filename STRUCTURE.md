# AATRAL Project Structure - Complete Overview

## 📂 Complete Folder Tree

```
PDF TASK/
│
├── 📁 core/                          # Shared cross-application code
│   ├── schemas/                      # Shared DTOs and validation schemas
│   │   ├── common.py                 # Common Pydantic schemas
│   │   └── __init__.py
│   ├── interfaces/                   # TypeScript type definitions
│   │   ├── docx-preview.d.ts
│   │   └── __init__.py
│   ├── utils/                        # Shared utility functions
│   │   ├── annotationValidation.ts
│   │   ├── coordinateTransforms.ts
│   │   ├── coordinateUtils.ts
│   │   ├── index.ts
│   │   ├── migrateDocuments.ts
│   │   ├── panUtils.ts
│   │   ├── pdfValidator.ts
│   │   ├── zoomUtils.ts
│   │   ├── __tests__/
│   │   └── __init__.py
│   ├── constants/
│   └── __init__.py
│
├── 📁 modules/                       # Backend business logic
│   ├── annotation/                   # Annotation module
│   │   ├── model.py                  # SQLAlchemy models
│   │   ├── schema.py                 # Pydantic schemas
│   │   ├── service.py                # Business logic
│   │   ├── router.py                 # FastAPI routes
│   │   └── __init__.py
│   ├── documents/                    # Documents module
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── service.py
│   │   ├── router.py
│   │   ├── conversion_service.py
│   │   └── __init__.py
│   ├── main.py                       # FastAPI app entry point
│   ├── registry.py                   # Module registry
│   ├── requirements.txt              # Python dependencies
│   └── __init__.py
│
├── 📁 apps/                          # Frontend applications
│   └── web/                          # React + TypeScript app
│       ├── viewers/                  # Document viewers (feature-based)
│       │   ├── pdf/
│       │   │   ├── PDFViewer.tsx
│       │   │   ├── annotation/
│       │   │   │   ├── AnnotationOverlay.tsx
│       │   │   │   ├── AnnotationInput.tsx
│       │   │   │   └── AnnotationMarker.tsx
│       │   │   └── components/
│       │   │       └── PDFPage.tsx
│       │   ├── image/
│       │   │   ├── ImageViewer.tsx
│       │   │   ├── annotation/
│       │   │   └── components/
│       │   └── docx/
│       │       ├── DocxViewer.tsx
│       │       └── components/
│       │           └── DocumentViewer.tsx
│       ├── components/               # Shared UI components
│       │   ├── ColorPicker.tsx
│       │   ├── DocumentList.tsx
│       │   ├── ErrorBoundary.tsx
│       │   ├── FileUpload.tsx
│       │   ├── Header.tsx
│       │   ├── Layout.tsx
│       │   ├── LoadingSpinner.tsx
│       │   ├── Toast.tsx
│       │   └── ToastContainer.tsx
│       ├── hooks/                    # React hooks
│       │   ├── useAnnotationManager.ts
│       │   ├── useAnnotations.ts
│       │   ├── useCoordinateMapper.ts
│       │   ├── useDocuments.ts
│       │   ├── useDocxCoordinates.ts
│       │   └── useFileUpload.ts
│       ├── api/                      # API client services
│       │   ├── api.ts
│       │   └── database.ts
│       ├── pages/                    # Page components
│       │   ├── AdvancedDocumentViewer.tsx
│       │   ├── DocumentLibrary.tsx
│       │   └── DocumentViewer.tsx
│       ├── contexts/                 # React contexts
│       │   └── AppContext.tsx
│       ├── public/                   # Static assets
│       ├── App.tsx                   # Root component
│       ├── main.tsx                  # Entry point
│       ├── App.css
│       ├── index.css
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── eslint.config.js
│       ├── index.html
│       ├── .env.development
│       └── .env.production
│
├── 📁 shared/                        # Shared assets and config
│   ├── config/
│   │   ├── config.py                 # Backend configuration
│   │   └── .env.example
│   └── assets/
│       ├── react.svg
│       └── styles/
│           └── pdf-viewer.css
│
├── 📁 tools/                         # Scripts and utilities
│   ├── scripts/
│   │   ├── database/                 # Database utilities
│   │   │   ├── connection.py
│   │   │   ├── init_db.py
│   │   │   ├── migrate_annotations.py
│   │   │   └── __init__.py
│   │   └── migrations/               # SQL migrations
│   │       └── 001_add_annotation_types.sql
│   └── __init__.py
│
├── 📁 docs/                          # Documentation
│   ├── 01_SYSTEM_OVERVIEW.md
│   ├── 02_TECHNICAL_IMPLEMENTATION.md
│   ├── 03_USER_MANUAL_AND_FEATURES.md
│   ├── 04_SETUP_GUIDE.md
│   └── 05_API_AND_DATA_MODELS.md
│
├── 📁 WorkDone/                      # Daily progress logs
│   └── 2025-12-03.md
│
├── 📁 backend/                       # [OLD - Keep for reference]
├── 📁 frontend/                      # [OLD - Keep for reference]
│
├── README.md                         # Original README
├── README_AATRAL.md                  # AATRAL architecture README
├── MIGRATION_GUIDE.md                # Migration instructions
├── STRUCTURE.md                      # This file
├── run.bat                           # Old startup script
├── run_aatral.bat                    # New AATRAL startup script
└── .gitignore
```

## 🎯 Key Principles

### 1. Feature-Based Organization
- Frontend viewers are grouped by document type (PDF, Image, DOCX)
- Each viewer has its own annotation and components folders
- Backend modules are grouped by business domain

### 2. Module Contract (Backend)
Every module MUST have:
- `model.py` - Database models
- `schema.py` - Input/output schemas
- `service.py` - Business logic
- `router.py` - API routes
- `__init__.py` - Module initialization

### 3. Clear Separation
- **Frontend**: `/apps/web`
- **Backend**: `/modules`
- **Shared Code**: `/core` and `/shared`
- **Utilities**: `/tools`
- **Documentation**: `/docs`
- **Progress Logs**: `/WorkDone`

### 4. Path Aliases
TypeScript/Vite aliases for clean imports:
- `@/` → Root of web app
- `@components` → Shared components
- `@viewers` → Document viewers
- `@hooks` → React hooks
- `@api` → API services
- `@pages` → Page components
- `@core` → Core utilities
- `@shared` → Shared assets

## 🚀 Quick Start

### Run with AATRAL structure:
```bash
run_aatral.bat
```

### Or manually:

**Backend:**
```bash
cd modules
python main.py
```

**Frontend:**
```bash
cd apps/web
npm run dev
```

## 📝 Module Registry

Backend modules are registered in `modules/registry.py` for:
- Validation of module contracts
- Centralized router management
- Module discovery and listing

## 🔄 Migration Status

✅ Structure created
✅ Files migrated
✅ Configs updated
✅ Documentation created
⏳ Import paths (in progress)
⏳ Testing (pending)

See `MIGRATION_GUIDE.md` for detailed migration information.
