"""
Test cases for the extended annotation API with document and image annotation types
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.database.connection import Base, get_db
from app.models.document import Document
from app.models.annotation import Annotation
from main import app

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_annotations.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def test_db():
    """Create test database and tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_document(test_db):
    """Create a test document"""
    db = TestingSessionLocal()
    doc = Document(
        id=str(uuid.uuid4()),
        filename="test_doc.pdf",
        original_filename="test_doc.pdf",
        mime_type="application/pdf",
        file_size=1024,
        file_path="/uploads/test_doc.pdf"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    doc_id = doc.id
    db.close()
    return doc_id


class TestDocumentAnnotationAPI:
    """Test document annotation endpoints"""
    
    def test_create_document_annotation(self, test_document):
        """Test creating a document annotation"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.5,
                "y_percent": 75.25,
                "content": "This is a document annotation"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["annotation_type"] == "document"
        assert data["page"] == 1
        assert data["x_percent"] == 50.5
        assert data["y_percent"] == 75.25
        assert data["content"] == "This is a document annotation"
        assert data["x_pixel"] is None
        assert data["y_pixel"] is None
        assert data["color"] is None
    
    def test_create_document_annotation_missing_fields(self, test_document):
        """Test creating document annotation with missing required fields"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                # Missing x_percent and y_percent
                "content": "This should fail"
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_document_annotation_invalid_coordinates(self, test_document):
        """Test creating document annotation with invalid coordinates"""
        # Test x_percent > 100
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 101.0,
                "y_percent": 50.0,
                "content": "Invalid coordinates"
            }
        )
        assert response.status_code == 422
        
        # Test negative y_percent
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.0,
                "y_percent": -1.0,
                "content": "Invalid coordinates"
            }
        )
        assert response.status_code == 422


class TestImageAnnotationAPI:
    """Test image annotation endpoints"""
    
    def test_create_image_annotation(self, test_document):
        """Test creating an image annotation"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 320,
                "y_pixel": 480,
                "color": "#FF5733",
                "content": "This is an image annotation"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["annotation_type"] == "image"
        assert data["x_pixel"] == 320
        assert data["y_pixel"] == 480
        assert data["color"] == "#FF5733"
        assert data["content"] == "This is an image annotation"
        assert data["page"] is None
        assert data["x_percent"] is None
        assert data["y_percent"] is None
    
    def test_create_image_annotation_without_color(self, test_document):
        """Test creating image annotation without color (optional field)"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                "y_pixel": 200,
                "content": "No color annotation"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["color"] is None
    
    def test_create_image_annotation_invalid_color(self, test_document):
        """Test creating image annotation with invalid color format"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                "y_pixel": 200,
                "color": "red",  # Invalid format
                "content": "Invalid color"
            }
        )
        
        assert response.status_code == 422
    
    def test_create_image_annotation_missing_fields(self, test_document):
        """Test creating image annotation with missing required fields"""
        response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                # Missing y_pixel
                "content": "This should fail"
            }
        )
        
        assert response.status_code == 422


class TestAnnotationFiltering:
    """Test annotation filtering by type and page"""
    
    def test_filter_by_annotation_type(self, test_document):
        """Test filtering annotations by type"""
        # Create one document annotation
        client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.0,
                "y_percent": 50.0,
                "content": "Document annotation"
            }
        )
        
        # Create one image annotation
        client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                "y_pixel": 200,
                "content": "Image annotation"
            }
        )
        
        # Get all annotations
        response = client.get(f"/api/annotations/{test_document}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        
        # Filter by document type
        response = client.get(f"/api/annotations/{test_document}?annotation_type=document")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["annotations"][0]["annotation_type"] == "document"
        
        # Filter by image type
        response = client.get(f"/api/annotations/{test_document}?annotation_type=image")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["annotations"][0]["annotation_type"] == "image"
    
    def test_filter_by_page(self, test_document):
        """Test filtering document annotations by page"""
        # Create annotations on different pages
        for page in [1, 2, 3]:
            client.post(
                "/api/annotations",
                json={
                    "annotation_type": "document",
                    "document_id": test_document,
                    "page": page,
                    "x_percent": 50.0,
                    "y_percent": 50.0,
                    "content": f"Page {page} annotation"
                }
            )
        
        # Filter by page 2
        response = client.get(f"/api/annotations/{test_document}?page=2")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["annotations"][0]["page"] == 2


class TestAnnotationUpdate:
    """Test annotation update functionality"""
    
    def test_update_document_annotation(self, test_document):
        """Test updating a document annotation"""
        # Create annotation
        create_response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.0,
                "y_percent": 50.0,
                "content": "Original content"
            }
        )
        annotation_id = create_response.json()["id"]
        
        # Update content
        update_response = client.put(
            f"/api/annotations/{annotation_id}",
            json={"content": "Updated content"}
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["content"] == "Updated content"
    
    def test_update_image_annotation_color(self, test_document):
        """Test updating image annotation color"""
        # Create annotation
        create_response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                "y_pixel": 200,
                "color": "#FF0000",
                "content": "Red annotation"
            }
        )
        annotation_id = create_response.json()["id"]
        
        # Update color
        update_response = client.put(
            f"/api/annotations/{annotation_id}",
            json={"color": "#00FF00"}
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["color"] == "#00FF00"
    
    def test_cannot_update_document_annotation_with_pixel_coords(self, test_document):
        """Test that document annotations cannot be updated with pixel coordinates"""
        # Create document annotation
        create_response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.0,
                "y_percent": 50.0,
                "content": "Document annotation"
            }
        )
        annotation_id = create_response.json()["id"]
        
        # Try to update with pixel coordinates
        update_response = client.put(
            f"/api/annotations/{annotation_id}",
            json={"x_pixel": 100, "y_pixel": 200}
        )
        
        assert update_response.status_code == 400
        assert "Cannot update pixel coordinates on document annotation" in update_response.json()["detail"]
    
    def test_cannot_update_image_annotation_with_page_coords(self, test_document):
        """Test that image annotations cannot be updated with page/percentage coordinates"""
        # Create image annotation
        create_response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "image",
                "document_id": test_document,
                "x_pixel": 100,
                "y_pixel": 200,
                "content": "Image annotation"
            }
        )
        annotation_id = create_response.json()["id"]
        
        # Try to update with page coordinates
        update_response = client.put(
            f"/api/annotations/{annotation_id}",
            json={"page": 1, "x_percent": 50.0}
        )
        
        assert update_response.status_code == 400
        assert "Cannot update page/percentage coordinates on image annotation" in update_response.json()["detail"]


class TestAnnotationDelete:
    """Test annotation deletion"""
    
    def test_delete_annotation(self, test_document):
        """Test deleting an annotation"""
        # Create annotation
        create_response = client.post(
            "/api/annotations",
            json={
                "annotation_type": "document",
                "document_id": test_document,
                "page": 1,
                "x_percent": 50.0,
                "y_percent": 50.0,
                "content": "To be deleted"
            }
        )
        annotation_id = create_response.json()["id"]
        
        # Delete annotation
        delete_response = client.delete(f"/api/annotations/{annotation_id}")
        assert delete_response.status_code == 204
        
        # Verify it's deleted
        get_response = client.get(f"/api/annotations/single/{annotation_id}")
        assert get_response.status_code == 404
