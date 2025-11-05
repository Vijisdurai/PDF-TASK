from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class AnnotationBase(BaseModel):
    """Base annotation schema with common fields"""
    page: int = Field(..., ge=1, description="Page number (1-indexed)")
    x_percent: float = Field(..., ge=0.0, le=100.0, description="X coordinate as percentage (0-100)")
    y_percent: float = Field(..., ge=0.0, le=100.0, description="Y coordinate as percentage (0-100)")
    content: str = Field(..., min_length=1, max_length=5000, description="Annotation text content")

class AnnotationCreate(AnnotationBase):
    """Schema for creating a new annotation"""
    document_id: str = Field(..., description="ID of the document this annotation belongs to")
    
    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Annotation content cannot be empty or whitespace only")
        return v.strip()

class AnnotationUpdate(BaseModel):
    """Schema for updating an annotation"""
    page: Optional[int] = Field(None, ge=1, description="Page number (1-indexed)")
    x_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="X coordinate as percentage")
    y_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Y coordinate as percentage")
    content: Optional[str] = Field(None, min_length=1, max_length=5000, description="Annotation text content")
    
    @validator('content')
    def validate_content(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Annotation content cannot be empty or whitespace only")
        return v.strip() if v else v

class AnnotationResponse(AnnotationBase):
    """Schema for annotation responses"""
    id: str = Field(..., description="Unique annotation identifier")
    document_id: str = Field(..., description="ID of the document this annotation belongs to")
    created_at: datetime = Field(..., description="Annotation creation timestamp")
    updated_at: datetime = Field(..., description="Annotation last update timestamp")
    
    class Config:
        from_attributes = True

class AnnotationListResponse(BaseModel):
    """Schema for annotation list responses"""
    annotations: List[AnnotationResponse]
    total: int = Field(..., description="Total number of annotations")
    page: Optional[int] = Field(None, description="Page number filter applied")
    document_id: str = Field(..., description="Document ID these annotations belong to")

class AnnotationBulkCreate(BaseModel):
    """Schema for creating multiple annotations at once"""
    document_id: str = Field(..., description="ID of the document")
    annotations: List[AnnotationBase] = Field(..., min_items=1, max_items=50, description="List of annotations to create")
    
    @validator('annotations')
    def validate_annotations(cls, v):
        if not v:
            raise ValueError("At least one annotation must be provided")
        return v

class AnnotationSyncRequest(BaseModel):
    """Schema for synchronizing annotations"""
    document_id: str = Field(..., description="Document ID")
    last_sync: Optional[datetime] = Field(None, description="Last synchronization timestamp")
    local_annotations: List[AnnotationResponse] = Field(default=[], description="Local annotations to sync")

class AnnotationSyncResponse(BaseModel):
    """Schema for annotation sync response"""
    server_annotations: List[AnnotationResponse] = Field(..., description="Server annotations")
    conflicts: List[AnnotationResponse] = Field(default=[], description="Conflicting annotations")
    sync_timestamp: datetime = Field(..., description="Current sync timestamp")