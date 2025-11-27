import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import { useAnnotations } from '../hooks/useAnnotations';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import DocxViewer from './DocxViewer';
import { Loader2 } from 'lucide-react';

interface DocumentViewerProps {
  documentId: string;
  documentUrl: string;
  mimeType: string;
  filename: string;
  onAnnotationClick?: (annotation: any) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  documentUrl,
  mimeType,
  filename,
  onAnnotationClick
}) => {
  const { state, dispatch } = useAppContext();
  const { viewerState, currentDocument } = state;

  // Use annotations hook
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useAnnotations(documentId);

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

  const handleDocumentLoad = useCallback((totalPages?: number) => {
    dispatch({
      type: 'SET_VIEWER_STATE',
      payload: {
        isLoading: false,
        totalPages: totalPages || 0,
        // Reset to page 1 if this is a new document
        ...(totalPages && viewerState.currentPage > totalPages ? { currentPage: 1 } : {})
      }
    });
  }, [dispatch, viewerState.currentPage]);

  // Annotation handlers
  const handleAnnotationCreate = useCallback(async (xPercent: number, yPercent: number, content: string, color: string) => {
    if (!currentDocument) return;

    const newAnnotation: Omit<import('../contexts/AppContext').DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'document',
      documentId,
      xPercent,
      yPercent,
      page: viewerState.currentPage,
      content,
      color
    };
    await createAnnotation(newAnnotation);
  }, [createAnnotation, documentId, viewerState.currentPage, currentDocument]);

  const handleAnnotationUpdate = useCallback(async (id: string, content: string) => {
    await updateAnnotation(id, { content });
  }, [updateAnnotation]);

  const handleAnnotationDelete = useCallback(async (id: string) => {
    await deleteAnnotation(id);
  }, [deleteAnnotation]);

  const handleAnnotationClick = useCallback((annotation: any) => {
    // Call the parent's annotation click handler
    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }
  }, [onAnnotationClick]);

  // Set loading state when document changes (skip for images)
  React.useEffect(() => {
    if (viewerType !== 'image') {
      dispatch({
        type: 'SET_VIEWER_STATE',
        payload: { isLoading: true }
      });
    }
  }, [documentId, dispatch, viewerType]);

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
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
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
        // Immediately set loading to false for images
        if (viewerState.isLoading) {
          handleDocumentLoad(1);
        }

        return (
          <ImageViewer
            documentUrl={documentUrl}
            documentId={documentId}
            zoomScale={viewerState.zoomScale}
            onZoomChange={handleZoomChange}
            annotations={annotations.filter((ann): ann is import('../contexts/AppContext').ImageAnnotation =>
              ann.type === 'image'
            )}
            onAnnotationCreate={async (xPixel, yPixel, content, color) => {
              const newAnnotation: Omit<import('../contexts/AppContext').ImageAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
                type: 'image',
                documentId,
                xPixel,
                yPixel,
                content,
                color
              };
              await createAnnotation(newAnnotation);
            }}
            onAnnotationUpdate={async (id, updates) => {
              await updateAnnotation(id, updates);
            }}
            onAnnotationDelete={async (id) => {
              await deleteAnnotation(id);
            }}
            onAnnotationClick={handleAnnotationClick}
          />
        );

      case 'docx':
        return (
          <DocxViewer
            documentUrl={documentUrl}
            documentId={documentId}
            filename={filename}
            currentPage={viewerState.currentPage}
            zoomScale={viewerState.zoomScale}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
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
    <div className="relative h-full bg-navy-800 overflow-hidden">
      {/* Document Viewer */}
      <div className="h-full overflow-hidden">
        {viewerType === 'image' ? (
          // Render images instantly without animations
          <div className="h-full overflow-hidden">
            {renderViewer()}
          </div>
        ) : (
          // Use animations for other document types
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
        )}
      </div>

      {/* Loading overlay - skip for images */}
      <AnimatePresence>
        {viewerState.isLoading && viewerType !== 'image' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-ocean-blue animate-spin mx-auto mb-4" />
              <p className="text-off-white font-medium">Loading document...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};export default DocumentViewer;