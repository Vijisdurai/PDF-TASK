import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

// Types for application state
export interface DocumentMetadata {
  id: string;
  filename: string;
  originalFilename?: string; // The original filename before processing
  mimeType: string;
  size: number;
  uploadedAt: Date;
  convertedPath?: string;
}

export interface Annotation {
  id: string;
  documentId: string;
  page: number;
  xPercent: number;
  yPercent: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewerState {
  currentPage: number;
  zoomScale: number;
  panOffset: { x: number; y: number };
  isLoading: boolean;
}

export interface AppState {
  // Document management
  documents: DocumentMetadata[];
  currentDocument: DocumentMetadata | null;
  
  // Annotation management
  annotations: Annotation[];
  
  // Viewer state
  viewerState: ViewerState;
  
  // UI state
  isNotePanelOpen: boolean;
  isUploading: boolean;
  
  // Network state
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

// Action types
export type AppAction =
  | { type: 'SET_DOCUMENTS'; payload: DocumentMetadata[] }
  | { type: 'ADD_DOCUMENT'; payload: DocumentMetadata }
  | { type: 'SET_CURRENT_DOCUMENT'; payload: DocumentMetadata | null }
  | { type: 'SET_ANNOTATIONS'; payload: Annotation[] }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; content: string } }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'SET_VIEWER_STATE'; payload: Partial<ViewerState> }
  | { type: 'TOGGLE_NOTE_PANEL' }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: AppState['syncStatus'] };

// Initial state
const initialState: AppState = {
  documents: [],
  currentDocument: null,
  annotations: [],
  viewerState: {
    currentPage: 1,
    zoomScale: 1,
    panOffset: { x: 0, y: 0 },
    isLoading: false,
  },
  isNotePanelOpen: true,
  isUploading: false,
  isOnline: navigator.onLine,
  syncStatus: 'idle',
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    
    case 'ADD_DOCUMENT':
      return { 
        ...state, 
        documents: [...state.documents, action.payload] 
      };
    
    case 'SET_CURRENT_DOCUMENT':
      return { ...state, currentDocument: action.payload };
    
    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.payload };
    
    case 'ADD_ANNOTATION':
      return { 
        ...state, 
        annotations: [...state.annotations, action.payload] 
      };
    
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map(annotation =>
          annotation.id === action.payload.id
            ? { ...annotation, content: action.payload.content, updatedAt: new Date() }
            : annotation
        ),
      };
    
    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(annotation => annotation.id !== action.payload),
      };
    
    case 'SET_VIEWER_STATE':
      return {
        ...state,
        viewerState: { ...state.viewerState, ...action.payload },
      };
    
    case 'TOGGLE_NOTE_PANEL':
      return { ...state, isNotePanelOpen: !state.isNotePanelOpen };
    
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    
    default:
      return state;
  }
}

// Context creation
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}