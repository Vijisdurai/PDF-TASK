import pytest
from datetime import datetime
from decimal import Decimal

from app.models.document import Document
from app.models.annotation import Annotation


class TestDocumentModel:
    """Test cases for Document model"""
    
    def test_create_document(self, test_db, sample_document_data):
        """Test creating a document with valid data"""
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        assert document.id is not None
        assert document.filename == sample_document_data["filename"]
        assert document.original_filename == sample_document_data["original_filename"]
        assert document.mime_type == sample_document_data["mime_type"]
        assert document.file_size == sample_document_data["file_size"]
        assert document.file_path == sample_document_data["file_path"]
        assert document.converted_path is None
        assert isinstance(document.created_at, datetime)
        assert isinstance(document.updated_at, datetime)
    
    def test_document_id_generation(self, test_db, sample_document_data):
        """Test that document ID is automatically generated"""
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        
        assert document.id is not None
        assert len(document.id) == 36  # UUID4 length
        assert "-" in document.id  # UUID format
    
    def test_document_timestamps(self, test_db, sample_document_data):
        """Test that timestamps are automatically set"""
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        assert document.created_at is not None
        assert document.updated_at is not None
        assert document.created_at <= document.updated_at
    
    def test_document_repr(self, test_db, sample_document_data):
        """Test document string representation"""
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        
        repr_str = repr(document)
        assert "Document" in repr_str
        assert document.id in repr_str
        assert document.filename in repr_str


class TestAnnotationModel:
    """Test cases for Annotation model"""
    
    def test_create_annotation(self, test_db, sample_document_data, sample_annotation_data):
        """Test creating an annotation with valid data"""
        # First create a document
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        # Create annotation
        annotation_data = {**sample_annotation_data, "document_id": document.id}
        annotation = Annotation(**annotation_data)
        test_db.add(annotation)
        test_db.commit()
        test_db.refresh(annotation)
        
        assert annotation.id is not None
        assert annotation.document_id == document.id
        assert annotation.page == sample_annotation_data["page"]
        assert annotation.x_percent == Decimal(str(sample_annotation_data["x_percent"]))
        assert annotation.y_percent == Decimal(str(sample_annotation_data["y_percent"]))
        assert annotation.content == sample_annotation_data["content"]
        assert isinstance(annotation.created_at, datetime)
        assert isinstance(annotation.updated_at, datetime)
    
    def test_annotation_id_generation(self, test_db, sample_document_data, sample_annotation_data):
        """Test that annotation ID is automatically generated"""
        # Create document first
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        
        # Create annotation
        annotation_data = {**sample_annotation_data, "document_id": document.id}
        annotation = Annotation(**annotation_data)
        test_db.add(annotation)
        test_db.commit()
        
        assert annotation.id is not None
        assert len(annotation.id) == 36  # UUID4 length
        assert "-" in annotation.id  # UUID format
    
    def test_annotation_decimal_precision(self, test_db, sample_document_data):
        """Test that coordinate percentages maintain proper decimal precision"""
        # Create document first
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        
        # Create annotation with precise coordinates
        annotation = Annotation(
            document_id=document.id,
            page=1,
            x_percent=Decimal("99.99"),
            y_percent=Decimal("0.01"),
            content="Precision test"
        )
        test_db.add(annotation)
        test_db.commit()
        test_db.refresh(annotation)
        
        assert annotation.x_percent == Decimal("99.99")
        assert annotation.y_percent == Decimal("0.01")
    
    def test_annotation_repr(self, test_db, sample_document_data, sample_annotation_data):
        """Test annotation string representation"""
        # Create document first
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        
        # Create annotation
        annotation_data = {**sample_annotation_data, "document_id": document.id}
        annotation = Annotation(**annotation_data)
        test_db.add(annotation)
        test_db.commit()
        
        repr_str = repr(annotation)
        assert "Annotation" in repr_str
        assert annotation.id in repr_str
        assert annotation.document_id in repr_str
        assert str(annotation.page) in repr_str


class TestModelRelationships:
    """Test cases for model relationships"""
    
    def test_document_annotation_relationship(self, test_db, sample_document_data, sample_annotation_data):
        """Test the relationship between Document and Annotation models"""
        # Create document
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        # Create multiple annotations
        annotation1 = Annotation(
            document_id=document.id,
            page=1,
            x_percent=25.0,
            y_percent=50.0,
            content="First annotation"
        )
        annotation2 = Annotation(
            document_id=document.id,
            page=2,
            x_percent=75.0,
            y_percent=25.0,
            content="Second annotation"
        )
        
        test_db.add_all([annotation1, annotation2])
        test_db.commit()
        test_db.refresh(annotation1)
        test_db.refresh(annotation2)
        
        # Test document -> annotations relationship
        assert len(document.annotations) == 2
        annotation_ids = [ann.id for ann in document.annotations]
        assert annotation1.id in annotation_ids
        assert annotation2.id in annotation_ids
        
        # Test annotation -> document relationship
        assert annotation1.document.id == document.id
        assert annotation2.document.id == document.id
        assert annotation1.document.filename == document.filename
    
    def test_cascade_delete(self, test_db, sample_document_data, sample_annotation_data):
        """Test that annotations are deleted when document is deleted (cascade)"""
        # Create document
        document = Document(**sample_document_data)
        test_db.add(document)
        test_db.commit()
        test_db.refresh(document)
        
        # Create annotation
        annotation = Annotation(
            document_id=document.id,
            **sample_annotation_data
        )
        test_db.add(annotation)
        test_db.commit()
        
        # Verify annotation exists
        annotation_count = test_db.query(Annotation).filter(
            Annotation.document_id == document.id
        ).count()
        assert annotation_count == 1
        
        # Delete document
        test_db.delete(document)
        test_db.commit()
        
        # Verify annotation is also deleted (cascade)
        annotation_count = test_db.query(Annotation).filter(
            Annotation.document_id == document.id
        ).count()
        assert annotation_count == 0