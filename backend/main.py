from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from app.api import api_router
from app.core.config import settings
from app.database.connection import init_db

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Document Annotation System API"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Document Annotation API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )