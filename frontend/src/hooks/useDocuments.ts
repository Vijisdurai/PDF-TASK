import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { DatabaseService } from '../services/database';
import { apiService } from '../services/api';
import type { DocumentMetadata } from '../contexts/AppContext';

export interface UseDocumentsReturn {
  documents: DocumentMetadata[];
  isLoading: boolean;
  error: string | null;
  refreshDocuments: () => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  selectDocument: (document: DocumentMetadata) => void;
}

export const useDocuments = (): UseDocumentsReturn => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load documents from IndexedDB on mount
  const loadDocumentsFromLocal = useCallback(async () => {
    try {
      const localDocuments = await DatabaseService.getAllDocuments();
      const documents = localDocuments.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        convertedPath: doc.convertedPath
      }));
      dispatch({ type: 'SET_DOCUMENTS', payload: documents });
    } catch (error) {
      console.error('Failed to load documents from local storage:', error);
    }
  }, [dispatch]);

  // Sync documents with server
  const syncDocumentsWithServer = useCallback(async () => {
    if (!navigator.onLine) {
      return; // Skip sync when offline
    }

    try {
      const serverDocuments = await apiService.getDocuments();

      
      // Update local storage with server data
      for (const doc of serverDocuments) {
        try {
          const existingDoc = await DatabaseService.getDocument(doc.id);
          if (!existingDoc) {
            await DatabaseService.addDocument(doc);
          } else {
            await DatabaseService.updateDocument(doc.id, {
              ...doc,
              syncStatus: 'synced',
              lastSyncAt: new Date()
            });
          }
        } catch (error) {
          console.error('Failed to sync document:', doc.id, error);
        }
      }

      // Update application state
      dispatch({ type: 'SET_DOCUMENTS', payload: serverDocuments });
      
    } catch (error) {
      console.error('Failed to sync with server:', error);
      // Continue with local data if server sync fails
    }
  }, [dispatch]);

  // Refresh documents (load from local and sync with server)
  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Always load from local first for immediate UI update
      await loadDocumentsFromLocal();
      
      // Then sync with server in background
      await syncDocumentsWithServer();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      setError(errorMessage);
      console.error('Failed to refresh documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadDocumentsFromLocal, syncDocumentsWithServer]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      // Remove from local storage first
      await DatabaseService.deleteDocument(documentId);
      
      // Update application state immediately
      dispatch({ 
        type: 'SET_DOCUMENTS', 
        payload: state.documents.filter(doc => doc.id !== documentId) 
      });

      // Try to delete from server if online
      if (navigator.onLine) {
        try {
          await apiService.deleteDocument(documentId);
        } catch (error) {
          console.error('Failed to delete document from server:', error);
          // Document is already removed locally, so this is not critical
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch, state.documents]);

  // Select document
  const selectDocument = useCallback((document: DocumentMetadata) => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: document });
  }, [dispatch]);

  // Load documents on mount
  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Listen for online/offline events to sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      syncDocumentsWithServer();
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch, syncDocumentsWithServer]);

  return {
    documents: state.documents,
    isLoading,
    error,
    refreshDocuments,
    deleteDocument,
    selectDocument
  };
};