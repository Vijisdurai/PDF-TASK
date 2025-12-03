import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { apiService } from '@/services/api';
import { DatabaseService } from '@/services/database';
import type { Annotation } from '@/contexts/AppContext';

export interface UseAnnotationsReturn {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  createAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnnotation: (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  refreshAnnotations: (documentId: string) => Promise<void>;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Helper function for exponential backoff
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

// Helper function to retry async operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        const delay = getRetryDelay(attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export const useAnnotations = (documentId?: string): UseAnnotationsReturn => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncQueueRef = useRef<Set<string>>(new Set());

  // Sync pending annotations from IndexedDB to backend
  const syncPendingAnnotations = useCallback(async () => {
    if (!state.isOnline) {
      return;
    }

    try {
      const pendingAnnotations = await DatabaseService.getPendingAnnotations();
      
      for (const annotation of pendingAnnotations) {
        // Skip if already in sync queue
        if (syncQueueRef.current.has(annotation.id)) {
          continue;
        }

        syncQueueRef.current.add(annotation.id);

        try {
          // Determine if this is a new annotation or an update
          // New annotations won't exist on the server yet
          const { syncStatus, lastSyncAt, ...annotationData } = annotation;
          
          // Try to sync with retry logic
          await retryOperation(async () => {
            try {
              // Try to update first (for existing annotations)
              await apiService.updateAnnotation(annotation.id, annotationData);
            } catch (updateError) {
              // If update fails, try to create (for new annotations)
              await apiService.createAnnotation(annotationData);
            }
          });

          // Mark as synced in IndexedDB
          await DatabaseService.markAnnotationSynced(annotation.id);
          console.log(`Successfully synced annotation ${annotation.id}`);
        } catch (syncError) {
          console.error(`Failed to sync annotation ${annotation.id}:`, syncError);
          await DatabaseService.markAnnotationSyncError(annotation.id);
        } finally {
          syncQueueRef.current.delete(annotation.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending annotations:', error);
    }
  }, [state.isOnline]);

  // Fetch annotations from server and IndexedDB
  const refreshAnnotations = useCallback(async (docId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from server first if online
      if (state.isOnline) {
        try {
          const serverAnnotations = await retryOperation(() => 
            apiService.getAnnotations(docId)
          );
          
          // Update IndexedDB with server data
          for (const annotation of serverAnnotations) {
            try {
              await DatabaseService.addAnnotation(annotation);
              await DatabaseService.markAnnotationSynced(annotation.id);
            } catch (dbError) {
              // Annotation might already exist, try to update
              try {
                await DatabaseService.updateAnnotation(annotation.id, {
                  ...annotation,
                  syncStatus: 'synced',
                  lastSyncAt: new Date(),
                });
              } catch (updateError) {
                console.error('Failed to update annotation in IndexedDB:', updateError);
              }
            }
          }
          
          dispatch({ type: 'SET_ANNOTATIONS', payload: serverAnnotations });
        } catch (networkError) {
          console.warn('Failed to fetch from server, falling back to IndexedDB:', networkError);
          // Fall back to IndexedDB
          const localAnnotations = await DatabaseService.getAnnotationsByDocument(docId);
          dispatch({ type: 'SET_ANNOTATIONS', payload: localAnnotations });
        }
      } else {
        // Offline: load from IndexedDB
        const localAnnotations = await DatabaseService.getAnnotationsByDocument(docId);
        dispatch({ type: 'SET_ANNOTATIONS', payload: localAnnotations });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load annotations';
      setError(errorMessage);
      console.error('Failed to refresh annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, state.isOnline]);

  // Create annotation with optimistic UI update
  const createAnnotation = useCallback(async (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${crypto.randomUUID()}`;
    const now = new Date();
    
    const optimisticAnnotation: Annotation = {
      ...annotation,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    } as Annotation;

    // Optimistic UI update
    dispatch({ type: 'ADD_ANNOTATION', payload: optimisticAnnotation });

    try {
      // Save to IndexedDB immediately with temp ID
      await DatabaseService.addAnnotation(optimisticAnnotation);

      // Try to sync with backend if online
      if (state.isOnline) {
        try {
          const serverAnnotation = await retryOperation(() => 
            apiService.createAnnotation(annotation)
          );
          
          // First, remove the optimistic annotation from state
          dispatch({ type: 'DELETE_ANNOTATION', payload: tempId });
          
          // Then add the server annotation
          dispatch({ type: 'ADD_ANNOTATION', payload: serverAnnotation });
          
          // Update IndexedDB: delete temp, add server version
          await DatabaseService.deleteAnnotation(tempId);
          await DatabaseService.addAnnotation(serverAnnotation);
          await DatabaseService.markAnnotationSynced(serverAnnotation.id);
        } catch (networkError) {
          console.warn('Failed to sync annotation to server, will retry later:', networkError);
          // Keep the optimistic annotation, it will sync later
        }
      }
    } catch (error) {
      // Rollback optimistic update on failure
      dispatch({ type: 'DELETE_ANNOTATION', payload: tempId });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch, state.isOnline]);

  // Update annotation with optimistic UI update
  const updateAnnotation = useCallback(async (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => {
    // Store original annotation for rollback
    const originalAnnotation = state.annotations.find(a => a.id === id);
    if (!originalAnnotation) {
      throw new Error(`Annotation ${id} not found`);
    }

    // Optimistic UI update
    dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates } });

    try {
      // Update IndexedDB immediately
      await DatabaseService.updateAnnotation(id, updates);

      // Try to sync with backend if online
      if (state.isOnline) {
        try {
          const serverAnnotation = await retryOperation(() => 
            apiService.updateAnnotation(id, updates)
          );
          
          // Update with server response
          dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates: serverAnnotation } });
          await DatabaseService.markAnnotationSynced(id);
        } catch (networkError) {
          console.warn('Failed to sync annotation update to server, will retry later:', networkError);
          // Keep the optimistic update, it will sync later
        }
      }
    } catch (error) {
      // Rollback optimistic update on failure
      dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates: originalAnnotation } });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch, state.annotations, state.isOnline]);

  // Delete annotation with optimistic UI update
  const deleteAnnotation = useCallback(async (id: string) => {
    // Store original annotation for rollback
    const originalAnnotation = state.annotations.find(a => a.id === id);
    if (!originalAnnotation) {
      throw new Error(`Annotation ${id} not found`);
    }

    // Optimistic UI update
    dispatch({ type: 'DELETE_ANNOTATION', payload: id });

    try {
      // Delete from IndexedDB immediately
      await DatabaseService.deleteAnnotation(id);

      // Try to sync with backend if online
      if (state.isOnline) {
        try {
          await retryOperation(() => apiService.deleteAnnotation(id));
        } catch (networkError) {
          console.warn('Failed to sync annotation deletion to server:', networkError);
          // The annotation is already deleted locally, which is the desired state
          // If the server delete fails, we don't need to rollback
        }
      }
    } catch (error) {
      // Rollback optimistic update on IndexedDB failure
      dispatch({ type: 'ADD_ANNOTATION', payload: originalAnnotation });
      await DatabaseService.addAnnotation(originalAnnotation);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete annotation';
      setError(errorMessage);
      throw error;
    }
  }, [dispatch, state.annotations, state.isOnline]);

  // Load annotations when documentId changes
  useEffect(() => {
    if (documentId) {
      refreshAnnotations(documentId);
    }
  }, [documentId, refreshAnnotations]);

  // Listen for online/offline events and sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      // Sync pending annotations when coming online
      syncPendingAnnotations();
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync pending annotations on mount if online
    if (state.isOnline) {
      syncPendingAnnotations();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch, syncPendingAnnotations, state.isOnline]);

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
