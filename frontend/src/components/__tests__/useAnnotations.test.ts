import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnotations } from '../../hooks/useAnnotations';

// Mock the useDatabase hook
vi.mock('../../hooks/useDatabase', () => ({
  useDatabase: () => ({
    db: {
      annotations: {
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([]))
          }))
        })),
        add: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve())
      }
    }
  })
}));

describe('useAnnotations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty annotations', () => {
    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    expect(result.current.annotations).toEqual([]);
    expect(result.current.loading).toBe(false);
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

  it('should filter annotations by page', () => {
    const mockAnnotations = [
      { id: '1', page: 1, content: 'Page 1 annotation' },
      { id: '2', page: 2, content: 'Page 2 annotation' },
      { id: '3', page: 1, content: 'Another page 1 annotation' }
    ];

    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    // Manually set annotations for testing
    act(() => {
      result.current.annotations = mockAnnotations as any;
    });

    const page1Annotations = result.current.getAnnotationsForPage(1);
    const page2Annotations = result.current.getAnnotationsForPage(2);

    expect(page1Annotations).toHaveLength(2);
    expect(page2Annotations).toHaveLength(1);
    expect(page1Annotations[0].content).toBe('Page 1 annotation');
    expect(page2Annotations[0].content).toBe('Page 2 annotation');
  });

  it('should find annotation by ID', () => {
    const mockAnnotations = [
      { id: 'test-id', page: 1, content: 'Test annotation' },
      { id: 'other-id', page: 1, content: 'Other annotation' }
    ];

    const { result } = renderHook(() => useAnnotations('test-doc-id'));
    
    // Manually set annotations for testing
    act(() => {
      result.current.annotations = mockAnnotations as any;
    });

    const foundAnnotation = result.current.getAnnotationById('test-id');
    const notFoundAnnotation = result.current.getAnnotationById('non-existent');

    expect(foundAnnotation?.content).toBe('Test annotation');
    expect(notFoundAnnotation).toBeUndefined();
  });
});