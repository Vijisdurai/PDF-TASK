from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Union

from app.database.connection import get_db
from app.schemas.annotation import (
    AnnotationResponse, 
    DocumentAnnotationCreate,
    ImageAnnotationCreate,
    AnnotationUpdate,
    AnnotationListResponse
)
from app.services.annotation_service import AnnotationService

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.get("/health")
async def health_check():
    """Health check endpoint for annotation service"""
    return {"status": "healthy", "service": "annotations"}

@router.post("", response_model=AnnotationResponse, status_code=201)
async def create_annotation(
    annotation: Union[DocumentAnnotationCreate, ImageAnnotationCreate],
    db: Session = Depends(get_db)
):
    """
    Create a new annotation (document or image type)
    
    - **Document annotations** require: page, x_percent, y_percent
    - **Image annotations** require: x_pixel, y_pixel, and optionally color
    """
    try:
        created_annotation = AnnotationService.create_annotation(db, annotation)
        return AnnotationResponse.model_validate(created_annotation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{document_id}", response_model=AnnotationListResponse)
async def get_annotations(
    document_id: str,
    annotation_type: Optional[str] = Query(None, description="Filter by annotation type: 'document' or 'image'"),
    page: Optional[int] = Query(None, description="Filter by page number (for document annotations)"),
    db: Session = Depends(get_db)
):
    """
    Get all annotations for a document
    
    - Optionally filter by **annotation_type** ('document' or 'image')
    - Optionally filter by **page** number (for document annotations)
    """
    annotations = AnnotationService.get_annotations_by_document(
        db, 
        document_id, 
        annotation_type=annotation_type,
        page=page
    )
    
    return AnnotationListResponse(
        annotations=[AnnotationResponse.model_validate(ann) for ann in annotations],
        total=len(annotations),
        page=page,
        document_id=document_id
    )

@router.get("/single/{annotation_id}", response_model=AnnotationResponse)
async def get_annotation(
    annotation_id: str,
    db: Session = Depends(get_db)
):
    """Get a single annotation by ID"""
    annotation = AnnotationService.get_annotation_by_id(db, annotation_id)
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    return AnnotationResponse.model_validate(annotation)

@router.put("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: str,
    annotation_update: AnnotationUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing annotation
    
    - Validates that coordinate updates match the annotation type
    - Document annotations cannot be updated with pixel coordinates
    - Image annotations cannot be updated with page/percentage coordinates
    """
    updated_annotation = AnnotationService.update_annotation(
        db, 
        annotation_id, 
        annotation_update
    )
    
    return AnnotationResponse.model_validate(updated_annotation)

@router.delete("/{annotation_id}", status_code=204)
async def delete_annotation(
    annotation_id: str,
    db: Session = Depends(get_db)
):
    """Delete an annotation"""
    AnnotationService.delete_annotation(db, annotation_id)
    return None