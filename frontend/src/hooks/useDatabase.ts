import { useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { DatabaseService } from '../services/database';
import type { DocumentMetadata, Annotation } from '../contexts/AppContext';

export function useDatabase() {
  const { state, dispatch } = useAppContext();

  // Load documents from IndexedDB on mount
  const loadDocuments = useCallback(async () => {
    try {
      const documents = await DatabaseService.getAllDocuments();
      const documentMetadata: DocumentMetadata[] = documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        convertedPath: doc.convertedPath,
      }));
      dispatch({ type: 'SET_DOCUMENTS', payload: documentMetadata });
    } catch (error) {
      console.error('Failed to load documents from database:', error);
    }
  }, [dispatch]);

  // Load annotations for current document
  const loadAnnotations = useCallback(async (documentId: string) => {
    try {
      const annotations = await DatabaseService.getAnnotationsByDocument(documentId);
      const annotationData: Annotation[] = annotations.map(ann => ({
        id: ann.id,
        documentId: ann.documentId,
        page: ann.page,
        xPercent: ann.xPercent,
        yPercent: ann.yPercent,
        content: ann.content,
        createdAt: ann.createdAt,
        updatedAt: ann.updatedAt,
      }));
      dispatch({ type: 'SET_ANNOTATIONS', payload: annotationData });
    } catch (error) {
      console.error('Failed to load annotations from database:', error);
    }
  }, [dispatch]);

  // Save document to IndexedDB
  const saveDocument = useCallback(async (document: DocumentMetadata) => {
    try {
      await DatabaseService.addDocument(document);
      dispatch({ type: 'ADD_DOCUMENT', payload: document });
    } catch (error) {
      console.error('Failed to save document to database:', error);
      throw error;
    }
  }, [dispatch]);

  // Save annotation to IndexedDB
  const saveAnnotation = useCallback(async (annotation: Annotation) => {
    try {
      await DatabaseService.addAnnotation(annotation);
      dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
    } catch (error) {
      console.error('Failed to save annotation to database:', error);
      throw error;
    }
  }, [dispatch]);

  // Update annotation in IndexedDB
  const updateAnnotation = useCallback(async (id: string, content: string) => {
    try {
      await DatabaseService.updateAnnotation(id, { content });
      dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, content } });
    } catch (error) {
      console.error('Failed to update annotation in database:', error);
      throw error;
    }
  }, [dispatch]);

  // Delete annotation from IndexedDB
  const deleteAnnotation = useCallback(async (id: string) => {
    try {
      await DatabaseService.deleteAnnotation(id);
      dispatch({ type: 'DELETE_ANNOTATION', payload: id });
    } catch (error) {
      console.error('Failed to delete annotation from database:', error);
      throw error;
    }
  }, [dispatch]);

  // Delete document and all its annotations
  const deleteDocument = useCallback(async (id: string) => {
    try {
      await DatabaseService.deleteDocument(id);
      // Update state by reloading documents and clearing annotations if current document was deleted
      await loadDocuments();
      if (state.currentDocument?.id === id) {
        dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
        dispatch({ type: 'SET_ANNOTATIONS', payload: [] });
      }
    } catch (error) {
      console.error('Failed to delete document from database:', error);
      throw error;
    }
  }, [dispatch, loadDocuments, state.currentDocument?.id]);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    try {
      return await DatabaseService.getStorageStats();
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        documentCount: 0,
        annotationCount: 0,
        pendingDocuments: 0,
        pendingAnnotations: 0,
      };
    }
  }, []);

  // Get pending items for sync
  const getPendingItems = useCallback(async () => {
    try {
      const [pendingDocuments, pendingAnnotations] = await Promise.all([
        DatabaseService.getPendingDocuments(),
        DatabaseService.getPendingAnnotations(),
      ]);
      return { pendingDocuments, pendingAnnotations };
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return { pendingDocuments: [], pendingAnnotations: [] };
    }
  }, []);

  // Mark items as synced
  const markSynced = useCallback(async (type: 'document' | 'annotation', id: string) => {
    try {
      if (type === 'document') {
        await DatabaseService.markDocumentSynced(id);
      } else {
        await DatabaseService.markAnnotationSynced(id);
      }
    } catch (error) {
      console.error(`Failed to mark ${type} as synced:`, error);
      throw error;
    }
  }, []);

  // Mark items as sync error
  const markSyncError = useCallback(async (type: 'document' | 'annotation', id: string) => {
    try {
      if (type === 'document') {
        await DatabaseService.markDocumentSyncError(id);
      } else {
        await DatabaseService.markAnnotationSyncError(id);
      }
    } catch (error) {
      console.error(`Failed to mark ${type} sync error:`, error);
      throw error;
    }
  }, []);

  // Initialize database on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    // Data loading
    loadDocuments,
    loadAnnotations,
    
    // CRUD operations
    saveDocument,
    saveAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteDocument,
    
    // Utility functions
    getStorageStats,
    getPendingItems,
    markSynced,
    markSyncError,
  };
}