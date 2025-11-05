from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.annotation import AnnotationResponse, AnnotationCreate, AnnotationUpdate
from app.models.annotation import Annotation

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.get("/health")
async def health_check():
    """Health check endpoint for annotation service"""
    return {"status": "healthy", "service": "annotations"}

# Annotation endpoints will be implemented in later tasks