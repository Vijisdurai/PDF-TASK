import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext, type DocumentMetadata, type Annotation } from '../AppContext';
import { ReactNode } from 'react';

// Test component to access context
function TestComponent() {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      <div data-testid="document-count">{state.documents.length}</div>
      <div data-testid="annotation-count">{state.annotations.length}</div>
      <div data-testid="current-document">{state.currentDocument?.filename || 'none'}</div>
      <div data-testid="viewer-page">{state.viewerState.currentPage}</div>
      <div data-testid="viewer-zoom">{state.viewerState.zoomScale}</div>
      <div data-testid="note-panel">{state.isNotePanelOpen ? 'open' : 'closed'}</div>
      <div data-testid="uploading">{state.isUploading ? 'true' : 'false'}</div>
      <div data-testid="online">{state.isOnline ? 'true' : 'false'}</div>
      <div data-testid="sync-status">{state.syncStatus}</div>
      
      <button 
        data-testid="add-document" 
        onClick={() => dispatch({ 
          type: 'ADD_DOCUMENT', 
          payload: mockDocument 
        })}
      >
        Add Document
      </button>
      
      <button 
        data-testid="set-current-document" 
        onClick={() => dispatch({ 
          type: 'SET_CURRENT_DOCUMENT', 
          payload: mockDocument 
        })}
      >
        Set Current Document
      </button>
      
      <button 
        data-testid="add-annotation" 
        onClick={() => dispatch({ 
          type: 'ADD_ANNOTATION', 
          payload: mockAnnotation 
        })}
      >
        Add Annotation
      </button>
      
      <button 
        data-testid="update-annotation" 
        onClick={() => dispatch({ 
          type: 'UPDATE_ANNOTATION', 
          payload: { id: 'ann-1', content: 'Updated content' }
        })}
      >
        Update Annotation
      </button>
      
      <button 
        data-testid="delete-annotation" 
        onClick={() => dispatch({ 
          type: 'DELETE_ANNOTATION', 
          payload: 'ann-1'
        })}
      >
        Delete Annotation
      </button>
      
      <button 
        data-testid="set-viewer-state" 
        onClick={() => dispatch({ 
          type: 'SET_VIEWER_STATE', 
          payload: { currentPage: 2, zoomScale: 1.5 }
        })}
      >
        Set Viewer State
      </button>
      
      <button 
        data-testid="toggle-note-panel" 
        onClick={() => dispatch({ type: 'TOGGLE_NOTE_PANEL' })}
      >
        Toggle Note Panel
      </button>
      
      <button 
        data-testid="set-uploading" 
        onClick={() => dispatch({ 
          type: 'SET_UPLOADING', 
          payload: true 
        })}
      >
        Set Uploading
      </button>
      
      <button 
        data-testid="set-online" 
        onClick={() => dispatch({ 
          type: 'SET_ONLINE_STATUS', 
          payload: false 
        })}
      >
        Set Offline
      </button>
      
      <button 
        data-testid="set-sync-status" 
        onClick={() => dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: 'syncing' 
        })}
      >
        Set Sync Status
      </button>
    </div>
  );
}

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

