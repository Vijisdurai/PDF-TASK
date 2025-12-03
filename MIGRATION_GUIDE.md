# Migration Guide - AATRAL Architecture

## Overview

This project has been restructured from a flat structure to the AATRAL Unified Modular Architecture.

## What Changed

### Old Structure → New Structure

#### Frontend
```
frontend/src/components/     → apps/web/components/ (shared only)
frontend/src/components/PDF* → apps/web/viewers/pdf/
frontend/src/components/Image* → apps/web/viewers/image/
frontend/src/components/Docx* → apps/web/viewers/docx/
frontend/src/hooks/          → apps/web/hooks/
frontend/src/pages/          → apps/web/pages/
frontend/src/services/       → apps/web/api/
frontend/src/utils/          → core/utils/
frontend/src/types/          → core/interfaces/
frontend/src/contexts/       → apps/web/contexts/
frontend/src/styles/         → shared/assets/styles/
frontend/src/assets/         → shared/assets/
```

#### Backend
```
backend/app/models/          → modules/{feature}/model.py
backend/app/schemas/         → modules/{feature}/schema.py
backend/app/services/        → modules/{feature}/service.py
backend/app/api/routers/     → modules/{feature}/router.py
backend/app/core/config.py   → shared/config/config.py
backend/app/database/        → tools/scripts/database/
backend/migrations/          → tools/scripts/migrations/
backend/main.py              → modules/main.py
```

## Import Path Changes

### Frontend (TypeScript/React)

**Old:**
```typescript
import { Component } from '../components/Component'
import { useHook } from '../hooks/useHook'
import { api } from '../services/api'
```

**New:**
```typescript
import { Component } from '@components/Component'
import { useHook } from '@hooks/useHook'
import { api } from '@api/api'
```

### Backend (Python/FastAPI)

**Old:**
```python
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate
from app.services.annotation_service import AnnotationService
```

**New:**
```python
from modules.annotation.model import Annotation
from modules.annotation.schema import AnnotationCreate
from modules.annotation.service import AnnotationService
```

## Running the Application

### Backend

```bash
# Navigate to modules directory
cd modules

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

### Frontend

```bash
# Navigate to web app
cd apps/web

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

## Next Steps

1. ✅ Folder structure created
2. ✅ Files migrated to new locations
3. ✅ Path aliases configured
4. ⏳ Update all import statements (in progress)
5. ⏳ Test application functionality
6. ⏳ Update documentation references

## Rollback (if needed)

The original `frontend/` and `backend/` folders are still intact. If you need to rollback:

1. Stop using the new structure
2. Continue using the old folders
3. Delete the new AATRAL folders: `core/`, `modules/`, `apps/`, `shared/`, `tools/`

## Benefits of AATRAL Architecture

1. **Clear separation of concerns** - Frontend, backend, and shared code are clearly separated
2. **Feature-based organization** - Related code is grouped together
3. **Scalability** - Easy to add new features as modules
4. **Maintainability** - Easier to find and update code
5. **Reusability** - Shared utilities in one place
6. **Team collaboration** - Clear ownership boundaries

## Questions?

Refer to `README_AATRAL.md` for detailed architecture documentation.
