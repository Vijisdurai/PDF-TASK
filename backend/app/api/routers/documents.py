from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from pathlib import Path

from app.database.connection import get_db
from app.schemas.document import DocumentResponse, DocumentCreate, DocumentMetadata
from app.models.document import Document
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/health")
async def health_check():
    """Health check endpoint for document service"""
    return {"status": "healthy", "service": "documents"}

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document with validation and optional conversion.
    Supports PDF, DOC, DOCX, PNG, JPG, JPEG formats.
    """
    try:
        # Validate file type
        if file.content_type not in settings.allowed_file_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_FILE_TYPE",
                        "message": f"Unsupported file format: {file.content_type}",
                        "details": {"supported_types": settings.allowed_file_types}
                    }
                }
            )
        
        # Validate file size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > settings.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail={
                    "error": {
                        "code": "FILE_TOO_LARGE",
                        "message": f"File size exceeds maximum allowed size of {settings.max_file_size} bytes",
                        "details": {"max_size_mb": settings.max_file_size // (1024 * 1024)}
                    }
                }
            )
        
        # Validate filename
        if not file.filename or len(file.filename.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_FILENAME",
                        "message": "Filename cannot be empty",
                        "details": {}
                    }
                }
            )
        
        # Generate unique filename and save file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.upload_dir, unique_filename)
        
        # Ensure upload directory exists
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Create document record
        document_service = DocumentService(db)
        document_data = DocumentCreate(
            filename=unique_filename,
            original_filename=file.filename,
            mime_type=file.content_type,
            file_size=file_size,
            file_path=file_path
        )
        
        document = document_service.create_document(document_data)
        
        # If it's a DOC/DOCX file, trigger conversion
        if file.content_type in [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]:
            try:
                conversion_service = ConversionService()
                # Use original filename for better PDF naming
                converted_path = await conversion_service.convert_to_pdf(file_path, file.filename)
                document = document_service.update_converted_path(document.id, converted_path)
            except Exception as e:
                # Log conversion error but don't fail the upload
                print(f"Conversion failed for {file.filename}: {str(e)}")
                # You can still view the original file, but PDF features won't be available
        
        return document
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up uploaded file if something went wrong
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "UPLOAD_FAILED",
                    "message": "Failed to upload document",
                    "details": {"error": str(e)}
                }
            }
        )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Get document metadata by ID"""
    document_service = DocumentService(db)
    document = document_service.get_document(document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "DOCUMENT_NOT_FOUND",
                    "message": f"Document with ID {document_id} not found",
                    "details": {}
                }
            }
        )
    
    return document

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Stream document file content"""
    from fastapi.responses import FileResponse, JSONResponse
    
    document_service = DocumentService(db)
    document = document_service.get_document(document_id)
    
    if not document:
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "code": "DOCUMENT_NOT_FOUND",
                    "message": "Document not found", 
                    "document_id": document_id
                }
            },
            headers={"Content-Type": "application/json"}
        )
    
    # Determine which file to serve (converted PDF if available, otherwise original)
    file_path = document.converted_path if document.converted_path else document.file_path
    
    if not os.path.exists(file_path):
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "code": "FILE_NOT_FOUND",
                    "message": "File not found on disk", 
                    "path": file_path
                }
            },
            headers={"Content-Type": "application/json"}
        )
    
    # Validate file size
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "EMPTY_FILE",
                    "message": "File is empty",
                    "path": file_path
                }
            },
            headers={"Content-Type": "application/json"}
        )
    
    # For PDF files, validate PDF signature
    if file_path.endswith(".pdf"):
        try:
            with open(file_path, 'rb') as f:
                header = f.read(5)
                if header != b'%PDF-':
                    return JSONResponse(
                        status_code=500,
                        content={
                            "error": {
                                "code": "INVALID_PDF",
                                "message": "File is not a valid PDF",
                                "path": file_path
                            }
                        },
                        headers={"Content-Type": "application/json"}
                    )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "FILE_READ_ERROR",
                        "message": f"Cannot read file: {str(e)}",
                        "path": file_path
                    }
                },
                headers={"Content-Type": "application/json"}
            )
    
    # Detect MIME type dynamically
    if file_path.endswith(".pdf"):
        content_type = "application/pdf"
        filename = f"{Path(document.original_filename).stem}.pdf"
    else:
        content_type = document.mime_type
        filename = document.original_filename
    
    # Return a binary FileResponse for proper PDF streaming
    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=filename,
        headers={
            "Cache-Control": "no-store, must-revalidate",
            "Content-Disposition": f'inline; filename="{filename}"',
        }
    )

@router.get("/", response_model=List[DocumentMetadata])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of documents with pagination"""
    if limit > 100:
        limit = 100  # Prevent excessive data retrieval
    
    document_service = DocumentService(db)
    documents = document_service.get_documents(skip=skip, limit=limit)
    
    return documents

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Delete document and its files"""
    document_service = DocumentService(db)
    
    if not document_service.delete_document(document_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "DOCUMENT_NOT_FOUND",
                    "message": f"Document with ID {document_id} not found",
                    "details": {}
                }
            }
        )
    
    return {"success": True, "message": "Document deleted successfully"}