"""
Document Annotation System - Main FastAPI Application.

This is the entry point for the backend API server.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime, timezone
import uvicorn

from shared.config.config import settings
from tools.scripts.database.connection import init_db
from modules.annotation.router import router as annotation_router
from modules.documents.router import router as documents_router

# Initialize database on startup using lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    try:
        init_db()
        print(f"✓ Database initialized successfully")
        print(f"✓ Server starting on http://127.0.0.1:8000")
        print(f"✓ API docs available at http://127.0.0.1:8000/docs")
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    print("✓ Server shutting down gracefully")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Document Annotation System API",
    lifespan=lifespan
)

# Configure CORS
# In production, replace ["*"] with specific origins from settings
allowed_origins = ["*"] if settings.debug else [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative frontend port
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include module routers
app.include_router(annotation_router, prefix="/api", tags=["annotations"])
app.include_router(documents_router, prefix="/api", tags=["documents"])

# Mount static files for uploads
UPLOAD_DIR = Path(__file__).parent.parent / "backend" / "uploads"
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Document Annotation API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with live timestamp"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "document-annotation-system",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
        access_log=settings.debug,
        workers=1  # Use multiple workers in production with gunicorn
    )