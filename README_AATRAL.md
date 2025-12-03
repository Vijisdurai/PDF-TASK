# AATRAL Architecture - Document Annotation System

This project follows the **AATRAL Unified Modular Project Structure**.

## 📁 Project Structure

```
/
├── core/                    # Shared cross-application types and utilities
│   ├── schemas/            # Shared DTOs and validation schemas
│   ├── interfaces/         # TypeScript type definitions
│   ├── utils/              # Shared utility functions
│   └── constants/          # Shared constants
│
├── modules/                 # Backend business logic (Python/FastAPI)
│   ├── annotation/         # Annotation CRUD module
│   │   ├── model.py       # SQLAlchemy models
│   │   ├── schema.py      # Pydantic schemas
│   │   ├── service.py     # Business logic
│   │   └── router.py      # FastAPI routes
│   │
│   ├── documents/          # Document management module
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── service.py
│   │   ├── router.py
│   │   └── conversion_service.py
│   │
│   ├── main.py            # FastAPI application entry point
│   └── requirements.txt   # Python dependencies
│
├── apps/                   # Frontend applications
│   └── web/               # React + TypeScript UI
│       ├── viewers/       # Document viewers (feature-based)
│       │   ├── pdf/
│       │   │   ├── PDFViewer.tsx
│       │   │   ├── annotation/
│       │   │   └── components/
│       │   ├── image/
│       │   │   ├── ImageViewer.tsx
│       │   │   ├── annotation/
│       │   │   └── components/
│       │   └── docx/
│       │       ├── DocxViewer.tsx
│       │       └── components/
│       │
│       ├── components/    # Shared UI components
│       ├── hooks/         # React hooks
│       ├── api/           # API client services
│       ├── pages/         # Page components
│       ├── contexts/      # React contexts
│       ├── App.tsx
│       ├── main.tsx
│       └── package.json
│
├── shared/                 # Shared assets and config
│   ├── config/            # Configuration files
│   └── assets/            # Images, fonts, styles
│
├── tools/                  # Scripts and utilities
│   └── scripts/           # Database migrations, loaders
│       ├── database/
│       └── migrations/
│
├── docs/                   # Documentation
│
└── WorkDone/              # Daily progress logs (YYYY-MM-DD.md)
```

## 🚀 Getting Started

### Backend Setup

```bash
cd modules
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📝 Module Contract

Each backend module MUST follow this structure:

- **model.py** - SQLAlchemy database models
- **schema.py** - Pydantic input/output schemas
- **service.py** - Business logic implementation
- **router.py** - FastAPI route definitions

## 🎯 Feature Organization

### Frontend Features (apps/web)
- **viewers/** - Document viewers (PDF, Image, DOCX, 3D)
- **auth/** - Login & signup (future)
- **chat/** - Chat UI & voice (future)
- **history/** - User history (future)
- **feedback/** - User feedback (future)
- **defect/** - Defect logging (future)

### Backend Modules (modules/)
- **annotation/** - Annotation CRUD operations
- **documents/** - Document upload & management
- **auth/** - Authentication (future)
- **voice/** - Voice-to-text/text-to-speech (future)
- **history/** - History tracking (future)
- **feedback/** - Feedback management (future)
- **defect/** - Defect log management (future)

## 🔧 Path Aliases

Vite is configured with the following aliases:

- `@/` → `apps/web/`
- `@components` → `apps/web/components`
- `@viewers` → `apps/web/viewers`
- `@hooks` → `apps/web/hooks`
- `@api` → `apps/web/api`
- `@pages` → `apps/web/pages`
- `@contexts` → `apps/web/contexts`
- `@core` → `core/`
- `@shared` → `shared/`

## 📊 Daily Progress

All daily work logs are stored in `/WorkDone` with the format `YYYY-MM-DD.md`

## 🏗️ Architecture Principles

1. **Feature-based organization** - Group by feature, not by file type
2. **Module isolation** - Each module is self-contained
3. **Shared utilities** - Common code lives in `/core` or `/shared`
4. **Clear separation** - Frontend in `/apps`, backend in `/modules`
5. **Type safety** - TypeScript for frontend, type hints for backend

## 📚 Documentation

See `/docs` folder for detailed documentation:
- System Overview
- Technical Implementation
- User Manual & Features
- Setup Guide
- API & Data Models
