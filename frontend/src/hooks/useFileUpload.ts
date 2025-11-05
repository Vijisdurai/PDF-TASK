import { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { DatabaseService } from '../services/database';


export interface UploadProgress {
  fileId: string;
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

  const updateProgress = useCallback((fileId: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...updates }
    }));
  }, []);

  const uploadFile = useCallback(async (file: File, fileId: string): Promise<DocumentMetadata> => {
    try {
      // Initialize progress tracking
      updateProgress(fileId, {
        fileId,
        progress: 0,
        status: 'uploading'
      });

      setIsUploading(true);

      // Upload to backend with progress tracking
      const response = await apiService.uploadDocument(file, (progress) => {
        updateProgress(fileId, { progress });
      });

      // Store document metadata in IndexedDB
      try {
        await DatabaseService.addDocument(response.document);
      } catch (dbError) {
        console.error('Failed to store document in IndexedDB:', dbError);
        // Continue with the upload process even if local storage fails
      }

      // Update application state immediately
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
      setIsUploading(false);
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