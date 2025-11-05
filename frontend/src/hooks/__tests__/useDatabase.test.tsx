import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AppProvider } from '../../contexts/AppContext';
import { useDatabase } from '../useDatabase';
import { DatabaseService } from '../../services/database';
import type { DocumentMetadata, Annotation } from '../../contexts/AppContext';

// Mock the DatabaseService
vi.mock('../../services/database', () => ({
  DatabaseService: {
    getAllDocuments: vi.fn(),
    getAnnotationsByDocument: vi.fn(),
    addDocument: vi.fn(),
    addAnnotation: vi.fn(),
    updateAnnotation: vi.fn(),
    deleteAnnotation: vi.fn(),
    deleteDocument: vi.fn(),
    getStorageStats: vi.fn(),
    getPendingDocuments: vi.fn(),
    getPendingAnnotations: vi.fn(),
    markDocumentSynced: vi.fn(),
    markAnnotationSynced: vi.fn(),
    markDocumentSyncError: vi.fn(),
    markAnnotationSyncError: vi.fn(),
  },
}));

// Mock data
const mockDocument: DocumentMetadata = {
  id: 'doc-1',
  filename: 'test.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  uploadedAt: new Date('2023-01-01'),
};

const mockAnnotation: Annotation = {
  id: 'ann-1',
  documentId: 'doc-1',
  page: 1,
  xPercent: 50,
  yPercent: 50,
  content: 'Test annotation',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

const mockStoredDocument = {
  ...mockDocument,
  syncStatus: 'synced' as const,
  lastSyncAt: new Date('2023-01-01'),
};

const mockStoredAnnotation = {
  ...mockAnnotation,
  syncStatus: 'synced' as const,
  lastSyncAt: new Date('2023-01-01'),
};

// Wrapper component for testing hooks
function TestWrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('useDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(DatabaseService.getAllDocuments).mockResolvedValue([mockStoredDocument]);
    vi.mocked(DatabaseService.getAnnotationsByDocument).mockResolvedValue([mockStoredAnnotation]);
    vi.mocked(DatabaseService.addDocument).mockResolvedValue();
    vi.mocked(DatabaseService.addAnnotation).mockResolvedValue();
    vi.mocked(DatabaseService.updateAnnotation).mockResolvedValue();
    vi.mocked(DatabaseService.deleteAnnotation).mockResolvedValue();
    vi.mocked(DatabaseService.deleteDocument).mockResolvedValue();
    vi.mocked(DatabaseService.getStorageStats).mockResolvedValue({
      documentCount: 1,
      annotationCount: 1,
      pendingDocuments: 0,
      pendingAnnotations: 0,
    });
    vi.mocked(DatabaseService.getPendingDocuments).mockResolvedValue([]);
    vi.mocked(DatabaseService.getPendingAnnotations).mockResolvedValue([]);
    vi.mocked(DatabaseService.markDocumentSynced).mockResolvedValue();
    vi.mocked(DatabaseService.markAnnotationSynced).mockResolvedValue();
    vi.mocked(DatabaseService.markDocumentSyncError).mockResolvedValue();
    vi.mocked(DatabaseService.markAnnotationSyncError).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load documents on mount', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(DatabaseService.getAllDocuments).toHaveBeenCalledOnce();
  });

  it('should load documents successfully', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    // Wait for initial mount effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear mocks after mount effect
    vi.clearAllMocks();

    await act(async () => {
      await result.current.loadDocuments();
    });

    expect(DatabaseService.getAllDocuments).toHaveBeenCalledTimes(1);
  });

  it('should handle loadDocuments error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(DatabaseService.getAllDocuments).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.loadDocuments();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load documents from database:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should load annotations for a document', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.loadAnnotations('doc-1');
    });

    expect(DatabaseService.getAnnotationsByDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should handle loadAnnotations error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(DatabaseService.getAnnotationsByDocument).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.loadAnnotations('doc-1');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load annotations from database:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should save a document', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.saveDocument(mockDocument);
    });

    expect(DatabaseService.addDocument).toHaveBeenCalledWith(mockDocument);
  });

  it('should handle saveDocument error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.addDocument).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.saveDocument(mockDocument);
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save document to database:', error);
    consoleSpy.mockRestore();
  });

  it('should save an annotation', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.saveAnnotation(mockAnnotation);
    });

    expect(DatabaseService.addAnnotation).toHaveBeenCalledWith(mockAnnotation);
  });

  it('should handle saveAnnotation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.addAnnotation).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.saveAnnotation(mockAnnotation);
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save annotation to database:', error);
    consoleSpy.mockRestore();
  });

  it('should update an annotation', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.updateAnnotation('ann-1', 'Updated content');
    });

    expect(DatabaseService.updateAnnotation).toHaveBeenCalledWith('ann-1', { content: 'Updated content' });
  });

  it('should handle updateAnnotation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.updateAnnotation).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.updateAnnotation('ann-1', 'Updated content');
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to update annotation in database:', error);
    consoleSpy.mockRestore();
  });

  it('should delete an annotation', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.deleteAnnotation('ann-1');
    });

    expect(DatabaseService.deleteAnnotation).toHaveBeenCalledWith('ann-1');
  });

  it('should handle deleteAnnotation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.deleteAnnotation).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.deleteAnnotation('ann-1');
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete annotation from database:', error);
    consoleSpy.mockRestore();
  });

  it('should delete a document and reload documents', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.deleteDocument('doc-1');
    });

    expect(DatabaseService.deleteDocument).toHaveBeenCalledWith('doc-1');
    expect(DatabaseService.getAllDocuments).toHaveBeenCalled();
  });

  it('should handle deleteDocument error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.deleteDocument).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.deleteDocument('doc-1');
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete document from database:', error);
    consoleSpy.mockRestore();
  });

  it('should get storage statistics', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    let stats;
    await act(async () => {
      stats = await result.current.getStorageStats();
    });

    expect(DatabaseService.getStorageStats).toHaveBeenCalledOnce();
    expect(stats).toEqual({
      documentCount: 1,
      annotationCount: 1,
      pendingDocuments: 0,
      pendingAnnotations: 0,
    });
  });

  it('should handle getStorageStats error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(DatabaseService.getStorageStats).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    let stats;
    await act(async () => {
      stats = await result.current.getStorageStats();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to get storage stats:', expect.any(Error));
    expect(stats).toEqual({
      documentCount: 0,
      annotationCount: 0,
      pendingDocuments: 0,
      pendingAnnotations: 0,
    });
    consoleSpy.mockRestore();
  });

  it('should get pending items', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    let pendingItems;
    await act(async () => {
      pendingItems = await result.current.getPendingItems();
    });

    expect(DatabaseService.getPendingDocuments).toHaveBeenCalledOnce();
    expect(DatabaseService.getPendingAnnotations).toHaveBeenCalledOnce();
    expect(pendingItems).toEqual({
      pendingDocuments: [],
      pendingAnnotations: [],
    });
  });

  it('should handle getPendingItems error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(DatabaseService.getPendingDocuments).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    let pendingItems;
    await act(async () => {
      pendingItems = await result.current.getPendingItems();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to get pending items:', expect.any(Error));
    expect(pendingItems).toEqual({
      pendingDocuments: [],
      pendingAnnotations: [],
    });
    consoleSpy.mockRestore();
  });

  it('should mark document as synced', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.markSynced('document', 'doc-1');
    });

    expect(DatabaseService.markDocumentSynced).toHaveBeenCalledWith('doc-1');
  });

  it('should mark annotation as synced', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.markSynced('annotation', 'ann-1');
    });

    expect(DatabaseService.markAnnotationSynced).toHaveBeenCalledWith('ann-1');
  });

  it('should handle markSynced error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.markDocumentSynced).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.markSynced('document', 'doc-1');
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to mark document as synced:', error);
    consoleSpy.mockRestore();
  });

  it('should mark document sync error', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.markSyncError('document', 'doc-1');
    });

    expect(DatabaseService.markDocumentSyncError).toHaveBeenCalledWith('doc-1');
  });

  it('should mark annotation sync error', async () => {
    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.markSyncError('annotation', 'ann-1');
    });

    expect(DatabaseService.markAnnotationSyncError).toHaveBeenCalledWith('ann-1');
  });

  it('should handle markSyncError error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    vi.mocked(DatabaseService.markAnnotationSyncError).mockRejectedValue(error);

    const { result } = renderHook(() => useDatabase(), {
      wrapper: TestWrapper,
    });

    await expect(act(async () => {
      await result.current.markSyncError('annotation', 'ann-1');
    })).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to mark annotation sync error:', error);
    consoleSpy.mockRestore();
  });
});