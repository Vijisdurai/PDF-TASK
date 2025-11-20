import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DocumentMetadata, Annotation, DocumentAnnotation, ImageAnnotation } from '../contexts/AppContext';

// Extend the interfaces for IndexedDB storage
export interface StoredDocument extends DocumentMetadata {
  // Additional fields for offline storage
  localPath?: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

// Base stored annotation with sync fields
interface StoredAnnotationBase {
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

// Stored document annotation
export interface StoredDocumentAnnotation extends DocumentAnnotation, StoredAnnotationBase {}

// Stored image annotation
export interface StoredImageAnnotation extends ImageAnnotation, StoredAnnotationBase {}

// Union type for stored annotations
export type StoredAnnotation = StoredDocumentAnnotation | StoredImageAnnotation;

// Type guards for annotation discrimination
export function isDocumentAnnotation(annotation: Annotation): annotation is DocumentAnnotation {
  return annotation.type === 'document';
}

export function isImageAnnotation(annotation: Annotation): annotation is ImageAnnotation {
  return annotation.type === 'image';
}

// Define the database schema
export class AnnotationDatabase extends Dexie {
  // Declare tables
  documents!: Table<StoredDocument>;
  annotations!: Table<StoredAnnotation>;

  constructor() {
    super('AnnotationDatabase');
    
    // Version 1 schema (original)
    this.version(1).stores({
      documents: 'id, filename, originalFilename, mimeType, uploadedAt, syncStatus',
      annotations: 'id, documentId, page, [documentId+page], createdAt, syncStatus'
    });

    // Version 2 schema (add support for image annotations)
    this.version(2).stores({
      documents: 'id, filename, originalFilename, mimeType, uploadedAt, syncStatus',
      annotations: 'id, documentId, page, type, [documentId+page], [documentId+type], createdAt, syncStatus'
    }).upgrade(tx => {
      // Migration logic: set annotation_type = 'document' for existing annotations
      return tx.table('annotations').toCollection().modify(annotation => {
        if (!annotation.type) {
          annotation.type = 'document';
        }
      });
    });
  }
}

// Create database instance
export const db = new AnnotationDatabase();

// Database service class for CRUD operations
export class DatabaseService {
  // Document operations
  static async addDocument(document: DocumentMetadata): Promise<void> {
    try {
      const storedDocument: StoredDocument = {
        ...document,
        syncStatus: 'pending',
      };
      
      // Log the document being saved for debugging
      console.log('Saving document to Dexie:', storedDocument);
      
      // Ensure the document has an ID
      if (!storedDocument.id) {
        throw new Error('Document ID is required but missing');
      }
      
      await db.documents.add(storedDocument);
      console.log('Document saved successfully to Dexie');
    } catch (error) {
      console.error('Failed to save document to Dexie:', error);
      throw error;
    }
  }

  static async getDocument(id: string): Promise<StoredDocument | undefined> {
    return await db.documents.get(id);
  }

  static async getAllDocuments(): Promise<StoredDocument[]> {
    return await db.documents.orderBy('uploadedAt').reverse().toArray();
  }

  static async updateDocument(id: string, changes: Partial<StoredDocument>): Promise<void> {
    await db.documents.update(id, changes);
  }

  static async deleteDocument(id: string): Promise<void> {
    // Delete document and all its annotations
    await db.transaction('rw', db.documents, db.annotations, async () => {
      await db.documents.delete(id);
      await db.annotations.where('documentId').equals(id).delete();
    });
  }

  // Annotation operations
  static async addAnnotation(annotation: Annotation): Promise<void> {
    // Validate annotation based on type
    if (isDocumentAnnotation(annotation)) {
      if (annotation.page === undefined || annotation.xPercent === undefined || annotation.yPercent === undefined) {
        throw new Error('Document annotations must have page, xPercent, and yPercent fields');
      }
    } else if (isImageAnnotation(annotation)) {
      if (annotation.xPixel === undefined || annotation.yPixel === undefined) {
        throw new Error('Image annotations must have xPixel and yPixel fields');
      }
    }

    const storedAnnotation: StoredAnnotation = {
      ...annotation,
      syncStatus: 'pending',
    };
    await db.annotations.add(storedAnnotation);
  }

  static async getAnnotation(id: string): Promise<StoredAnnotation | undefined> {
    return await db.annotations.get(id);
  }

  static async getAnnotationsByDocument(
    documentId: string, 
    type?: 'document' | 'image'
  ): Promise<StoredAnnotation[]> {
    if (type) {
      return await db.annotations
        .where('[documentId+type]')
        .equals([documentId, type])
        .toArray();
    }
    return await db.annotations
      .where('documentId')
      .equals(documentId)
      .toArray();
  }

  static async getAnnotationsByDocumentAndType(
    documentId: string,
    type: 'document' | 'image'
  ): Promise<StoredAnnotation[]> {
    return await db.annotations
      .where('[documentId+type]')
      .equals([documentId, type])
      .toArray();
  }

  static async getAnnotationsByDocumentAndPage(
    documentId: string, 
    page: number
  ): Promise<StoredAnnotation[]> {
    return await db.annotations
      .where('[documentId+page]')
      .equals([documentId, page])
      .toArray();
  }

  static async updateAnnotation(id: string, changes: Partial<Annotation> & Partial<StoredAnnotationBase>): Promise<void> {
    // Get the existing annotation to validate type-specific updates
    const existing = await db.annotations.get(id);
    if (!existing) {
      throw new Error(`Annotation with id ${id} not found`);
    }

    await db.annotations.update(id, {
      ...changes,
      syncStatus: 'pending',
      updatedAt: new Date(),
    });
  }

  static async deleteAnnotation(id: string): Promise<void> {
    await db.annotations.delete(id);
  }

  // Sync operations
  static async getPendingDocuments(): Promise<StoredDocument[]> {
    return await db.documents.where('syncStatus').equals('pending').toArray();
  }

  static async getPendingAnnotations(): Promise<StoredAnnotation[]> {
    return await db.annotations.where('syncStatus').equals('pending').toArray();
  }

  static async markDocumentSynced(id: string): Promise<void> {
    await db.documents.update(id, {
      syncStatus: 'synced',
      lastSyncAt: new Date(),
    });
  }

  static async markAnnotationSynced(id: string): Promise<void> {
    await db.annotations.update(id, {
      syncStatus: 'synced',
      lastSyncAt: new Date(),
    });
  }

  static async markDocumentSyncError(id: string): Promise<void> {
    await db.documents.update(id, {
      syncStatus: 'error',
    });
  }

  static async markAnnotationSyncError(id: string): Promise<void> {
    await db.annotations.update(id, {
      syncStatus: 'error',
    });
  }

  // Utility operations
  static async clearAllData(): Promise<void> {
    await db.transaction('rw', db.documents, db.annotations, async () => {
      await db.documents.clear();
      await db.annotations.clear();
    });
  }

  static async getStorageStats(): Promise<{
    documentCount: number;
    annotationCount: number;
    pendingDocuments: number;
    pendingAnnotations: number;
  }> {
    const [documentCount, annotationCount, pendingDocuments, pendingAnnotations] = await Promise.all([
      db.documents.count(),
      db.annotations.count(),
      db.documents.where('syncStatus').equals('pending').count(),
      db.annotations.where('syncStatus').equals('pending').count(),
    ]);

    return {
      documentCount,
      annotationCount,
      pendingDocuments,
      pendingAnnotations,
    };
  }
}

// Initialize database and handle version upgrades
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Export database instance for direct access if needed
export default db;