import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService, AnnotationDatabase, db } from '../database';
import type { DocumentMetadata, Annotation } from '../../contexts/AppContext';

// Mock data
const mockDocument: DocumentMetadata = {
  id: 'doc-1',
  filename: 'test.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  uploadedAt: new Date('2023-01-01'),
};

const mockAnnotation: Annotation = {
  id: 'ann-1',
  documentId: 'doc-1',
  page: 1,
  xPercent: 50,
  yPercent: 50,
  content: 'Test annotation',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

describe('DatabaseService', () => {
  beforeEach(async () => {
    // Clear all data before each test
    try {
      await db.open();
      await DatabaseService.clearAllData();
    } catch (error) {
      // Database might already be open, that's fine
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await DatabaseService.clearAllData();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Document operations', () => {
    it('should add a document', async () => {
      await DatabaseService.addDocument(mockDocument);
      
      const documents = await DatabaseService.getAllDocuments();
      expect(documents).toHaveLength(1);
      expect(documents[0].id).toBe(mockDocument.id);
      expect(documents[0].filename).toBe(mockDocument.filename);
      expect(documents[0].syncStatus).toBe('pending');
    });

    it('should get a document by id', async () => {
      await DatabaseService.addDocument(mockDocument);
      
      const document = await DatabaseService.getDocument(mockDocument.id);
      expect(document).toBeDefined();
      expect(document!.id).toBe(mockDocument.id);
      expect(document!.filename).toBe(mockDocument.filename);
    });

    it('should return undefined for non-existent document', async () => {
      const document = await DatabaseService.getDocument('non-existent');
      expect(document).toBeUndefined();
    });

    it('should get all documents ordered by upload date', async () => {
      const doc1 = { ...mockDocument, id: 'doc-1', uploadedAt: new Date('2023-01-01') };
      const doc2 = { ...mockDocument, id: 'doc-2', uploadedAt: new Date('2023-01-02') };
      
      await DatabaseService.addDocument(doc1);
      await DatabaseService.addDocument(doc2);
      
      const documents = await DatabaseService.getAllDocuments();
      expect(documents).toHaveLength(2);
      // Should be ordered by uploadedAt descending (newest first)
      expect(documents[0].id).toBe('doc-2');
      expect(documents[1].id).toBe('doc-1');
    });

    it('should update a document', async () => {
      await DatabaseService.addDocument(mockDocument);
      
      await DatabaseService.updateDocument(mockDocument.id, { 
        syncStatus: 'synced',
        lastSyncAt: new Date('2023-01-02')
      });
      
      const document = await DatabaseService.getDocument(mockDocument.id);
      expect(document!.syncStatus).toBe('synced');
      expect(document!.lastSyncAt).toEqual(new Date('2023-01-02'));
    });

    it('should delete a document and its annotations', async () => {
      await DatabaseService.addDocument(mockDocument);
      await DatabaseService.addAnnotation(mockAnnotation);
      
      // Verify document and annotation exist
      expect(await DatabaseService.getDocument(mockDocument.id)).toBeDefined();
      expect(await DatabaseService.getAnnotation(mockAnnotation.id)).toBeDefined();
      
      await DatabaseService.deleteDocument(mockDocument.id);
      
      // Verify both document and annotation are deleted
      expect(await DatabaseService.getDocument(mockDocument.id)).toBeUndefined();
      expect(await DatabaseService.getAnnotation(mockAnnotation.id)).toBeUndefined();
    });
  });

  describe('Annotation operations', () => {
    beforeEach(async () => {
      // Add a document for annotation tests
      await DatabaseService.addDocument(mockDocument);
    });

    it('should add an annotation', async () => {
      await DatabaseService.addAnnotation(mockAnnotation);
      
      const annotations = await DatabaseService.getAnnotationsByDocument(mockDocument.id);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].id).toBe(mockAnnotation.id);
      expect(annotations[0].content).toBe(mockAnnotation.content);
      expect(annotations[0].syncStatus).toBe('pending');
    });

    it('should get an annotation by id', async () => {
      await DatabaseService.addAnnotation(mockAnnotation);
      
      const annotation = await DatabaseService.getAnnotation(mockAnnotation.id);
      expect(annotation).toBeDefined();
      expect(annotation!.id).toBe(mockAnnotation.id);
      expect(annotation!.content).toBe(mockAnnotation.content);
    });

    it('should get annotations by document', async () => {
      const ann1 = { ...mockAnnotation, id: 'ann-1', page: 1 };
      const ann2 = { ...mockAnnotation, id: 'ann-2', page: 2 };
      
      await DatabaseService.addAnnotation(ann1);
      await DatabaseService.addAnnotation(ann2);
      
      const annotations = await DatabaseService.getAnnotationsByDocument(mockDocument.id);
      expect(annotations).toHaveLength(2);
    });

    it('should get annotations by document and page', async () => {
      const ann1 = { ...mockAnnotation, id: 'ann-1', page: 1 };
      const ann2 = { ...mockAnnotation, id: 'ann-2', page: 2 };
      
      await DatabaseService.addAnnotation(ann1);
      await DatabaseService.addAnnotation(ann2);
      
      const page1Annotations = await DatabaseService.getAnnotationsByDocumentAndPage(mockDocument.id, 1);
      expect(page1Annotations).toHaveLength(1);
      expect(page1Annotations[0].id).toBe('ann-1');
      
      const page2Annotations = await DatabaseService.getAnnotationsByDocumentAndPage(mockDocument.id, 2);
      expect(page2Annotations).toHaveLength(1);
      expect(page2Annotations[0].id).toBe('ann-2');
    });

    it('should update an annotation', async () => {
      await DatabaseService.addAnnotation(mockAnnotation);
      
      const updateTime = new Date();
      await DatabaseService.updateAnnotation(mockAnnotation.id, { 
        content: 'Updated content'
      });
      
      const annotation = await DatabaseService.getAnnotation(mockAnnotation.id);
      expect(annotation!.content).toBe('Updated content');
      expect(annotation!.syncStatus).toBe('pending');
      expect(annotation!.updatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    it('should delete an annotation', async () => {
      await DatabaseService.addAnnotation(mockAnnotation);
      
      expect(await DatabaseService.getAnnotation(mockAnnotation.id)).toBeDefined();
      
      await DatabaseService.deleteAnnotation(mockAnnotation.id);
      
      expect(await DatabaseService.getAnnotation(mockAnnotation.id)).toBeUndefined();
    });
  });

  describe('Sync operations', () => {
    beforeEach(async () => {
      await DatabaseService.addDocument(mockDocument);
      await DatabaseService.addAnnotation(mockAnnotation);
    });

    it('should get pending documents', async () => {
      const pendingDocs = await DatabaseService.getPendingDocuments();
      expect(pendingDocs).toHaveLength(1);
      expect(pendingDocs[0].syncStatus).toBe('pending');
    });

    it('should get pending annotations', async () => {
      const pendingAnns = await DatabaseService.getPendingAnnotations();
      expect(pendingAnns).toHaveLength(1);
      expect(pendingAnns[0].syncStatus).toBe('pending');
    });

    it('should mark document as synced', async () => {
      const syncTime = new Date();
      await DatabaseService.markDocumentSynced(mockDocument.id);
      
      const document = await DatabaseService.getDocument(mockDocument.id);
      expect(document!.syncStatus).toBe('synced');
      expect(document!.lastSyncAt!.getTime()).toBeGreaterThanOrEqual(syncTime.getTime());
    });

    it('should mark annotation as synced', async () => {
      const syncTime = new Date();
      await DatabaseService.markAnnotationSynced(mockAnnotation.id);
      
      const annotation = await DatabaseService.getAnnotation(mockAnnotation.id);
      expect(annotation!.syncStatus).toBe('synced');
      expect(annotation!.lastSyncAt!.getTime()).toBeGreaterThanOrEqual(syncTime.getTime());
    });

    it('should mark document sync error', async () => {
      await DatabaseService.markDocumentSyncError(mockDocument.id);
      
      const document = await DatabaseService.getDocument(mockDocument.id);
      expect(document!.syncStatus).toBe('error');
    });

    it('should mark annotation sync error', async () => {
      await DatabaseService.markAnnotationSyncError(mockAnnotation.id);
      
      const annotation = await DatabaseService.getAnnotation(mockAnnotation.id);
      expect(annotation!.syncStatus).toBe('error');
    });
  });

  describe('Utility operations', () => {
    it('should get storage statistics', async () => {
      await DatabaseService.addDocument(mockDocument);
      await DatabaseService.addAnnotation(mockAnnotation);
      
      const stats = await DatabaseService.getStorageStats();
      expect(stats.documentCount).toBe(1);
      expect(stats.annotationCount).toBe(1);
      expect(stats.pendingDocuments).toBe(1);
      expect(stats.pendingAnnotations).toBe(1);
    });

    it('should clear all data', async () => {
      await DatabaseService.addDocument(mockDocument);
      await DatabaseService.addAnnotation(mockAnnotation);
      
      // Verify data exists
      expect(await DatabaseService.getAllDocuments()).toHaveLength(1);
      expect(await DatabaseService.getAnnotationsByDocument(mockDocument.id)).toHaveLength(1);
      
      await DatabaseService.clearAllData();
      
      // Verify data is cleared
      expect(await DatabaseService.getAllDocuments()).toHaveLength(0);
      expect(await DatabaseService.getAnnotationsByDocument(mockDocument.id)).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      // Close the database to simulate error conditions
      await db.close();
      
      // These operations should throw errors
      await expect(DatabaseService.addDocument(mockDocument)).rejects.toThrow();
      await expect(DatabaseService.getDocument(mockDocument.id)).rejects.toThrow();
      await expect(DatabaseService.getAllDocuments()).rejects.toThrow();
      
      // Reopen for other tests
      await db.open();
    });
  });

  describe('Database initialization', () => {
    it('should create database with correct schema', () => {
      expect(db.documents).toBeDefined();
      expect(db.annotations).toBeDefined();
      expect(db.name).toBe('AnnotationDatabase');
    });

    it('should handle version upgrades', async () => {
      // This test verifies the database can be opened and has the expected structure
      await db.open();
      
      const tables = db.tables;
      expect(tables).toHaveLength(2);
      expect(tables.map(t => t.name)).toContain('documents');
      expect(tables.map(t => t.name)).toContain('annotations');
    });
  });
});