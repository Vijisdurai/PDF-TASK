import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
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

  // Refresh documents from server
  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const serverDocuments = await apiService.getDocuments();
      dispatch({ type: 'SET_DOCUMENTS', payload: serverDocuments });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      setError(errorMessage);
      console.error('Failed to refresh documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId);
      dispatch({ 
        type: 'REMOVE_DOCUMENT', 
        payload: documentId 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Select document
  const selectDocument = useCallback((document: DocumentMetadata) => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: document });
  }, [dispatch]);

  // Load documents on mount
  useEffect(() => {
    refreshDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
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
  }, [dispatch]);

  return {
    documents: state.documents,
    isLoading,
    error,
    refreshDocuments,
    deleteDocument,
    selectDocument
  };
};