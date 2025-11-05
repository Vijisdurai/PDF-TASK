import os
import subprocess
import asyncio
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, status

from app.core.config import settings


class ConversionService:
    """Service for converting documents to PDF using LibreOffice headless"""
    
    def __init__(self):
        self.conversion_dir = os.path.join(settings.upload_dir, "converted")
        os.makedirs(self.conversion_dir, exist_ok=True)
    
    async def convert_to_pdf(self, input_path: str, original_filename: str) -> str:
        """
        Convert DOC/DOCX file to PDF using LibreOffice headless mode
        
        Args:
            input_path: Path to the input file
            original_filename: Original filename for generating output name
            
        Returns:
            Path to the converted PDF file
            
        Raises:
            HTTPException: If conversion fails
        """
        try:
            # Validate input file exists
            if not os.path.exists(input_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Input file not found for conversion"
                )
            
            # Generate output filename
            base_name = Path(original_filename).stem
            output_filename = f"{base_name}_{uuid.uuid4().hex[:8]}.pdf"
            output_path = os.path.join(self.conversion_dir, output_filename)
            
            # Create temporary directory for LibreOffice
            temp_dir = os.path.join(self.conversion_dir, f"temp_{uuid.uuid4().hex[:8]}")
            os.makedirs(temp_dir, exist_ok=True)
            
            try:
                # Run LibreOffice conversion
                await self._run_libreoffice_conversion(input_path, temp_dir)
                
                # Find the generated PDF file
                converted_file = self._find_converted_pdf(temp_dir, base_name)
                if not converted_file:
                    raise Exception("LibreOffice conversion completed but no PDF file was generated")
                
                # Move the converted file to final location
                os.rename(converted_file, output_path)
                
                return output_path
                
            finally:
                # Clean up temporary directory
                self._cleanup_directory(temp_dir)
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": {
                        "code": "CONVERSION_FAILED",
                        "message": f"Failed to convert document to PDF: {str(e)}",
                        "details": {"original_filename": original_filename}
                    }
                }
            )
    
    async def _run_libreoffice_conversion(self, input_path: str, output_dir: str) -> None:
        """Run LibreOffice headless conversion"""
        try:
            # LibreOffice command for headless conversion
            cmd = [
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", output_dir,
                input_path
            ]
            
            # Run the conversion with timeout
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60.0)
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                raise Exception("LibreOffice conversion timed out after 60 seconds")
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown LibreOffice error"
                raise Exception(f"LibreOffice conversion failed: {error_msg}")
                
        except FileNotFoundError:
            raise Exception(
                "LibreOffice not found. Please install LibreOffice for document conversion. "
                "On Ubuntu/Debian: sudo apt-get install libreoffice"
            )
    
    def _find_converted_pdf(self, temp_dir: str, base_name: str) -> Optional[str]:
        """Find the converted PDF file in the temporary directory"""
        # LibreOffice typically generates files with the same base name
        expected_pdf = os.path.join(temp_dir, f"{base_name}.pdf")
        if os.path.exists(expected_pdf):
            return expected_pdf
        
        # Fallback: look for any PDF file in the directory
        for file in os.listdir(temp_dir):
            if file.endswith('.pdf'):
                return os.path.join(temp_dir, file)
        
        return None
    
    def _cleanup_directory(self, directory: str) -> None:
        """Recursively remove directory and all contents"""
        try:
            import shutil
            if os.path.exists(directory):
                shutil.rmtree(directory)
        except Exception as e:
            # Log cleanup error but don't fail the conversion
            print(f"Warning: Failed to cleanup temporary directory {directory}: {str(e)}")
    
    def is_conversion_supported(self, mime_type: str) -> bool:
        """Check if the given MIME type supports conversion to PDF"""
        supported_types = [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]
        return mime_type in supported_types
    
    def get_converted_file_path(self, document_id: str, original_filename: str) -> str:
        """Generate the expected path for a converted file"""
        base_name = Path(original_filename).stem
        return os.path.join(self.conversion_dir, f"{base_name}_{document_id}.pdf")