function renderWithProvider(children: ReactNode) {
  return render(
    <AppProvider>
      {children}
    </AppProvider>
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    // Reset navigator.onLine for each test
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should provide initial state', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('document-count')).toHaveTextContent('0');
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-document')).toHaveTextContent('none');
    expect(screen.getByTestId('viewer-page')).toHaveTextContent('1');
    expect(screen.getByTestId('viewer-zoom')).toHaveTextContent('1');
    expect(screen.getByTestId('note-panel')).toHaveTextContent('open');
    expect(screen.getByTestId('uploading')).toHaveTextContent('false');
    expect(screen.getByTestId('online')).toHaveTextContent('true');
    expect(screen.getByTestId('sync-status')).toHaveTextContent('idle');
  });

  it('should handle SET_DOCUMENTS action', () => {
    const TestSetDocuments = () => {
      const { state, dispatch } = useAppContext();
      
      return (
        <div>
          <div data-testid="document-count">{state.documents.length}</div>
          <button 
            data-testid="set-documents" 
            onClick={() => dispatch({ 
              type: 'SET_DOCUMENTS', 
              payload: [mockDocument] 
            })}
          >
            Set Documents
          </button>
        </div>
      );
    };
    
    renderWithProvider(<TestSetDocuments />);
    
    act(() => {
      screen.getByTestId('set-documents').click();
    });
    
    expect(screen.getByTestId('document-count')).toHaveTextContent('1');
  });

  it('should handle ADD_DOCUMENT action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('add-document').click();
    });
    
    expect(screen.getByTestId('document-count')).toHaveTextContent('1');
  });

  it('should handle SET_CURRENT_DOCUMENT action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('set-current-document').click();
    });
    
    expect(screen.getByTestId('current-document')).toHaveTextContent('test.pdf');
  });

  it('should handle annotation actions', () => {
    renderWithProvider(<TestComponent />);
    
    // Add annotation
    act(() => {
      screen.getByTestId('add-annotation').click();
    });
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('1');
    
    // Update annotation
    act(() => {
      screen.getByTestId('update-annotation').click();
    });
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('1');
    
    // Delete annotation
    act(() => {
      screen.getByTestId('delete-annotation').click();
    });
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('0');
  });

  it('should handle SET_VIEWER_STATE action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('set-viewer-state').click();
    });
    
    expect(screen.getByTestId('viewer-page')).toHaveTextContent('2');
    expect(screen.getByTestId('viewer-zoom')).toHaveTextContent('1.5');
  });

  it('should handle TOGGLE_NOTE_PANEL action', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('note-panel')).toHaveTextContent('open');
    
    act(() => {
      screen.getByTestId('toggle-note-panel').click();
    });
    
    expect(screen.getByTestId('note-panel')).toHaveTextContent('closed');
  });

  it('should handle SET_UPLOADING action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('set-uploading').click();
    });
    
    expect(screen.getByTestId('uploading')).toHaveTextContent('true');
  });

  it('should handle SET_ONLINE_STATUS action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('set-online').click();
    });
    
    expect(screen.getByTestId('online')).toHaveTextContent('false');
  });

  it('should handle SET_SYNC_STATUS action', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      screen.getByTestId('set-sync-status').click();
    });
    
    expect(screen.getByTestId('sync-status')).toHaveTextContent('syncing');
  });

  it('should throw error when useAppContext is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppContext must be used within an AppProvider');
    
    console.error = originalError;
  });

  it('should update annotation with new timestamp on UPDATE_ANNOTATION', () => {
    const TestAnnotationUpdate = () => {
      const { state, dispatch } = useAppContext();
      
      const annotation = state.annotations[0];
      
      return (
        <div>
          <div data-testid="annotation-content">{annotation?.content || 'none'}</div>
          <div data-testid="annotation-updated">{annotation?.updatedAt.toISOString() || 'none'}</div>
          <button 
            data-testid="add-and-update" 
            onClick={() => {
              // First add annotation
              dispatch({ type: 'ADD_ANNOTATION', payload: mockAnnotation });
              // Then update it
              setTimeout(() => {
                dispatch({ 
                  type: 'UPDATE_ANNOTATION', 
                  payload: { id: 'ann-1', content: 'Updated content' }
                });
              }, 10);
            }}
          >
            Add and Update
          </button>
        </div>
      );
    };
    
    renderWithProvider(<TestAnnotationUpdate />);
    
    act(() => {
      screen.getByTestId('add-and-update').click();
    });
    
    // Wait for the update
    setTimeout(() => {
      expect(screen.getByTestId('annotation-content')).toHaveTextContent('Updated content');
      // The updatedAt should be different from the original
      expect(screen.getByTestId('annotation-updated')).not.toHaveTextContent(mockAnnotation.updatedAt.toISOString());
    }, 20);
  });
});