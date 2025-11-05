import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnotations } from '../../hooks/useAnnotations';

// Create mock database functions
const mockToArray = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// Mock the useDatabase hook
vi.mock('../../hooks/useDatabase', () => ({
  useDatabase: () => ({
    db: {
      annotations: {
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            toArray: mockToArray
          }))
        })),
        add: mockAdd,
        update: mockUpdate,
        delete: mockDelete
      },
      transaction: vi.fn((mode, tables, callback) => callback())
    }
  })
}));

describe('useAnnotations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock return values
    mockToArray.mockResolvedValue([]);
    mockAdd.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty annotations', async () => {
    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    // Wait for the initial load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.annotations).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should provide annotation management functions', () => {
    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    expect(typeof result.current.createAnnotation).toBe('function');
    expect(typeof result.current.updateAnnotation).toBe('function');
    expect(typeof result.current.deleteAnnotation).toBe('function');
    expect(typeof result.current.getAnnotationsForPage).toBe('function');
    expect(typeof result.current.getAnnotationById).toBe('function');
  });

  it('should filter annotations by page', async () => {
    const mockAnnotations = [
      { 
        id: '1', 
        documentId: 'test-doc-id',
        page: 1, 
        content: 'Page 1 annotation',
        xPercent: 50,
        yPercent: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      },
      { 
        id: '2', 
        documentId: 'test-doc-id',
        page: 2, 
        content: 'Page 2 annotation',
        xPercent: 50,
        yPercent: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      },
      { 
        id: '3', 
        documentId: 'test-doc-id',
        page: 1, 
        content: 'Another page 1 annotation',
        xPercent: 50,
        yPercent: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      }
    ];

    // Mock the database to return our test annotations
    mockToArray.mockResolvedValue(mockAnnotations);

    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    // Wait for annotations to load
    await waitFor(() => {
      expect(result.current.annotations).toHaveLength(3);
    });

    const page1Annotations = result.current.getAnnotationsForPage(1);
    const page2Annotations = result.current.getAnnotationsForPage(2);

    expect(page1Annotations).toHaveLength(2);
    expect(page2Annotations).toHaveLength(1);
    expect(page1Annotations[0].content).toBe('Page 1 annotation');
    expect(page2Annotations[0].content).toBe('Page 2 annotation');
  });

  it('should find annotation by ID', async () => {
    const mockAnnotations = [
      { 
        id: 'test-id', 
        documentId: 'test-doc-id',
        page: 1, 
        content: 'Test annotation',
        xPercent: 50,
        yPercent: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      },
      { 
        id: 'other-id', 
        documentId: 'test-doc-id',
        page: 1, 
        content: 'Other annotation',
        xPercent: 50,
        yPercent: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const
      }
    ];

    // Mock the database to return our test annotations
    mockToArray.mockResolvedValue(mockAnnotations);

    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    // Wait for annotations to load
    await waitFor(() => {
      expect(result.current.annotations).toHaveLength(2);
    });

    const foundAnnotation = result.current.getAnnotationById('test-id');
    const notFoundAnnotation = result.current.getAnnotationById('non-existent');

    expect(foundAnnotation?.content).toBe('Test annotation');
    expect(notFoundAnnotation).toBeUndefined();
  });
});