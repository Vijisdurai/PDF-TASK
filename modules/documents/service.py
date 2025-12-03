from sqlalchemy.orm import Session
from typing import Optional, List
from fastapi import HTTPException, status
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from modules.documents.model import Document
from modules.documents.schema import DocumentCreate, DocumentUpdate


class DocumentService:
    """Service class for document operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_document(self, document_data: DocumentCreate) -> Document:
        """Create a new document record"""
        try:
            db_document = Document(
                filename=document_data.filename,
                original_filename=document_data.original_filename,
                mime_type=document_data.mime_type,
                file_size=document_data.file_size,
                file_path=document_data.file_path,
                converted_path=document_data.converted_path
            )
            
            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)
            
            return db_document
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create document: {str(e)}"
            )
    
    def get_document(self, document_id: str) -> Optional[Document]:
        """Get document by ID"""
        return self.db.query(Document).filter(Document.id == document_id).first()
    
    def get_documents(self, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get list of documents with pagination"""
        return self.db.query(Document).offset(skip).limit(limit).all()
    
    def get_document_by_original_filename(self, original_filename: str) -> Optional[Document]:
        """Check if a document with the same original filename exists"""
        return self.db.query(Document).filter(Document.original_filename == original_filename).first()
    
    def update_document(self, document_id: str, document_data: DocumentUpdate) -> Optional[Document]:
        """Update document metadata"""
        try:
            db_document = self.get_document(document_id)
            if not db_document:
                return None
            
            update_data = document_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_document, field, value)
            
            self.db.commit()
            self.db.refresh(db_document)
            
            return db_document
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update document: {str(e)}"
            )
    
    def update_converted_path(self, document_id: str, converted_path: str) -> Optional[Document]:
        """Update the converted file path for a document"""
        try:
            db_document = self.get_document(document_id)
            if not db_document:
                return None
            
            db_document.converted_path = converted_path
            self.db.commit()
            self.db.refresh(db_document)
            
            return db_document
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update converted path: {str(e)}"
            )
    
    def delete_document(self, document_id: str) -> bool:
        """Delete document and its file"""
        try:
            db_document = self.get_document(document_id)
            if not db_document:
                return False
            
            # Delete files from disk
            import os
            if os.path.exists(db_document.file_path):
                os.remove(db_document.file_path)
            
            if db_document.converted_path and os.path.exists(db_document.converted_path):
                os.remove(db_document.converted_path)
            
            # Delete from database
            self.db.delete(db_document)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete document: {str(e)}"
            )