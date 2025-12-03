"""
Database connection and session management.

This module provides SQLAlchemy engine, session factory, and base model class
for the document annotation system.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator
import logging

from shared.config.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Configure connection arguments based on database type
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Create SQLAlchemy engine with production-ready configuration
engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.debug,  # Log SQL queries in debug mode
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent lazy loading issues after commit
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency to get database session.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    
    Imports all models to ensure they are registered with SQLAlchemy
    before creating tables.
    
    Raises:
        Exception: If database initialization fails
    """
    try:
        # Import all models to register them with Base
        from modules.annotation.model import Annotation
        from modules.documents.model import Document
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created successfully")
        
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
        raise