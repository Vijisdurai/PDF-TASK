import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base, get_db
from app.models import Document, Annotation


@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test function"""
    # Use in-memory SQLite database for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_document_data():
    """Sample document data for testing"""
    return {
        "filename": "test_document.pdf",
        "original_filename": "original_test_document.pdf",
        "mime_type": "application/pdf",
        "file_size": 1024000,
        "file_path": "/uploads/test_document.pdf",
        "converted_path": None
    }


@pytest.fixture
def sample_annotation_data():
    """Sample annotation data for testing"""
    return {
        "page": 1,
        "x_percent": 50.5,
        "y_percent": 75.25,
        "content": "This is a test annotation"
    }