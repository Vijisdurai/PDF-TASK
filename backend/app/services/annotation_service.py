"""
Service layer for annotation operations
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException

from app.models.annotation import Annotation
from app.schemas.annotation import (
    DocumentAnnotationCreate, 
    ImageAnnotationCreate, 
    AnnotationUpdate,
    AnnotationResponse
)

class AnnotationService:
    """Service for managing annotations"""
    
    @staticmethod
    def create_annotation(
        db: Session, 
        annotation_data: DocumentAnnotationCreate | ImageAnnotationCreate
    ) -> Annotation:
        """Create a new annotation"""
        
        # Prepare annotation data
        annotation_dict = annotation_data.model_dump()
        
        # Create annotation instance
        annotation = Annotation(**annotation_dict)
        
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        
        return annotation
    
    @staticmethod
    def get_annotations_by_document(
        db: Session, 
        document_id: str,
        annotation_type: Optional[str] = None,
        page: Optional[int] = None
    ) -> List[Annotation]:
        """Get all annotations for a document, optionally filtered by type and page"""
        
        query = db.query(Annotation).filter(Annotation.document_id == document_id)
        
        if annotation_type:
            if annotation_type not in ['document', 'image']:
                raise HTTPException(status_code=400, detail="Invalid annotation_type. Must be 'document' or 'image'")
            query = query.filter(Annotation.annotation_type == annotation_type)
        
        if page is not None:
            query = query.filter(Annotation.page == page)
        
        return query.order_by(Annotation.created_at).all()
    
    @staticmethod
    def get_annotation_by_id(db: Session, annotation_id: str) -> Optional[Annotation]:
        """Get a single annotation by ID"""
        return db.query(Annotation).filter(Annotation.id == annotation_id).first()
    
    @staticmethod
    def update_annotation(
        db: Session, 
        annotation_id: str, 
        annotation_update: AnnotationUpdate
    ) -> Annotation:
        """Update an existing annotation"""
        
        annotation = AnnotationService.get_annotation_by_id(db, annotation_id)
        
        if not annotation:
            raise HTTPException(status_code=404, detail="Annotation not found")
        
        # Get update data, excluding unset fields
        update_data = annotation_update.model_dump(exclude_unset=True)
        
        # Validate that coordinate updates match the annotation type
        if annotation.annotation_type == 'document':
            # Document annotations should not have pixel coordinates
            if 'x_pixel' in update_data or 'y_pixel' in update_data:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot update pixel coordinates on document annotation"
                )
        elif annotation.annotation_type == 'image':
            # Image annotations should not have page/percentage coordinates
            if 'page' in update_data or 'x_percent' in update_data or 'y_percent' in update_data:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot update page/percentage coordinates on image annotation"
                )
        
        # Apply updates
        for field, value in update_data.items():
            setattr(annotation, field, value)
        
        db.commit()
        db.refresh(annotation)
        
        return annotation
    
    @staticmethod
    def delete_annotation(db: Session, annotation_id: str) -> bool:
        """Delete an annotation"""
        
        annotation = AnnotationService.get_annotation_by_id(db, annotation_id)
        
        if not annotation:
            raise HTTPException(status_code=404, detail="Annotation not found")
        
        db.delete(annotation)
        db.commit()
        
        return True
