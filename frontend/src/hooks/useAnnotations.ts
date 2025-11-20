import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Annotation } from '../contexts/AppContext';

export interface UseAnnotationsReturn {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  createAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnnotation: (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  refreshAnnotations: (documentId: string) => Promise<void>;
}

export const useAnnotations = (documentId?: string): UseAnnotationsReturn => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh annotations from server
  const refreshAnnotations = useCallback(async (docId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const serverAnnotations = await apiService.getAnnotations(docId);
      dispatch({ type: 'SET_ANNOTATIONS', payload: serverAnnotations });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load annotations';
      setError(errorMessage);
      console.error('Failed to refresh annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Create annotation
  const createAnnotation = useCallback(async (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const serverAnnotation = await apiService.createAnnotation(annotation);
      dispatch({ type: 'ADD_ANNOTATION', payload: serverAnnotation });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Update annotation
  const updateAnnotation = useCallback(async (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => {
    try {
      const serverAnnotation = await apiService.updateAnnotation(id, updates);
      dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates: serverAnnotation } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Delete annotation
  const deleteAnnotation = useCallback(async (id: string) => {
    try {
      await apiService.deleteAnnotation(id);
      dispatch({ type: 'DELETE_ANNOTATION', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Load annotations when documentId changes
  useEffect(() => {
    if (documentId) {
      refreshAnnotations(documentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

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
    annotations: state.annotations,
    isLoading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refreshAnnotations,
  };
};
