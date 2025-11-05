from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    """Base document schema with common fields"""
    filename: str = Field(..., min_length=1, max_length=255, description="Document filename")
    original_filename: str = Field(..., min_length=1, max_length=255, description="Original filename before processing")

class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    mime_type: str = Field(..., description="MIME type of the document")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    file_path: str = Field(..., description="Path to stored file")
    converted_path: Optional[str] = Field(None, description="Path to converted file (if applicable)")
    
    @validator('mime_type')
    def validate_mime_type(cls, v):
        allowed_types = [
            "application/pdf",
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
            "image/jpg"
        ]
        if v not in allowed_types:
            raise ValueError(f"Unsupported file type. Allowed types: {allowed_types}")
        return v
    
    @validator('file_size')
    def validate_file_size(cls, v):
        max_size = 100 * 1024 * 1024  # 100MB
        if v > max_size:
            raise ValueError(f"File size exceeds maximum allowed size of {max_size} bytes")
        return v

class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    filename: Optional[str] = Field(None, min_length=1, max_length=255)
    converted_path: Optional[str] = Field(None, description="Path to converted file")

class DocumentResponse(DocumentBase):
    """Schema for document responses"""
    id: str = Field(..., description="Unique document identifier")
    mime_type: str = Field(..., description="MIME type of the document")
    file_size: int = Field(..., description="File size in bytes")
    file_path: str = Field(..., description="Path to stored file")
    converted_path: Optional[str] = Field(None, description="Path to converted file")
    created_at: datetime = Field(..., description="Document creation timestamp")
    updated_at: datetime = Field(..., description="Document last update timestamp")
    
    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    """Schema for document list responses"""
    documents: List[DocumentResponse]
    total: int = Field(..., description="Total number of documents")
    
class DocumentMetadata(BaseModel):
    """Lightweight document metadata schema"""
    id: str
    filename: str
    mime_type: str
    file_size: int
    created_at: datetime
    
    class Config:
        from_attributes = True