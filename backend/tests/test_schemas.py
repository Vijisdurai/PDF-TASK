import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.document import (
    DocumentBase, DocumentCreate, DocumentUpdate, DocumentResponse, 
    DocumentListResponse, DocumentMetadata
)
from app.schemas.annotation import (
    AnnotationBase, AnnotationCreate, AnnotationUpdate, AnnotationResponse,
    AnnotationListResponse, AnnotationBulkCreate, AnnotationSyncRequest, AnnotationSyncResponse
)


class TestDocumentSchemas:
    """Test cases for Document schemas"""
    
    def test_document_base_valid(self):
        """Test DocumentBase with valid data"""
        data = {
            "filename": "test.pdf",
            "original_filename": "original_test.pdf"
        }
        schema = DocumentBase(**data)
        assert schema.filename == "test.pdf"
        assert schema.original_filename == "original_test.pdf"
    
    def test_document_base_validation_errors(self):
        """Test DocumentBase validation errors"""
        # Empty filename
        with pytest.raises(ValidationError) as exc_info:
            DocumentBase(filename="", original_filename="test.pdf")
        assert "String should have at least 1 character" in str(exc_info.value)
        
        # Filename too long
        long_filename = "a" * 256
        with pytest.raises(ValidationError) as exc_info:
            DocumentBase(filename=long_filename, original_filename="test.pdf")
        assert "String should have at most 255 characters" in str(exc_info.value)
    
    def test_document_create_valid(self):
        """Test DocumentCreate with valid data"""
        data = {
            "filename": "test.pdf",
            "original_filename": "original_test.pdf",
            "mime_type": "application/pdf",
            "file_size": 1024000,
            "file_path": "/uploads/test.pdf"
        }
        schema = DocumentCreate(**data)
        assert schema.mime_type == "application/pdf"
        assert schema.file_size == 1024000
        assert schema.file_path == "/uploads/test.pdf"
        assert schema.converted_path is None
    
    def test_document_create_mime_type_validation(self):
        """Test DocumentCreate MIME type validation"""
        base_data = {
            "filename": "test.pdf",
            "original_filename": "original_test.pdf",
            "file_size": 1024000,
            "file_path": "/uploads/test.pdf"
        }
        
        # Valid MIME types
        valid_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
            "image/jpg"
        ]
        
        for mime_type in valid_types:
            data = {**base_data, "mime_type": mime_type}
            schema = DocumentCreate(**data)
            assert schema.mime_type == mime_type
        
        # Invalid MIME type
        with pytest.raises(ValidationError) as exc_info:
            DocumentCreate(**{**base_data, "mime_type": "text/plain"})
        assert "Unsupported file type" in str(exc_info.value)
    
    def test_document_create_file_size_validation(self):
        """Test DocumentCreate file size validation"""
        base_data = {
            "filename": "test.pdf",
            "original_filename": "original_test.pdf",
            "mime_type": "application/pdf",
            "file_path": "/uploads/test.pdf"
        }
        
        # Valid file size
        data = {**base_data, "file_size": 50 * 1024 * 1024}  # 50MB
        schema = DocumentCreate(**data)
        assert schema.file_size == 50 * 1024 * 1024
        
        # Zero file size
        with pytest.raises(ValidationError) as exc_info:
            DocumentCreate(**{**base_data, "file_size": 0})
        assert "Input should be greater than 0" in str(exc_info.value)
        
        # File too large
        with pytest.raises(ValidationError) as exc_info:
            DocumentCreate(**{**base_data, "file_size": 200 * 1024 * 1024})  # 200MB
        assert "File size exceeds maximum allowed size" in str(exc_info.value)
    
    def test_document_update_optional_fields(self):
        """Test DocumentUpdate with optional fields"""
        # Empty update
        schema = DocumentUpdate()
        assert schema.filename is None
        assert schema.converted_path is None
        
        # Partial update
        schema = DocumentUpdate(filename="updated.pdf")
        assert schema.filename == "updated.pdf"
        assert schema.converted_path is None
    
    def test_document_response_from_attributes(self):
        """Test DocumentResponse with from_attributes config"""
        # This would typically be tested with actual model instances
        # but we can test the schema structure
        data = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "filename": "test.pdf",
            "original_filename": "original_test.pdf",
            "mime_type": "application/pdf",
            "file_size": 1024000,
            "file_path": "/uploads/test.pdf",
            "converted_path": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        schema = DocumentResponse(**data)
        assert schema.id == data["id"]
        assert schema.filename == data["filename"]


class TestAnnotationSchemas:
    """Test cases for Annotation schemas"""
    
    def test_annotation_base_valid(self):
        """Test AnnotationBase with valid data"""
        data = {
            "page": 1,
            "x_percent": 50.5,
            "y_percent": 75.25,
            "content": "This is a test annotation"
        }
        schema = AnnotationBase(**data)
        assert schema.page == 1
        assert schema.x_percent == 50.5
        assert schema.y_percent == 75.25
        assert schema.content == "This is a test annotation"
    
    def test_annotation_base_validation_errors(self):
        """Test AnnotationBase validation errors"""
        base_data = {
            "page": 1,
            "x_percent": 50.0,
            "y_percent": 50.0,
            "content": "Test"
        }
        
        # Invalid page number
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "page": 0})
        assert "Input should be greater than or equal to 1" in str(exc_info.value)
        
        # Invalid x_percent (negative)
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "x_percent": -1.0})
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        # Invalid x_percent (over 100)
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "x_percent": 101.0})
        assert "Input should be less than or equal to 100" in str(exc_info.value)
        
        # Invalid y_percent (over 100)
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "y_percent": 100.1})
        assert "Input should be less than or equal to 100" in str(exc_info.value)
        
        # Empty content
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "content": ""})
        assert "String should have at least 1 character" in str(exc_info.value)
        
        # Content too long
        long_content = "a" * 5001
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBase(**{**base_data, "content": long_content})
        assert "String should have at most 5000 characters" in str(exc_info.value)
    
    def test_annotation_create_valid(self):
        """Test AnnotationCreate with valid data"""
        data = {
            "document_id": "123e4567-e89b-12d3-a456-426614174000",
            "page": 1,
            "x_percent": 50.5,
            "y_percent": 75.25,
            "content": "This is a test annotation"
        }
        schema = AnnotationCreate(**data)
        assert schema.document_id == data["document_id"]
        assert schema.content == "This is a test annotation"
    
    def test_annotation_create_content_validation(self):
        """Test AnnotationCreate content validation and trimming"""
        base_data = {
            "document_id": "123e4567-e89b-12d3-a456-426614174000",
            "page": 1,
            "x_percent": 50.0,
            "y_percent": 50.0
        }
        
        # Content with whitespace should be trimmed
        data = {**base_data, "content": "  Test content  "}
        schema = AnnotationCreate(**data)
        assert schema.content == "Test content"
        
        # Whitespace-only content should raise error
        with pytest.raises(ValidationError) as exc_info:
            AnnotationCreate(**{**base_data, "content": "   "})
        assert "Annotation content cannot be empty or whitespace only" in str(exc_info.value)
    
    def test_annotation_update_optional_fields(self):
        """Test AnnotationUpdate with optional fields"""
        # Empty update
        schema = AnnotationUpdate()
        assert schema.page is None
        assert schema.x_percent is None
        assert schema.y_percent is None
        assert schema.content is None
        
        # Partial update
        schema = AnnotationUpdate(content="Updated content")
        assert schema.content == "Updated content"
        assert schema.page is None
        
        # Content trimming
        schema = AnnotationUpdate(content="  Updated content  ")
        assert schema.content == "Updated content"
        
        # Whitespace-only content should raise error
        with pytest.raises(ValidationError) as exc_info:
            AnnotationUpdate(content="   ")
        assert "Annotation content cannot be empty or whitespace only" in str(exc_info.value)
    
    def test_annotation_bulk_create_validation(self):
        """Test AnnotationBulkCreate validation"""
        base_annotation = {
            "page": 1,
            "x_percent": 50.0,
            "y_percent": 50.0,
            "content": "Test annotation"
        }
        
        # Valid bulk create
        data = {
            "document_id": "123e4567-e89b-12d3-a456-426614174000",
            "annotations": [base_annotation]
        }
        schema = AnnotationBulkCreate(**data)
        assert len(schema.annotations) == 1
        
        # Empty annotations list
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBulkCreate(
                document_id="123e4567-e89b-12d3-a456-426614174000",
                annotations=[]
            )
        assert "List should have at least 1 item" in str(exc_info.value)
        
        # Too many annotations
        too_many_annotations = [base_annotation] * 51
        with pytest.raises(ValidationError) as exc_info:
            AnnotationBulkCreate(
                document_id="123e4567-e89b-12d3-a456-426614174000",
                annotations=too_many_annotations
            )
        assert "List should have at most 50 items" in str(exc_info.value)
    
    def test_annotation_sync_request(self):
        """Test AnnotationSyncRequest schema"""
        # Without last_sync
        data = {
            "document_id": "123e4567-e89b-12d3-a456-426614174000",
            "local_annotations": []
        }
        schema = AnnotationSyncRequest(**data)
        assert schema.document_id == data["document_id"]
        assert schema.last_sync is None
        assert schema.local_annotations == []
        
        # With last_sync
        now = datetime.now()
        data_with_sync = {
            "document_id": "123e4567-e89b-12d3-a456-426614174000",
            "last_sync": now,
            "local_annotations": []
        }
        schema = AnnotationSyncRequest(**data_with_sync)
        assert schema.last_sync == now
    
    def test_annotation_sync_response(self):
        """Test AnnotationSyncResponse schema"""
        now = datetime.now()
        data = {
            "server_annotations": [],
            "conflicts": [],
            "sync_timestamp": now
        }
        schema = AnnotationSyncResponse(**data)
        assert schema.server_annotations == []
        assert schema.conflicts == []
        assert schema.sync_timestamp == now


class TestSchemaIntegration:
    """Test schema integration and edge cases"""
    
    def test_coordinate_boundary_values(self):
        """Test coordinate boundary values"""
        base_data = {
            "page": 1,
            "content": "Test annotation"
        }
        
        # Test boundary values for coordinates
        boundary_tests = [
            (0.0, 0.0),      # Bottom-left corner
            (100.0, 100.0),  # Top-right corner
            (0.0, 100.0),    # Top-left corner
            (100.0, 0.0),    # Bottom-right corner
            (50.0, 50.0),    # Center
        ]
        
        for x_percent, y_percent in boundary_tests:
            data = {**base_data, "x_percent": x_percent, "y_percent": y_percent}
            schema = AnnotationBase(**data)
            assert schema.x_percent == x_percent
            assert schema.y_percent == y_percent
    
    def test_content_length_boundaries(self):
        """Test content length boundary values"""
        base_data = {
            "page": 1,
            "x_percent": 50.0,
            "y_percent": 50.0
        }
        
        # Minimum length (1 character)
        data = {**base_data, "content": "a"}
        schema = AnnotationBase(**data)
        assert schema.content == "a"
        
        # Maximum length (5000 characters)
        max_content = "a" * 5000
        data = {**base_data, "content": max_content}
        schema = AnnotationBase(**data)
        assert len(schema.content) == 5000