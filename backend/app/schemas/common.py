from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ErrorResponse(BaseModel):
    """Standard error response schema"""
    error: Dict[str, Any] = Field(..., description="Error details")
    
    @classmethod
    def create(cls, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        return cls(error={
            "code": code,
            "message": message,
            "details": details or {}
        })

class SuccessResponse(BaseModel):
    """Standard success response schema"""
    success: bool = Field(True, description="Operation success status")
    message: Optional[str] = Field(None, description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")

class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str = Field(..., description="Service health status")
    timestamp: Optional[str] = Field(None, description="Health check timestamp")
    service: Optional[str] = Field(None, description="Service name")
    version: Optional[str] = Field(None, description="Service version")

class PaginationParams(BaseModel):
    """Pagination parameters schema"""
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit

class PaginatedResponse(BaseModel):
    """Base paginated response schema"""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
    
    @classmethod
    def create(cls, total: int, page: int, limit: int, **kwargs):
        pages = (total + limit - 1) // limit  # Ceiling division
        return cls(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            **kwargs
        )