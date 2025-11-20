import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import { useAnnotations } from '../hooks/useAnnotations';
import PDFViewer from './PDFViewer';
import mammoth from 'mammoth';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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
  
  // Use annotations hook
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    error: annotationError
  } = useAnnotations(documentId);

  // Unified viewer state for non-PDF documents
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [docxPages, setDocxPages] = useState<string[]>([]);
  const [docxCurrentPage, setDocxCurrentPage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine viewer type based on MIME type and file extension
  const viewerType = useMemo(() => {
    if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      filename.toLowerCase().endsWith('.docx') ||
      filename.toLowerCase().endsWith('.doc')
    ) {
      return 'docx';
    } else {
      return 'unsupported';
    }
  }, [mimeType, filename]);

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
  const handleAnnotationCreate = useCallback(async (xPercent: number, yPercent: number, content: string) => {
    const newAnnotation: Omit<import('../contexts/AppContext').DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'document',
      documentId,
      xPercent,
      yPercent,
      page: viewerState.currentPage,
      content
    };
    await createAnnotation(newAnnotation);
  }, [createAnnotation, documentId, viewerState.currentPage]);

  const handleAnnotationUpdate = useCallback(async (id: string, content: string) => {
    await updateAnnotation(id, { content });
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

  // Load DOCX content when needed
  useEffect(() => {
    if (viewerType === 'docx' && documentUrl) {
      setDocxLoading(true);
      setDocxError(null);
      
      fetch(documentUrl)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => 
          mammoth.convertToHtml({ arrayBuffer }, {
            styleMap: [
              "p[style-name='Normal'] => p:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh", 
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Title'] => h1.title:fresh",
              "r[style-name='Strong'] => strong:fresh",
              "r[style-name='Emphasis'] => em:fresh"
            ]
          })
        )
        .then(result => {
          const html = result.value;
          setDocxHtml(html);
          
          // Split into pages based on page breaks or content length
          const pageBreaks = html.split(/<hr\s*\/?>/i);
          if (pageBreaks.length > 1) {
            setDocxPages(pageBreaks);
          } else {
            // If no explicit page breaks, split by content length
            const words = html.split(' ');
            const wordsPerPage = 500; // Approximate words per page
            const pages = [];
            for (let i = 0; i < words.length; i += wordsPerPage) {
              pages.push(words.slice(i, i + wordsPerPage).join(' '));
            }
            setDocxPages(pages.length > 1 ? pages : [html]);
          }
          
          setDocxCurrentPage(0);
          setDocxLoading(false);
          handleDocumentLoad(pageBreaks.length > 1 ? pageBreaks.length : Math.ceil(html.split(' ').length / 500));
        })
        .catch(err => {
          console.error('Error loading DOCX:', err);
          setDocxError('Failed to load Word document');
          setDocxLoading(false);
        });
    }
  }, [viewerType, documentUrl, handleDocumentLoad]);

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
    handleDocumentLoad(1);
  }, [handleDocumentLoad]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: { isLoading: false }
    });
  }, [dispatch]);

  // Unified zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(3, viewerState.zoomScale + 0.25);
    handleZoomChange(newScale);
  }, [viewerState.zoomScale, handleZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(0.25, viewerState.zoomScale - 0.25);
    handleZoomChange(newScale);
  }, [viewerState.zoomScale, handleZoomChange]);

  const handleResetZoom = useCallback(() => {
    handleZoomChange(1);
    handlePanChange({ x: 0, y: 0 });
  }, [handleZoomChange, handlePanChange]);

  // DOCX page navigation
  const handleDocxPrevPage = useCallback(() => {
    if (docxCurrentPage > 0) {
      setDocxCurrentPage(docxCurrentPage - 1);
    }
  }, [docxCurrentPage]);

  const handleDocxNextPage = useCallback(() => {
    if (docxCurrentPage < docxPages.length - 1) {
      setDocxCurrentPage(docxCurrentPage + 1);
    }
  }, [docxCurrentPage, docxPages.length]);

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
            annotations={annotations.filter((ann): ann is import('../contexts/AppContext').DocumentAnnotation => 
              ann.type === 'document'
            )}
            onAnnotationClick={handleAnnotationClick}
          />
        );
      
      case 'image':
        if (imageError) {
          return (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-red-400">
                <p className="text-lg font-semibold mb-2">Failed to load image</p>
                <p>The image could not be displayed</p>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div 
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Image Toolbar */}
            <motion.div 
              className="bg-navy-900 border-b border-navy-700 p-3 flex items-center justify-between"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-off-white text-sm">Image Viewer</span>
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleZoomOut}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ZoomOut size={16} />
                </motion.button>
                
                <motion.span 
                  className="text-off-white text-sm px-3 min-w-[60px] text-center"
                  key={Math.round(viewerState.zoomScale * 100)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {Math.round(viewerState.zoomScale * 100)}%
                </motion.span>
                
                <motion.button
                  onClick={handleZoomIn}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ZoomIn size={16} />
                </motion.button>
                
                <motion.button
                  onClick={handleResetZoom}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <RotateCcw size={16} />
                </motion.button>
              </div>
            </motion.div>

            {/* Image Container */}
            <div 
              ref={containerRef}
              className="flex-1 bg-navy-800 overflow-auto flex justify-center items-center"
              style={{ cursor: 'grab' }}
            >
              <motion.img
                src={documentUrl}
                alt={filename}
                className="max-w-none object-contain shadow-lg"
                style={{
                  transform: `scale(${viewerState.zoomScale}) translate(${viewerState.panOffset.x}px, ${viewerState.panOffset.y}px)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        );
      
      case 'docx':
        if (docxLoading) {
          return (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-ocean-blue mx-auto mb-4 animate-spin" />
                <p className="text-off-white">Converting Word document...</p>
              </div>
            </motion.div>
          );
        }

        if (docxError) {
          return (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-red-400">
                <p className="text-lg font-semibold mb-2">Failed to load document</p>
                <p>{docxError}</p>
              </div>
            </motion.div>
          );
        }

        if (docxPages.length === 0) {
          return (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-gray-400">
                <p>No content to display</p>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div 
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* DOCX Toolbar */}
            <motion.div 
              className="bg-navy-900 border-b border-navy-700 p-3 flex items-center justify-between"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center space-x-2">
                {docxPages.length > 1 && (
                  <>
                    <motion.button
                      onClick={handleDocxPrevPage}
                      disabled={docxCurrentPage === 0}
                      className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      <ChevronLeft size={16} />
                    </motion.button>

                    <span className="text-off-white text-sm px-3">
                      Page {docxCurrentPage + 1} / {docxPages.length}
                    </span>

                    <motion.button
                      onClick={handleDocxNextPage}
                      disabled={docxCurrentPage >= docxPages.length - 1}
                      className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      <ChevronRight size={16} />
                    </motion.button>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleZoomOut}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ZoomOut size={16} />
                </motion.button>
                
                <motion.span 
                  className="text-off-white text-sm px-3 min-w-[60px] text-center"
                  key={Math.round(viewerState.zoomScale * 100)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {Math.round(viewerState.zoomScale * 100)}%
                </motion.span>
                
                <motion.button
                  onClick={handleZoomIn}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ZoomIn size={16} />
                </motion.button>
                
                <motion.button
                  onClick={handleResetZoom}
                  className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <RotateCcw size={16} />
                </motion.button>
              </div>
            </motion.div>

            {/* DOCX Content */}
            <div className="flex-1 bg-white overflow-auto">
              <div 
                className="max-w-4xl mx-auto p-8"
                style={{
                  transform: `scale(${viewerState.zoomScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease'
                }}
              >
                <motion.div
                  className="prose prose-lg max-w-none"
                  style={{
                    color: '#1f2937',
                    lineHeight: '1.7',
                    fontFamily: 'Georgia, serif'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  dangerouslySetInnerHTML={{ 
                    __html: docxPages[docxCurrentPage] || docxHtml 
                  }}
                />
              </div>
            </div>
          </motion.div>
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
                Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX
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