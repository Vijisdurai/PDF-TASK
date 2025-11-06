// Working loadPDF() function example for PDFViewer.tsx
// This demonstrates the correct way to load PDFs after the fix

import { apiService } from '../services/api';

async function loadPDF(documentId: string) {
  try {
    console.log(`🔄 Loading PDF for document: ${documentId}`);
    
    // Get the correct API URL using the service
    const documentUrl = apiService.getDocumentFileUrl(documentId);
    console.log(`📡 Fetching from: ${documentUrl}`);
    
    // Fetch with proper headers and error handling
    const response = await fetch(documentUrl, { 
      mode: "cors",
      headers: {
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    });
    
    if (!response.ok) {
      // Enhanced error handling
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use default error message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    // Verify Content-Type
    const contentType = response.headers.get("Content-Type");
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (!contentType?.includes("application/pdf")) {
      const text = await response.text();
      console.error("❌ Server returned non-PDF content:", text.slice(0, 200));
      throw new Error("Server returned non-PDF content");
    }

    // Get binary data and create blob URL
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📊 PDF size: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error("Received empty file");
    }
    
    // Validate PDF signature
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
    
    if (uint8Array.length < 5 || !pdfSignature.every((byte, i) => uint8Array[i] === byte)) {
      throw new Error("File does not have a valid PDF signature");
    }

    // Load with PDF.js
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Reduce console warnings
    }).promise;

    console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);
    
    // Update component state
    setPdfDoc(pdf);
    setLoading(false);
    
    // Optional: Call onDocumentLoad callback
    if (onDocumentLoad) {
      onDocumentLoad(pdf.numPages);
    }
    
  } catch (error) {
    console.error('❌ Error loading PDF:', error);
    
    // Set user-friendly error message
    let errorMessage = 'Failed to display PDF — file may be missing or invalid.';
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('404') || message.includes('not found')) {
        errorMessage = 'Document not found';
      } else if (message.includes('500') || message.includes('server error')) {
        errorMessage = 'Server error while loading document';
      } else if (message.includes('network') || message.includes('fetch')) {
        errorMessage = 'Network error while loading document';
      }
    }
    
    setError(errorMessage);
    setLoading(false);
  }
}

// Alternative approach using the API service blob method:
async function loadPDFWithBlob(documentId: string) {
  try {
    console.log(`🔄 Loading PDF blob for document: ${documentId}`);
    
    // Use API service to get blob
    const blob = await apiService.getDocumentFile(documentId);
    console.log(`📊 Blob size: ${blob.size} bytes, type: ${blob.type}`);
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    console.log(`🔗 Created blob URL: ${url}`);
    
    // Load with PDF.js
    const pdf = await pdfjsLib.getDocument(url).promise;
    console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);
    
    // Update component state
    setPdfDoc(pdf);
    setLoading(false);
    
    // Clean up object URL when component unmounts
    return () => URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('❌ Error loading PDF blob:', error);
    setError(error instanceof Error ? error.message : 'Failed to load PDF');
    setLoading(false);
  }
}

export { loadPDF, loadPDFWithBlob };