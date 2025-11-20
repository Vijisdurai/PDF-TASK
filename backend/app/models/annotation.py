from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Numeric, CheckConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.connection import Base

class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Annotation type discriminator
    annotation_type = Column(String(20), nullable=False, default='document')
    
    # Document annotation fields (page-based, percentage coordinates)
    page = Column(Integer, nullable=True)
    x_percent = Column(Numeric(5, 2), nullable=True)
    y_percent = Column(Numeric(5, 2), nullable=True)
    
    # Image annotation fields (pixel-based coordinates)
    x_pixel = Column(Integer, nullable=True)
    y_pixel = Column(Integer, nullable=True)
    
    # Common fields
    content = Column(Text, nullable=False)
    color = Column(String(7), nullable=True)  # Hex color code (e.g., '#FFFF00')
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship to document
    document = relationship("Document", back_populates="annotations")
    
    # Check constraint to ensure correct fields are populated based on annotation_type
    __table_args__ = (
        CheckConstraint(
            "(annotation_type = 'document' AND page IS NOT NULL AND x_percent IS NOT NULL AND y_percent IS NOT NULL) OR "
            "(annotation_type = 'image' AND x_pixel IS NOT NULL AND y_pixel IS NOT NULL)",
            name="check_annotation_type_fields"
        ),
        Index('idx_annotations_document_page', 'document_id', 'page'),
        Index('idx_annotations_document_type', 'document_id', 'annotation_type'),
    )
    
    def __repr__(self):
        return f"<Annotation(id={self.id}, document_id={self.document_id}, type={self.annotation_type})>"