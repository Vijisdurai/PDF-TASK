import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import { useAnnotations } from '../hooks/useAnnotations';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import { Eye, EyeOff } from 'lucide-react';

interface DocumentViewerProps {
  documentId: string;
  documentUrl: string;
  mimeType: string;
  filename: string;
}

interface ViewerControlsProps {
  isNotePanelOpen: boolean;
  onToggleNotePanel: () => void;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  isNotePanelOpen,
  onToggleNotePanel
}) => {
  return (
    <motion.div 
      className="absolute top-4 right-4 z-10"
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <motion.button
        onClick={onToggleNotePanel}
        className="p-2 rounded-lg bg-navy-900/80 backdrop-blur-sm text-off-white hover:bg-navy-800/80 border border-navy-700/50 shadow-lg"
        title={isNotePanelOpen ? 'Hide Notes Panel' : 'Show Notes Panel'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isNotePanelOpen ? 'hide' : 'show'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isNotePanelOpen ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  documentUrl,
  mimeType,
  filename
}) => {
  const { state, dispatch } = useAppContext();
  const { viewerState, isNotePanelOpen } = state;
  
  // Use annotations hook for local storage
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsForPage,
    error: annotationError
  } = useAnnotations(documentId);

  // Determine viewer type based on MIME type
  const viewerType = useMemo(() => {
    if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else {
      return 'unsupported';
    }
  }, [mimeType]);

  // Viewer state handlers
  const handlePageChange = useCallback((page: number) => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { currentPage: page }
    });
  }, [dispatch]);

  const handleZoomChange = useCallback((scale: number) => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { zoomScale: scale }
    });
  }, [dispatch]);

  const handlePanChange = useCallback((offset: { x: number; y: number }) => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { panOffset: offset }
    });
  }, [dispatch]);

  const handleDocumentLoad = useCallback((totalPages?: number) => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { 
        isLoading: false,
        // Reset to page 1 if this is a new document
        ...(totalPages && viewerState.currentPage > totalPages ? { currentPage: 1 } : {})
      }
    });
  }, [dispatch, viewerState.currentPage]);

  const handleToggleNotePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTE_PANEL' });
  }, [dispatch]);

  // Annotation handlers
  const handleAnnotationCreate = useCallback(async (annotation: {
    xPercent: number;
    yPercent: number;
    page: number;
    content: string;
  }) => {
    await createAnnotation({
      documentId,
      xPercent: annotation.xPercent,
      yPercent: annotation.yPercent,
      page: annotation.page,
      content: annotation.content
    });
  }, [createAnnotation, documentId]);

  const handleAnnotationUpdate = useCallback(async (id: string, content: string) => {
    await updateAnnotation(id, content);
  }, [updateAnnotation]);

  const handleAnnotationDelete = useCallback(async (id: string) => {
    await deleteAnnotation(id);
  }, [deleteAnnotation]);

  const handleAnnotationClick = useCallback((annotation: any) => {
    // Handle annotation click - could open notes panel or focus annotation
    console.log('Annotation clicked:', annotation);
  }, []);

  // Set loading state when document changes
  React.useEffect(() => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { isLoading: true }
    });
  }, [documentId, dispatch]);

  // Render appropriate viewer based on document type
  const renderViewer = () => {
    switch (viewerType) {
      case 'pdf':
        return (
          <PDFViewer
            documentUrl={documentUrl}
            documentId={documentId}
            currentPage={viewerState.currentPage}
            zoomScale={viewerState.zoomScale}
            panOffset={viewerState.panOffset}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
            onPanChange={handlePanChange}
            onDocumentLoad={handleDocumentLoad}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            annotations={getAnnotationsForPage(viewerState.currentPage)}
            onAnnotationClick={handleAnnotationClick}
          />
        );
      
      case 'image':
        return (
          <ImageViewer
            documentUrl={documentUrl}
            documentId={documentId}
            zoomScale={viewerState.zoomScale}
            panOffset={viewerState.panOffset}
            onZoomChange={handleZoomChange}
            onPanChange={handlePanChange}
            onDocumentLoad={handleDocumentLoad}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            annotations={annotations.filter(a => a.page === 1)} // Images only have page 1
            onAnnotationClick={handleAnnotationClick}
          />
        );
      
      case 'unsupported':
        return (
          <motion.div 
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center text-gray-400">
              <motion.div 
                className="text-6xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              >
                📄
              </motion.div>
              <motion.h3 
                className="text-xl font-semibold text-off-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                Unsupported File Type
              </motion.h3>
              <motion.p 
                className="mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                Cannot display files of type: {mimeType}
              </motion.p>
              <motion.p 
                className="text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                Supported formats: PDF, PNG, JPG, JPEG
              </motion.p>
              <motion.div 
                className="mt-4 p-3 bg-navy-800 rounded-lg border border-navy-700"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <p className="text-sm font-medium text-off-white">{filename}</p>
                <p className="text-xs text-gray-400 mt-1">{mimeType}</p>
              </motion.div>
            </div>
          </motion.div>
        );
      
      default:
        return (
          <motion.div 
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center text-gray-400">
              <motion.div 
                className="rounded-full h-12 w-12 border-b-2 border-ocean-blue mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-off-white">Loading document...</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative h-full bg-navy-800">
      {/* Viewer Controls */}
      <ViewerControls
        isNotePanelOpen={isNotePanelOpen}
        onToggleNotePanel={handleToggleNotePanel}
      />
      
      {/* Document Viewer */}
      <div className="h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${documentId}-${viewerType}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderViewer()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Loading overlay */}
      <AnimatePresence>
        {viewerState.isLoading && (
          <motion.div 
            className="absolute inset-0 bg-navy-800/80 backdrop-blur-sm flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <motion.div 
                className="rounded-full h-12 w-12 border-b-2 border-ocean-blue mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p 
                className="text-off-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                Loading {filename}...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentViewer;