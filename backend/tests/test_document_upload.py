import pytest
import os
import tempfile
import shutil
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch, AsyncMock

from app.database.connection import Base, get_db
from main import app


@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test function"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(test_db):
    """Create test client with test database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def temp_upload_dir():
    """Create temporary upload directory for testing"""
    temp_dir = tempfile.mkdtemp()
    
    # Patch the settings to use temp directory
    with patch('app.core.config.settings.upload_dir', temp_dir):
        yield temp_dir
    
    # Clean up
    shutil.rmtree(temp_dir, ignore_errors=True)


class TestDocumentUpload:
    """Test cases for document upload functionality"""
    
    def test_upload_pdf_success(self, client, temp_upload_dir):
        """Test successful PDF upload"""
        # Create a mock PDF file
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"
        
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", pdf_content, "application/pdf")}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["original_filename"] == "test.pdf"
        assert data["mime_type"] == "application/pdf"
        assert data["file_size"] == len(pdf_content)
        assert "id" in data
        assert "created_at" in data
    
    def test_upload_image_success(self, client, temp_upload_dir):
        """Test successful image upload"""
        # Create a minimal PNG file (1x1 pixel)
        png_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.png", png_content, "image/png")}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["original_filename"] == "test.png"
        assert data["mime_type"] == "image/png"
        assert data["file_size"] == len(png_content)
    
    @patch('app.services.conversion_service.ConversionService.convert_to_pdf')
    def test_upload_docx_with_conversion(self, mock_convert, client, temp_upload_dir):
        """Test DOCX upload with conversion to PDF"""
        # Mock the conversion service
        mock_convert.return_value = "/uploads/converted/test.pdf"
        
        # Create mock DOCX content
        docx_content = b"PK\x03\x04" + b"mock docx content" * 100
        
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.docx", docx_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["original_filename"] == "test.docx"
        assert data["mime_type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Verify conversion was attempted
        mock_convert.assert_called_once()
    
    def test_upload_invalid_file_type(self, client, temp_upload_dir):
        """Test upload with unsupported file type"""
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", b"text content", "text/plain")}
        )
        
        assert response.status_code == 400
        data = response.json()
        
        assert data["detail"]["error"]["code"] == "INVALID_FILE_TYPE"
        assert "Unsupported file format" in data["detail"]["error"]["message"]
    
    def test_upload_file_too_large(self, client, temp_upload_dir):
        """Test upload with file exceeding size limit"""
        # Create content larger than 100MB
        large_content = b"x" * (101 * 1024 * 1024)
        
        response = client.post(
            "/api/documents/upload",
            files={"file": ("large.pdf", large_content, "application/pdf")}
        )
        
        assert response.status_code == 413
        data = response.json()
        
        assert data["detail"]["error"]["code"] == "FILE_TOO_LARGE"
    
    def test_upload_empty_filename(self, client, temp_upload_dir):
        """Test upload with empty filename"""
        response = client.post(
            "/api/documents/upload",
            files={"file": ("", b"content", "application/pdf")}
        )
        
        # FastAPI returns 422 for validation errors, but our custom validation returns 400
        # Let's check if it's handled by our validation or FastAPI's
        assert response.status_code in [400, 422]
        
        if response.status_code == 400:
            data = response.json()
            assert data["detail"]["error"]["code"] == "INVALID_FILENAME"


class TestDocumentRetrieval:
    """Test cases for document retrieval functionality"""
    
    def test_get_document_success(self, client, temp_upload_dir):
        """Test successful document retrieval"""
        # First upload a document
        pdf_content = b"%PDF-1.4\ntest content"
        upload_response = client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", pdf_content, "application/pdf")}
        )
        
        assert upload_response.status_code == 201
        document_id = upload_response.json()["id"]
        
        # Then retrieve it
        response = client.get(f"/api/documents/{document_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == document_id
        assert data["original_filename"] == "test.pdf"
        assert data["mime_type"] == "application/pdf"
    
    def test_get_document_not_found(self, client):
        """Test retrieval of non-existent document"""
        response = client.get("/api/documents/nonexistent-id")
        
        assert response.status_code == 404
        data = response.json()
        
        assert data["detail"]["error"]["code"] == "DOCUMENT_NOT_FOUND"
    
    def test_get_document_file_success(self, client, temp_upload_dir):
        """Test successful document file streaming"""
        # Upload a document
        pdf_content = b"%PDF-1.4\ntest content"
        upload_response = client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", pdf_content, "application/pdf")}
        )
        
        assert upload_response.status_code == 201
        document_id = upload_response.json()["id"]
        
        # Get the file
        response = client.get(f"/api/documents/{document_id}/file")
        
        assert response.status_code == 200
        assert response.content == pdf_content
        assert response.headers["content-type"] == "application/pdf"
    
    def test_list_documents(self, client, temp_upload_dir):
        """Test document listing"""
        # Upload multiple documents
        for i in range(3):
            client.post(
                "/api/documents/upload",
                files={"file": (f"test{i}.pdf", b"content", "application/pdf")}
            )
        
        # List documents
        response = client.get("/api/documents/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 3
        assert all("id" in doc for doc in data)
    
    def test_delete_document_success(self, client, temp_upload_dir):
        """Test successful document deletion"""
        # Upload a document
        upload_response = client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", b"content", "application/pdf")}
        )
        
        assert upload_response.status_code == 201
        document_id = upload_response.json()["id"]
        
        # Delete the document
        response = client.delete(f"/api/documents/{document_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        
        # Verify it's deleted
        get_response = client.get(f"/api/documents/{document_id}")
        assert get_response.status_code == 404


class TestConversionFlow:
    """Test cases for document conversion functionality"""
    
    @patch('app.services.conversion_service.ConversionService._run_libreoffice_conversion')
    @patch('app.services.conversion_service.ConversionService._find_converted_pdf')
    def test_conversion_success(self, mock_find_pdf, mock_libreoffice, client, temp_upload_dir):
        """Test successful document conversion"""
        # Setup mocks
        converted_file = os.path.join(temp_upload_dir, "converted", "test.pdf")
        os.makedirs(os.path.dirname(converted_file), exist_ok=True)
        
        with open(converted_file, "wb") as f:
            f.write(b"%PDF-1.4\nconverted content")
        
        mock_find_pdf.return_value = converted_file
        mock_libreoffice.return_value = None
        
        # Upload DOC file
        doc_content = b"mock doc content" * 100
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.doc", doc_content, "application/msword")}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify conversion was triggered
        mock_libreoffice.assert_called_once()
        
        # Verify converted_path is set
        assert data["converted_path"] is not None
    
    @patch('app.services.conversion_service.ConversionService._run_libreoffice_conversion')
    def test_conversion_failure_handling(self, mock_libreoffice, client, temp_upload_dir):
        """Test handling of conversion failures"""
        # Make conversion fail
        mock_libreoffice.side_effect = Exception("LibreOffice not found")
        
        # Upload should still succeed even if conversion fails
        doc_content = b"mock doc content"
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.doc", doc_content, "application/msword")}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Document should be saved without converted_path
        assert data["converted_path"] is None