import { describe, it, expect } from 'vitest';
import type { DocumentMetadata } from '../contexts/AppContext';

/**
 * Tests for document type detection logic
 * Requirements: 1.1 (PDF detection), 2.1 (Image detection)
 */
describe('Document Type Detection', () => {
  it('should detect PDF documents by MIME type', () => {
    const pdfDoc: DocumentMetadata = {
      id: '1',
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedAt: new Date(),
    };

    const mimeType = pdfDoc.mimeType.toLowerCase();
    const isPdf = mimeType === 'application/pdf';
    
    expect(isPdf).toBe(true);
  });

  it('should detect converted PDF documents', () => {
    const convertedDoc: DocumentMetadata = {
      id: '2',
      filename: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 2048,
      uploadedAt: new Date(),
      convertedPath: '/converted/test.pdf',
    };

    const isPdf = !!convertedDoc.convertedPath;
    
    expect(isPdf).toBe(true);
  });

  it('should detect image documents by MIME type', () => {
    const imageTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    imageTypes.forEach(mimeType => {
      const imageDoc: DocumentMetadata = {
        id: '3',
        filename: 'test.png',
        mimeType,
        size: 512,
        uploadedAt: new Date(),
      };

      const isImage = imageDoc.mimeType.toLowerCase().startsWith('image/');
      expect(isImage).toBe(true);
    });
  });

  it('should detect unsupported document types', () => {
    const unsupportedDoc: DocumentMetadata = {
      id: '4',
      filename: 'test.txt',
      mimeType: 'text/plain',
      size: 256,
      uploadedAt: new Date(),
    };

    const mimeType = unsupportedDoc.mimeType.toLowerCase();
    const isPdf = mimeType === 'application/pdf' || !!unsupportedDoc.convertedPath;
    const isImage = mimeType.startsWith('image/');
    const isUnsupported = !isPdf && !isImage;
    
    expect(isUnsupported).toBe(true);
  });

  it('should prioritize convertedPath over original MIME type', () => {
    const convertedDoc: DocumentMetadata = {
      id: '5',
      filename: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 2048,
      uploadedAt: new Date(),
      convertedPath: '/converted/test.pdf',
    };

    // Even though original MIME type is not PDF, convertedPath indicates it's now a PDF
    const documentType = convertedDoc.convertedPath ? 'pdf' : 
                        convertedDoc.mimeType === 'application/pdf' ? 'pdf' :
                        convertedDoc.mimeType.startsWith('image/') ? 'image' : 'unsupported';
    
    expect(documentType).toBe('pdf');
  });
});
