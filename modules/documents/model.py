"""
Document model for storing uploaded files metadata.

Supports PDF, DOCX, and image files with optional conversion tracking.
"""
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from tools.scripts.database.connection import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    converted_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship to annotations
    annotations = relationship("Annotation", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename})>"