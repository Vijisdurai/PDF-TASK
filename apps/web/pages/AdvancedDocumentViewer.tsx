import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { apiService } from '@/services/api';
import PDFViewer from '@/viewers/pdf/PDFViewer';
import ImageViewer from '@/viewers/image/ImageViewer';
import type { DocumentMetadata } from '@/contexts/AppContext';

/**
 * AdvancedDocumentViewer - Route component for viewing documents
 * 
 * This component:
 * - Accepts documentId as a route parameter
 * - Fetches document metadata from the API
 * - Detects document type (PDF vs Image) based on MIME type
 * - Conditionally renders PdfViewer or ImageViewer
 * 
 * Requirements: 1.1, 2.1
 */
const AdvancedDocumentViewer: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { state, dispatch } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);

  // Fetch document metadata when component mounts or documentId changes
  useEffect(() => {
    const fetchDocumentMetadata = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First check if document exists in state
        const existingDoc = state.documents.find(doc => doc.id === documentId);
        
        if (existingDoc) {
          setDocumentMetadata(existingDoc);
          dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: existingDoc });
        } else {
          // Fetch from API if not in state
          const doc = await apiService.getDocument(documentId);
          setDocumentMetadata(doc);
          dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: doc });
          dispatch({ type: 'ADD_DOCUMENT', payload: doc });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching document metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setIsLoading(false);
      }
    };

    fetchDocumentMetadata();
  }, [documentId, dispatch, state.documents]);

  // Detect document type based on MIME type
  // Requirements: 1.1 (PDF), 2.1 (Image)
  const documentType = useMemo(() => {
    if (!documentMetadata) return null;

    const mimeType = documentMetadata.mimeType.toLowerCase();

    // Check if document was converted to PDF
    if (documentMetadata.convertedPath) {
      return 'pdf';
    }

    // Detect PDF documents
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }

    // Detect image documents
    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    // Unsupported type
    return 'unsupported';
  }, [documentMetadata]);

  // Get document file URL
  const documentUrl = useMemo(() => {
    if (!documentId) return '';
    return apiService.getDocumentFileUrl(documentId);
  }, [documentId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-800">
        <div className="text-center">
          <div className="w-2 h-2 bg-ocean-blue rounded-full mx-auto mb-4 opacity-75" />
          <p className="text-off-white text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !documentMetadata) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-800">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error Loading Document</p>
          <p>{error || 'Document not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-ocean-blue hover:bg-ocean-blue/80 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Redirect to home if no documentId
  if (!documentId) {
    return <Navigate to="/" replace />;
  }

  // Conditional rendering based on document type
  // Requirements: 1.1 (PDF Viewer), 2.1 (Image Viewer)
  // 
  // Note: Both PDFViewer and ImageViewer support panning when zoomed in:
  // - PDFViewer: Panning enabled when zoomScale !== 1.0, uses mouse drag
  // - ImageViewer: Panning always available, uses pointer events with clamping
  const renderViewer = () => {
    switch (documentType) {
      case 'pdf':
        return (
          <div className="h-full">
            <PDFViewer
              documentUrl={documentUrl}
              documentId={documentId}
              currentPage={state.viewerState.currentPage}
              zoomScale={state.viewerState.zoomScale}
              onPageChange={(page) => {
                dispatch({
                  type: 'SET_VIEWER_STATE',
                  payload: { currentPage: page }
                });
              }}
              onZoomChange={(scale) => {
                dispatch({
                  type: 'SET_VIEWER_STATE',
                  payload: { zoomScale: scale }
                });
              }}
              onDocumentLoad={(totalPages) => {
                dispatch({
                  type: 'SET_VIEWER_STATE',
                  payload: { 
                    totalPages,
                    isLoading: false,
                    // Reset to page 1 if current page exceeds total
                    ...(state.viewerState.currentPage > totalPages ? { currentPage: 1 } : {})
                  }
                });
              }}
            />
          </div>
        );

      case 'image':
        return (
          <div className="h-full">
            <ImageViewer
              documentUrl={documentUrl}
              documentId={documentId}
              zoomScale={state.viewerState.zoomScale}
              onZoomChange={(scale) => {
                dispatch({
                  type: 'SET_VIEWER_STATE',
                  payload: { zoomScale: scale }
                });
              }}
            />
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex items-center justify-center h-full bg-navy-800">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-off-white mb-2">
                Unsupported File Type
              </h3>
              <p className="mb-2">
                Cannot display files of type: {documentMetadata.mimeType}
              </p>
              <p className="text-sm">
                Supported formats: PDF, PNG, JPG, JPEG, GIF, WebP
              </p>
              <div className="mt-4 p-3 bg-navy-900 rounded-lg border border-navy-700">
                <p className="text-sm font-medium text-off-white">
                  {documentMetadata.originalFilename || documentMetadata.filename}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {documentMetadata.mimeType}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full bg-navy-800">
            <div className="text-center text-gray-400">
              <div className="w-2 h-2 bg-ocean-blue rounded-full mx-auto mb-4 opacity-75" />
              <p className="text-off-white text-sm">Loading document...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-navy-800">
      {renderViewer()}
    </div>
  );
};

export default AdvancedDocumentViewer;
