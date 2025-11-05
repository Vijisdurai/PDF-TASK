"""
Database initialization script
"""
import logging
from sqlalchemy import text

from app.database.connection import engine, init_db, SessionLocal
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database() -> None:
    """
    Create database tables and initial setup
    """
    try:
        logger.info("Creating database tables...")
        init_db()
        logger.info("Database tables created successfully!")
        
        # Test database connection
        with SessionLocal() as db:
            result = db.execute(text("SELECT 1"))
            logger.info("Database connection test successful!")
            
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise

def reset_database() -> None:
    """
    Drop and recreate all tables (use with caution!)
    """
    try:
        logger.warning("Dropping all database tables...")
        from app.database.connection import Base
        Base.metadata.drop_all(bind=engine)
        
        logger.info("Recreating database tables...")
        init_db()
        logger.info("Database reset completed successfully!")
        
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise

if __name__ == "__main__":
    create_database()