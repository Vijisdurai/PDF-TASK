import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface Annotation {
  id: string;
  documentId: string;
  xPercent: number; // Percentage-based coordinate (0-100)
  yPercent: number; // Percentage-based coordinate (0-100)
  page: number; // Page number (1-based)
  content: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface CreateAnnotationData {
  documentId: string;
  xPercent: number;
  yPercent: number;
  page: number;
  content: string;
}

export const useAnnotations = (documentId?: string) => {
  const { db } = useDatabase();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique ID for annotations
  const generateId = useCallback(() => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load annotations for a specific document
  const loadAnnotations = useCallback(async (docId: string) => {
    if (!db) return;

    try {
      setLoading(true);
      setError(null);
      
      const docAnnotations = await db.annotations
        .where('documentId')
        .equals(docId)
        .toArray();
      
      // Sort by createdAt (newest first)
      const sortedAnnotations = docAnnotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setAnnotations(sortedAnnotations);
    } catch (err) {
      console.error('Error loading annotations:', err);
      setError('Failed to load annotations');
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Load annotations when documentId changes
  useEffect(() => {
    if (documentId) {
      loadAnnotations(documentId);
    } else {
      setAnnotations([]);
    }
  }, [documentId, loadAnnotations]);

  // Create new annotation
  const createAnnotation = useCallback(async (data: CreateAnnotationData): Promise<Annotation | null> => {
    if (!db) {
      setError('Database not available');
      return null;
    }

    try {
      const now = Date.now();
      const newAnnotation: Annotation = {
        id: generateId(),
        documentId: data.documentId,
        xPercent: data.xPercent,
        yPercent: data.yPercent,
        page: data.page,
        content: data.content,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        syncStatus: 'pending'
      };

      await db.annotations.add(newAnnotation);
      
      // Update local state
      setAnnotations(prev => [newAnnotation, ...prev]);
      
      return newAnnotation;
    } catch (err) {
      console.error('Error creating annotation:', err);
      setError('Failed to create annotation');
      return null;
    }
  }, [db, generateId]);

  // Update existing annotation
  const updateAnnotation = useCallback(async (id: string, content: string): Promise<boolean> => {
    if (!db) {
      setError('Database not available');
      return false;
    }

    try {
      const now = Date.now();
      await db.annotations.update(id, {
        content,
        updatedAt: new Date(now),
        syncStatus: 'pending'
      });

      // Update local state
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === id 
          ? { ...annotation, content, updatedAt: new Date(now), syncStatus: 'pending' as const }
          : annotation
      ));

      return true;
    } catch (err) {
      console.error('Error updating annotation:', err);
      setError('Failed to update annotation');
      return false;
    }
  }, [db]);

  // Delete annotation
  const deleteAnnotation = useCallback(async (id: string): Promise<boolean> => {
    if (!db) {
      setError('Database not available');
      return false;
    }

    try {
      await db.annotations.delete(id);
      
      // Update local state
      setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting annotation:', err);
      setError('Failed to delete annotation');
      return false;
    }
  }, [db]);

  // Get annotations for a specific page
  const getAnnotationsForPage = useCallback((page: number) => {
    return annotations.filter(annotation => annotation.page === page);
  }, [annotations]);

  // Get annotation by ID
  const getAnnotationById = useCallback((id: string) => {
    return annotations.find(annotation => annotation.id === id);
  }, [annotations]);

  // Clear all annotations for current document
  const clearAnnotations = useCallback(async (): Promise<boolean> => {
    if (!db || !documentId) {
      setError('Database or document ID not available');
      return false;
    }

    try {
      await db.annotations
        .where('documentId')
        .equals(documentId)
        .delete();
      
      setAnnotations([]);
      return true;
    } catch (err) {
      console.error('Error clearing annotations:', err);
      setError('Failed to clear annotations');
      return false;
    }
  }, [db, documentId]);

  // Get annotations that need syncing
  const getPendingAnnotations = useCallback(async (): Promise<Annotation[]> => {
    if (!db) return [];

    try {
      return await db.annotations
        .where('syncStatus')
        .equals('pending')
        .toArray();
    } catch (err) {
      console.error('Error getting pending annotations:', err);
      return [];
    }
  }, [db]);

  // Update sync status for annotation
  const updateSyncStatus = useCallback(async (id: string, status: 'pending' | 'synced' | 'error'): Promise<boolean> => {
    if (!db) return false;

    try {
      await db.annotations.update(id, { syncStatus: status });
      
      // Update local state
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === id 
          ? { ...annotation, syncStatus: status }
          : annotation
      ));

      return true;
    } catch (err) {
      console.error('Error updating sync status:', err);
      return false;
    }
  }, [db]);

  // Bulk update annotations (for sync operations)
  const bulkUpdateAnnotations = useCallback(async (updates: Partial<Annotation>[]): Promise<boolean> => {
    if (!db) return false;

    try {
      await db.transaction('rw', db.annotations, async () => {
        for (const update of updates) {
          if (update.id) {
            await db.annotations.update(update.id, update);
          }
        }
      });

      // Reload annotations to reflect changes
      if (documentId) {
        await loadAnnotations(documentId);
      }

      return true;
    } catch (err) {
      console.error('Error bulk updating annotations:', err);
      setError('Failed to update annotations');
      return false;
    }
  }, [db, documentId, loadAnnotations]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    annotations,
    loading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsForPage,
    getAnnotationById,
    clearAnnotations,
    getPendingAnnotations,
    updateSyncStatus,
    bulkUpdateAnnotations,
    clearError,
    refresh: () => documentId && loadAnnotations(documentId)
  };
};