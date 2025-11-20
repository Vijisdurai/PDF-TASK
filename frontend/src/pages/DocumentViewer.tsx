import React, { useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useAnnotations } from '../hooks/useAnnotations';
import { useToast } from '../components/ToastContainer';
import DocumentViewer from '../components/DocumentViewer';
import { apiService } from '../services/api';

interface AnnotationPoint {
  id: string;
  x: number;
  y: number;
  page?: number;
  content?: string;
  timestamp: number;
}

const DocumentViewerPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  
  const {
    createAnnotation,
  } = useAnnotations(documentId);

  // Find the document by ID
  const document = state.documents.find(doc => doc.id === documentId);

  // Set current document when component mounts
  useEffect(() => {
    if (document) {
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: document });
    }
  }, [document, dispatch]);

  // Handle annotation creation
  const handleAnnotationCreate = useCallback(async (annotation: Omit<AnnotationPoint, 'id' | 'timestamp'>) => {
    if (!documentId) return;

    const newAnnotation: Omit<import('../contexts/AppContext').DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
      documentId,
      type: 'document',
      xPercent: annotation.x,
      yPercent: annotation.y,
      page: annotation.page || state.viewerState.currentPage,
      content: annotation.content || '',
    };

    try {
      await createAnnotation(newAnnotation);
      showToast('Annotation created', 'success', 2000);
    } catch (error) {
      console.error('Failed to save annotation:', error);
      showToast('Failed to create annotation', 'error');
    }
  }, [documentId, createAnnotation, state.viewerState.currentPage, showToast]);

  // Handle annotation click
  const handleAnnotationClick = useCallback((annotation: AnnotationPoint) => {
    // For now, just log the annotation click
    // Later this will open an edit dialog
    console.log('Annotation clicked:', annotation);
  }, []);

  if (!document) {
    return <Navigate to="/" replace />;
  }

  const documentAnnotations = state.annotations.filter(a => a.documentId === documentId);
  const currentPageAnnotations = documentAnnotations.filter(a => a.page === state.viewerState.currentPage);

  // Convert database annotations to overlay format
  const overlayAnnotations: AnnotationPoint[] = documentAnnotations.map(ann => ({
    id: ann.id,
    x: ann.xPercent,
    y: ann.yPercent,
    page: ann.page,
    content: ann.content,
    timestamp: ann.createdAt.getTime()
  }));

  // Construct document URL for viewing using the API service
  const documentUrl = apiService.getDocumentFileUrl(document.id);
  
  // Determine the effective MIME type - if document has been converted to PDF, use PDF MIME type
  const effectiveMimeType = document.convertedPath ? 'application/pdf' : document.mimeType;
  const effectiveFilename = document.convertedPath 
    ? `${document.originalFilename || document.filename}.pdf`
    : (document.originalFilename || document.filename);

  return (
    <div className="flex min-h-full">
      {/* Main viewer area */}
      <div className="flex-1 bg-navy-800 border-r border-navy-700">
        <DocumentViewer
          documentId={document.id}
          documentUrl={documentUrl}
          mimeType={effectiveMimeType}
          filename={effectiveFilename}
          onAnnotationCreate={handleAnnotationCreate}
          annotations={overlayAnnotations}
          onAnnotationClick={handleAnnotationClick}
        />
      </div>

      {/* Notes panel */}
      {state.isNotePanelOpen && (
        <div className="w-80 bg-navy-900 border-l border-navy-700 flex flex-col">
          <div className="p-4 border-b border-navy-700">
            <h3 className="text-lg font-semibold text-off-white mb-2">
              Annotations
            </h3>
            <div className="text-sm text-gray-400">
              Page {state.viewerState.currentPage}: {currentPageAnnotations.length} notes
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {currentPageAnnotations.length > 0 ? (
              <div className="space-y-3">
                {currentPageAnnotations.map((annotation) => (
                  <div 
                    key={annotation.id}
                    className="bg-navy-800 rounded-lg p-3 border border-navy-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">
                        {annotation.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-off-white text-sm">
                      {annotation.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Position: {annotation.xPercent.toFixed(1)}%, {annotation.yPercent.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p>No annotations on this page</p>
                <p className="text-sm mt-2">Click on the document to add notes</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-navy-700">
            <div className="text-xs text-gray-400 text-center">
              Total annotations: {documentAnnotations.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewerPage;