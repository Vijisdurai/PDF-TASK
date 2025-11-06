// Utility functions for PDF validation and error handling

export interface PDFValidationResult {
  isValid: boolean;
  error?: string;
  contentType?: string;
}

/**
 * Validates if a response contains a valid PDF
 */
export async function validatePDFResponse(response: Response): Promise<PDFValidationResult> {
  try {
    // Check HTTP status
    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf')) {
      // If it's JSON, it might be an error response
      if (contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          return {
            isValid: false,
            error: errorData.error || 'Server returned an error instead of PDF',
            contentType
          };
        } catch {
          return {
            isValid: false,
            error: 'Server returned non-PDF content',
            contentType
          };
        }
      }
      
      return {
        isValid: false,
        error: `Expected PDF but received ${contentType}`,
        contentType
      };
    }

    // Check if response body starts with PDF signature
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // PDF files start with "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2D)
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D];
    
    if (uint8Array.length < 5) {
      return {
        isValid: false,
        error: 'File is too small to be a valid PDF'
      };
    }

    for (let i = 0; i < pdfSignature.length; i++) {
      if (uint8Array[i] !== pdfSignature[i]) {
        return {
          isValid: false,
          error: 'File does not have a valid PDF signature'
        };
      }
    }

    return {
      isValid: true,
      contentType
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Fetches and validates a PDF from a URL
 */
export async function fetchAndValidatePDF(url: string): Promise<{
  isValid: boolean;
  arrayBuffer?: ArrayBuffer;
  error?: string;
}> {
  try {
    const response = await fetch(url);
    const validation = await validatePDFResponse(response.clone());
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      isValid: true,
      arrayBuffer
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to fetch PDF'
    };
  }
}

/**
 * Gets a user-friendly error message for PDF loading errors
 */
export function getPDFErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid pdf') || message.includes('pdf signature')) {
      return 'The document is not a valid PDF file';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'Document not found';
    }
    
    if (message.includes('500') || message.includes('server error')) {
      return 'Server error while loading document';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error while loading document';
    }
    
    return error.message;
  }

  return 'Failed to load PDF document';
}