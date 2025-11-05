import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DocumentMetadata, Annotation } from '../contexts/AppContext';

// Extend the interfaces for IndexedDB storage
export interface StoredDocument extends DocumentMetadata {
  // Additional fields for offline storage
  localPath?: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

export interface StoredAnnotation extends Annotation {
  // Additional fields for offline storage
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

// Define the database schema
export class AnnotationDatabase extends Dexie {
  // Declare tables
  documents!: Table<StoredDocument>;
  annotations!: Table<StoredAnnotation>;

  constructor() {
    super('AnnotationDatabase');
    
    // Define schemas
    this.version(1).stores({
      documents: 'id, filename, originalFilename, mimeType, uploadedAt, syncStatus',
      annotations: 'id, documentId, page, [documentId+page], createdAt, syncStatus'
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
    const storedAnnotation: StoredAnnotation = {
      ...annotation,
      syncStatus: 'pending',
    };
    await db.annotations.add(storedAnnotation);
  }

  static async getAnnotation(id: string): Promise<StoredAnnotation | undefined> {
    return await db.annotations.get(id);
  }

  static async getAnnotationsByDocument(documentId: string): Promise<StoredAnnotation[]> {
    return await db.annotations
      .where('documentId')
      .equals(documentId)
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

  static async updateAnnotation(id: string, changes: Partial<StoredAnnotation>): Promise<void> {
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