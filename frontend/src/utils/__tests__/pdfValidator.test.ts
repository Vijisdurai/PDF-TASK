import { describe, it, expect, vi } from 'vitest';
import { validatePDFResponse, getPDFErrorMessage } from '../pdfValidator';

// Mock fetch for testing
global.fetch = vi.fn();

describe('PDF Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePDFResponse', () => {
    it('should validate a proper PDF response', async () => {
      // Create a mock PDF response with proper signature
      const pdfSignature = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]); // %PDF-1.4
      
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('application/pdf')
        },
        arrayBuffer: vi.fn().mockResolvedValue(pdfSignature.buffer),
        clone: vi.fn().mockReturnThis()
      } as any;

      const result = await validatePDFResponse(mockResponse);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PDF content type', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('text/html')
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        clone: vi.fn().mockReturnThis()
      } as any;

      const result = await validatePDFResponse(mockResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected PDF but received text/html');
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn().mockReturnValue('application/pdf')
        },
        clone: vi.fn().mockReturnThis()
      } as any;

      const result = await validatePDFResponse(mockResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('HTTP 404: Not Found');
    });

    it('should reject files without PDF signature', async () => {
      // Create a mock response with wrong signature
      const wrongSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG signature
      
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('application/pdf')
        },
        arrayBuffer: vi.fn().mockResolvedValue(wrongSignature.buffer),
        clone: vi.fn().mockReturnThis()
      } as any;

      const result = await validatePDFResponse(mockResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not have a valid PDF signature');
    });
  });

  describe('getPDFErrorMessage', () => {
    it('should return user-friendly messages for common errors', () => {
      expect(getPDFErrorMessage(new Error('Invalid PDF structure')))
        .toBe('The document is not a valid PDF file');
      
      expect(getPDFErrorMessage(new Error('HTTP 404: Not Found')))
        .toBe('Document not found');
      
      expect(getPDFErrorMessage(new Error('HTTP 500: Internal Server Error')))
        .toBe('Server error while loading document');
      
      expect(getPDFErrorMessage('Custom error message'))
        .toBe('Custom error message');
    });

    it('should handle unknown errors gracefully', () => {
      expect(getPDFErrorMessage(null))
        .toBe('Failed to load PDF document');
      
      expect(getPDFErrorMessage(undefined))
        .toBe('Failed to load PDF document');
    });
  });
});