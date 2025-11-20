import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnnotations } from '../useAnnotations';
import { AppProvider } from '../../contexts/AppContext';
import { apiService } from '../../services/api';
import { DatabaseService } from '../../services/database';
import type { DocumentAnnotation, ImageAnnotation } from '../../contexts/AppContext';

// Mock the services
vi.mock('../../services/api');
vi.mock('../../services/database');

describe('useAnnotations', () => {
  const mockDocumentId = 'test-doc-123';
  
  const mockDocumentAnnotation: DocumentAnnotation = {
    id: 'ann-1',
    documentId: mockDocumentId,
    type: 'document',
    page: 1,
    xPercent: 50,
    yPercent: 50,
    content: 'Test annotation',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockImageAnnotation: ImageAnnotation = {
    id: 'ann-2',
    documentId: mockDocumentId,
    type: 'image',
    xPixel: 100,
    yPixel: 200,
    content: 'Image annotation',
    color: '#FF0000',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Setup default mock implementations
    vi.mocked(apiService.getAnnotations).mockResolvedValue([mockDocumentAnnotation]);
    vi.mocked(apiService.createAnnotation).mockResolvedValue(mockDocumentAnnotation);
    vi.mocked(apiService.updateAnnotation).mockResolvedValue(mockDocumentAnnotation);
    vi.mocked(apiService.deleteAnnotation).mockResolvedValue(undefined);
    
    vi.mocked(DatabaseService.getAnnotationsByDocument).mockResolvedValue([]);
    vi.mocked(DatabaseService.addAnnotation).mockResolvedValue(undefined);
    vi.mocked(DatabaseService.updateAnnotation).mockResolvedValue(undefined);
    vi.mocked(DatabaseService.deleteAnnotation).mockResolvedValue(undefined);
    vi.mocked(DatabaseService.markAnnotationSynced).mockResolvedValue(undefined);
    vi.mocked(DatabaseService.getPendingAnnotations).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  describe('fetchAnnotations', () => {
    it('should load annotations on mount when documentId is provided', async () => {
      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiService.getAnnotations).toHaveBeenCalledWith(mockDocumentId);
      expect(result.current.annotations).toHaveLength(1);
      expect(result.current.annotations[0]).toEqual(mockDocumentAnnotation);
    });

    it('should fall back to IndexedDB when server fails after retries', async () => {
      vi.mocked(apiService.getAnnotations).mockRejectedValue(new Error('Server error'));
      vi.mocked(DatabaseService.getAnnotationsByDocument).mockResolvedValue([mockDocumentAnnotation]);

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      // Wait for retries to complete and fallback to IndexedDB
      await waitFor(() => {
        expect(DatabaseService.getAnnotationsByDocument).toHaveBeenCalledWith(mockDocumentId);
      }, { timeout: 15000 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 15000 });

      expect(result.current.annotations).toHaveLength(1);
    });

    it('should handle successful fetch after retries', async () => {
      let callCount = 0;
      vi.mocked(apiService.getAnnotations).mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve([mockDocumentAnnotation]);
      });

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      // Should have retried and eventually succeeded
      expect(callCount).toBeGreaterThan(1);
      expect(result.current.annotations).toHaveLength(1);
    });
  });

  describe('createAnnotation', () => {
    it('should create annotation with optimistic UI update', async () => {
      const newAnnotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'document',
        documentId: mockDocumentId,
        page: 1,
        xPercent: 25,
        yPercent: 75,
        content: 'New annotation',
      };

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAnnotation(newAnnotation);
      });

      expect(DatabaseService.addAnnotation).toHaveBeenCalled();
      expect(apiService.createAnnotation).toHaveBeenCalledWith(newAnnotation);
    });

    it('should handle server failure gracefully', async () => {
      vi.mocked(apiService.createAnnotation).mockRejectedValue(new Error('Server error'));

      const newAnnotation: Omit<ImageAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'image',
        documentId: mockDocumentId,
        xPixel: 150,
        yPixel: 250,
        content: 'Annotation with server error',
        color: '#00FF00',
      };

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createAnnotation(newAnnotation);
      });

      // Should still save to IndexedDB even if server fails
      expect(DatabaseService.addAnnotation).toHaveBeenCalled();
    });

    it('should rollback on failure', async () => {
      const error = new Error('Create failed');
      vi.mocked(DatabaseService.addAnnotation).mockRejectedValue(error);

      const newAnnotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'document',
        documentId: mockDocumentId,
        page: 1,
        xPercent: 25,
        yPercent: 75,
        content: 'Failed annotation',
      };

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createAnnotation(newAnnotation);
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateAnnotation', () => {
    it('should update annotation with optimistic UI update', async () => {
      vi.mocked(apiService.getAnnotations).mockResolvedValue([mockDocumentAnnotation]);

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.annotations).toHaveLength(1);
      });

      const updates = { content: 'Updated content' };

      await act(async () => {
        await result.current.updateAnnotation(mockDocumentAnnotation.id, updates);
      });

      expect(DatabaseService.updateAnnotation).toHaveBeenCalledWith(
        mockDocumentAnnotation.id,
        updates
      );
      expect(apiService.updateAnnotation).toHaveBeenCalledWith(
        mockDocumentAnnotation.id,
        updates
      );
    });

    it('should handle server failure gracefully', async () => {
      vi.mocked(apiService.getAnnotations).mockResolvedValue([mockDocumentAnnotation]);
      vi.mocked(apiService.updateAnnotation).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.annotations).toHaveLength(1);
      });

      const updates = { content: 'Update with server error' };

      await act(async () => {
        await result.current.updateAnnotation(mockDocumentAnnotation.id, updates);
      });

      // Should still save to IndexedDB even if server fails
      expect(DatabaseService.updateAnnotation).toHaveBeenCalled();
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete annotation with optimistic UI update', async () => {
      vi.mocked(apiService.getAnnotations).mockResolvedValue([mockDocumentAnnotation]);

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.annotations).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteAnnotation(mockDocumentAnnotation.id);
      });

      expect(DatabaseService.deleteAnnotation).toHaveBeenCalledWith(mockDocumentAnnotation.id);
      expect(apiService.deleteAnnotation).toHaveBeenCalledWith(mockDocumentAnnotation.id);
    });

    it('should handle server failure gracefully', async () => {
      vi.mocked(apiService.getAnnotations).mockResolvedValue([mockDocumentAnnotation]);
      vi.mocked(apiService.deleteAnnotation).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.annotations).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteAnnotation(mockDocumentAnnotation.id);
      });

      // Should still delete from IndexedDB even if server fails
      expect(DatabaseService.deleteAnnotation).toHaveBeenCalled();
    });
  });

  describe('error handling and retry logic', () => {
    it('should retry failed operations', async () => {
      let callCount = 0;
      vi.mocked(apiService.getAnnotations).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve([mockDocumentAnnotation]);
      });

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should have retried and eventually succeeded
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('online/offline sync', () => {
    it('should sync pending annotations when coming online', async () => {
      const pendingAnnotation = {
        ...mockDocumentAnnotation,
        syncStatus: 'pending' as const,
      };

      vi.mocked(DatabaseService.getPendingAnnotations).mockResolvedValue([pendingAnnotation]);

      const { result } = renderHook(() => useAnnotations(mockDocumentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate coming online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(DatabaseService.getPendingAnnotations).toHaveBeenCalled();
      });
    });
  });
});
