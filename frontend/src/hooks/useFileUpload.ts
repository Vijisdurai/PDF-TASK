import { useState, useCallback, useRef } from 'react';
import { useAppContext, type DocumentMetadata } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { DatabaseService } from '../services/database';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, fileId: string) => Promise<DocumentMetadata>;
  uploadProgress: Record<string, UploadProgress>;
  isUploading: boolean;
  clearProgress: (fileId: string) => void;
  clearAllProgress: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const { dispatch } = useAppContext();
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Use ref to track active uploads - prevents re-renders
  const activeUploadsRef = useRef<Set<string>>(new Set());

  const updateProgress = useCallback((fileId: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], fileId, ...updates }
    }));
  }, []);

  const uploadFile = useCallback(async (file: File, fileId: string): Promise<DocumentMetadata> => {
    // Prevent duplicate uploads of the same file
    if (activeUploadsRef.current.has(fileId)) {
      throw new Error('Upload already in progress for this file');
    }

    // Mark as active
    activeUploadsRef.current.add(fileId);
    setIsUploading(true);

    try {
      // Initialize progress tracking
      updateProgress(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      // Upload to backend with progress tracking
      const response = await apiService.uploadDocument(file, (progress) => {
        updateProgress(fileId, { progress });
      });

      // Store document metadata in IndexedDB
      try {
        await DatabaseService.addDocument(response.document);
      } catch (dbError) {
        console.error('Failed to store document in IndexedDB:', dbError);
        // Continue even if local storage fails
      }

      // Update application state
      dispatch({ type: 'ADD_DOCUMENT', payload: response.document });

      // Mark upload as successful
      updateProgress(fileId, {
        progress: 100,
        status: 'success'
      });

      return response.document;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      updateProgress(fileId, {
        status: 'error',
        error: errorMessage
      });

      console.error('Upload failed:', error);
      throw error;
      
    } finally {
      // Remove from active uploads
      activeUploadsRef.current.delete(fileId);
      
      // Update isUploading state
      setIsUploading(activeUploadsRef.current.size > 0);
    }
  }, [dispatch, updateProgress]);

  const clearProgress = useCallback((fileId: string) => {
    setUploadProgress(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllProgress = useCallback(() => {
    setUploadProgress({});
  }, []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    clearProgress,
    clearAllProgress
  };
};
