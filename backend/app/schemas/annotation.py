from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Literal
from datetime import datetime
from decimal import Decimal
import re

class AnnotationBase(BaseModel):
    """Base annotation schema with common fields"""
    annotation_type: Literal['document', 'image'] = Field(..., description="Type of annotation: 'document' or 'image'")
    content: str = Field(..., min_length=1, max_length=5000, description="Annotation text content")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Annotation content cannot be empty or whitespace only")
        return v.strip()

class DocumentAnnotationCreate(AnnotationBase):
    """Schema for creating a document annotation (page-based)"""
    annotation_type: Literal['document'] = Field('document', description="Must be 'document'")
    document_id: str = Field(..., description="ID of the document this annotation belongs to")
    page: int = Field(..., ge=1, description="Page number (1-indexed)")
    x_percent: float = Field(..., ge=0.0, le=100.0, description="X coordinate as percentage (0-100)")
    y_percent: float = Field(..., ge=0.0, le=100.0, description="Y coordinate as percentage (0-100)")

class ImageAnnotationCreate(AnnotationBase):
    """Schema for creating an image annotation (pixel-based)"""
    annotation_type: Literal['image'] = Field('image', description="Must be 'image'")
    document_id: str = Field(..., description="ID of the document this annotation belongs to")
    x_pixel: int = Field(..., ge=0, description="X coordinate in pixels")
    y_pixel: int = Field(..., ge=0, description="Y coordinate in pixels")
    color: Optional[str] = Field(None, description="Hex color code (e.g., '#FFFF00')")
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is not None:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
                raise ValueError("Color must be a valid hex color code (e.g., '#FFFF00')")
        return v

# Union type for creating either type of annotation
AnnotationCreate = DocumentAnnotationCreate | ImageAnnotationCreate

class AnnotationUpdate(BaseModel):
    """Schema for updating an annotation"""
    # Document annotation fields
    page: Optional[int] = Field(None, ge=1, description="Page number (1-indexed)")
    x_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="X coordinate as percentage")
    y_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Y coordinate as percentage")
    
    # Image annotation fields
    x_pixel: Optional[int] = Field(None, ge=0, description="X coordinate in pixels")
    y_pixel: Optional[int] = Field(None, ge=0, description="Y coordinate in pixels")
    color: Optional[str] = Field(None, description="Hex color code (e.g., '#FFFF00')")
    
    # Common fields
    content: Optional[str] = Field(None, min_length=1, max_length=5000, description="Annotation text content")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Annotation content cannot be empty or whitespace only")
        return v.strip() if v else v
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is not None:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
                raise ValueError("Color must be a valid hex color code (e.g., '#FFFF00')")
        return v

class AnnotationResponse(BaseModel):
    """Schema for annotation responses"""
    id: str = Field(..., description="Unique annotation identifier")
    document_id: str = Field(..., description="ID of the document this annotation belongs to")
    annotation_type: Literal['document', 'image'] = Field(..., description="Type of annotation")
    
    # Document annotation fields (optional based on type)
    page: Optional[int] = Field(None, description="Page number (for document annotations)")
    x_percent: Optional[float] = Field(None, description="X coordinate as percentage (for document annotations)")
    y_percent: Optional[float] = Field(None, description="Y coordinate as percentage (for document annotations)")
    
    # Image annotation fields (optional based on type)
    x_pixel: Optional[int] = Field(None, description="X coordinate in pixels (for image annotations)")
    y_pixel: Optional[int] = Field(None, description="Y coordinate in pixels (for image annotations)")
    color: Optional[str] = Field(None, description="Hex color code (for image annotations)")
    
    # Common fields
    content: str = Field(..., description="Annotation text content")
    created_at: datetime = Field(..., description="Annotation creation timestamp")
    updated_at: datetime = Field(..., description="Annotation last update timestamp")
    
    class Config:
        from_attributes = True
    
    @model_validator(mode='after')
    def validate_annotation_fields(self):
        """Ensure correct fields are present based on annotation_type"""
        if self.annotation_type == 'document':
            if self.page is None or self.x_percent is None or self.y_percent is None:
                raise ValueError("Document annotations must have page, x_percent, and y_percent fields")
        elif self.annotation_type == 'image':
            if self.x_pixel is None or self.y_pixel is None:
                raise ValueError("Image annotations must have x_pixel and y_pixel fields")
        
        return self

class AnnotationListResponse(BaseModel):
    """Schema for annotation list responses"""
    annotations: List[AnnotationResponse]
    total: int = Field(..., description="Total number of annotations")
    page: Optional[int] = Field(None, description="Page number filter applied")
    document_id: str = Field(..., description="Document ID these annotations belong to")

class AnnotationBulkCreate(BaseModel):
    """Schema for creating multiple annotations at once"""
    document_id: str = Field(..., description="ID of the document")
    annotations: List[DocumentAnnotationCreate | ImageAnnotationCreate] = Field(..., min_length=1, max_length=50, description="List of annotations to create")
    
    @field_validator('annotations')
    @classmethod
    def validate_annotations(cls, v):
        if not v:
            raise ValueError("At least one annotation must be provided")
        return v

