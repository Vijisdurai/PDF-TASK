import React, { useEffect, useCallback, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../contexts/AppContext';
import { useAnnotations } from '../hooks/useAnnotations';
import { useToast } from '../components/ToastContainer';
import { EditAnnotationModal } from '../components/EditAnnotationModal';
import DocumentViewer from '../components/DocumentViewer';
import { apiService } from '../services/api';
import type { Annotation } from '../contexts/AppContext';

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
    updateAnnotation,
    deleteAnnotation,
  } = useAnnotations(documentId);

  const [selectedNote, setSelectedNote] = useState<Annotation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<{ content: string; color?: string } | null>(null);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedContent, setEditedContent] = useState('');

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

  // Get document annotations
  const documentAnnotations = state.annotations.filter(a => a.documentId === documentId);
  const currentPageAnnotations = documentAnnotations.filter(a => 
    a.type === 'document' && a.page === state.viewerState.currentPage
  );

  // Handle annotation click from marker
  const handleAnnotationClick = useCallback((annotation: AnnotationPoint) => {
    const fullAnnotation = state.annotations.find(a => a.id === annotation.id);
    if (fullAnnotation) {
      // Open notes panel if it's closed
      if (!state.isNotePanelOpen) {
        dispatch({ type: 'TOGGLE_NOTE_PANEL' });
      }
      setSelectedNote(fullAnnotation);
    }
  }, [state.annotations, state.isNotePanelOpen, dispatch]);

  // Handle note click from list
  const handleNoteClick = useCallback((annotation: Annotation) => {
    setIsEditingInline(false); // Ensure we're not in edit mode
    setEditedContent(''); // Clear any edited content
    setSelectedNote(annotation);
  }, []);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setIsEditingInline(false); // Reset edit mode
    setEditedContent(''); // Clear edited content
    setSelectedNote(null);
  }, []);

  // Handle edit button click - enable inline editing
  const handleEditClick = useCallback(() => {
    if (selectedNote) {
      setIsEditingInline(true);
      setEditedContent(selectedNote.content);
    }
  }, [selectedNote]);

  // Handle inline edit save
  const handleInlineSave = useCallback(() => {
    setPendingUpdates({ content: editedContent });
    setShowSaveConfirm(true);
  }, [editedContent]);

  // Handle inline edit cancel
  const handleInlineCancel = useCallback(() => {
    setIsEditingInline(false);
    setEditedContent('');
  }, []);

  // Handle edit modal save - show confirmation
  const handleEditSave = useCallback((updates: { content: string; color?: string }) => {
    setPendingUpdates(updates);
    setShowSaveConfirm(true);
  }, []);

  // Confirm save
  const confirmSave = useCallback(async () => {
    if (selectedNote && pendingUpdates) {
      try {
        await updateAnnotation(selectedNote.id, pendingUpdates);
        showToast('Note updated', 'success', 2000);
        setShowEditModal(false);
        setShowSaveConfirm(false);
        setPendingUpdates(null);
        setIsEditingInline(false);
        setEditedContent('');
        setSelectedNote(null);
      } catch (error) {
        console.error('Failed to update note:', error);
        showToast('Failed to update note', 'error');
      }
    }
  }, [selectedNote, pendingUpdates, updateAnnotation, showToast]);

  // Handle edit modal delete
  const handleEditDelete = useCallback(async () => {
    if (selectedNote) {
      // Close modals and navigate back immediately for smooth UX
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      setSelectedNote(null);
      
      // Then perform the delete operation in the background
      try {
        await deleteAnnotation(selectedNote.id);
        showToast('Note deleted', 'success', 2000);
      } catch (error) {
        console.error('Failed to delete note:', error);
        showToast('Failed to delete note', 'error');
      }
    }
  }, [selectedNote, deleteAnnotation, showToast]);

  if (!document) {
    return <Navigate to="/" replace />;
  }

  // Convert database annotations to overlay format
  const overlayAnnotations: AnnotationPoint[] = documentAnnotations
    .filter((ann): ann is import('../contexts/AppContext').DocumentAnnotation => ann.type === 'document')
    .map(ann => ({
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

  const toggleNotesPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTE_PANEL' });
  }, [dispatch]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main viewer area - no scroll, DocumentViewer handles its own scrolling */}
      <div 
        className="flex-1 bg-navy-800 border-r border-navy-700 overflow-hidden"
        style={{ marginRight: state.isNotePanelOpen ? '320px' : '0' }}
      >
        <DocumentViewer
          documentId={document.id}
          documentUrl={documentUrl}
          mimeType={effectiveMimeType}
          filename={effectiveFilename}
          onAnnotationClick={handleAnnotationClick}
        />
      </div>

      {/* Notes panel toggle button - positioned at middle of panel edge */}
      <button
        onClick={toggleNotesPanel}
        className="fixed top-1/2 -translate-y-1/2 z-50 bg-navy-800 hover:bg-navy-700 text-off-white p-2 rounded-l-lg border border-r-0 border-navy-700 shadow-lg transition-all"
        style={{ right: state.isNotePanelOpen ? '320px' : '0' }}
        title={state.isNotePanelOpen ? 'Hide notes' : 'Show notes'}
      >
        {state.isNotePanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Notes panel - fixed sidebar */}
      {state.isNotePanelOpen && (
        <div className="w-80 bg-navy-900 flex flex-col fixed right-0 top-0 h-screen">
          {/* Header - fixed, matches main nav bar height, aligned with main nav */}
          <div className="px-4 py-3 border-b border-navy-700 border-l border-navy-700 flex-shrink-0">
            {selectedNote ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToList}
                    className="p-1.5 hover:bg-navy-800 rounded-lg transition-colors "
                    title="Back to notes"
                  >
                    <ArrowLeft size={18} className="text-gray-400" />
                  </button>
                  <h3 className="text-base font-semibold text-off-white">
                    Note Details
                  </h3>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-off-white mt-[5px] mb-[5px]">
                  Notes
                </h3>
                <div className="text-xs text-gray-400">
                  Page {state.viewerState.currentPage} • {currentPageAnnotations.length} {currentPageAnnotations.length === 1 ? 'note' : 'notes'}
                </div>
              </div>
            )}
          </div>
          
          {/* Content - scrollable, takes remaining space */}
          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 border-l border-navy-700">
            {selectedNote ? (
              /* Note detail view */
              <div className="h-full flex flex-col">
                {/* Note content - editable or display - takes full height */}
                <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex flex-col">
                  {isEditingInline ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 w-full bg-transparent text-off-white text-sm leading-relaxed resize-none focus:outline-none placeholder-gray-500"
                      placeholder="Enter note content..."
                      autoFocus
                    />
                  ) : (
                    <div className="text-off-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {selectedNote.content}
                    </div>
                  )}
                </div>

                {/* Metadata footer - timestamp left, user right */}
                {!isEditingInline && (
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{format(new Date(selectedNote.createdAt), 'MMM dd, yyyy • h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>User</span>
                    </div>
                  </div>
                )}
                
                {!isEditingInline && selectedNote.type === 'image' && selectedNote.color && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Marker Color</span>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-5 h-5 rounded border border-white/30"
                        style={{ backgroundColor: selectedNote.color }}
                      />
                      <span className="text-off-white text-xs font-mono">
                        {selectedNote.color.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Notes list view */
              currentPageAnnotations.length > 0 ? (
                <div className="space-y-2.5">
                  {currentPageAnnotations.map((annotation, index) => (
                    <div 
                      key={annotation.id}
                      className="flex gap-3 items-start"
                    >
                      {/* Note number badge - outside box on left */}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-blue/80 text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                        {index + 1}
                      </div>
                      
                      {/* Content box - clickable */}
                      <div 
                        onClick={() => handleNoteClick(annotation)}
                        className="flex-1 min-w-0 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-ocean-blue/40 transition-all duration-200"
                      >
                        <div className="text-off-white text-sm leading-relaxed whitespace-pre-wrap break-words mb-2.5 line-clamp-3">
                          {annotation.content}
                        </div>
                        
                        {/* Footer with timestamp and user */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>User</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{format(new Date(annotation.createdAt), 'MMM dd • h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-navy-800/50 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="text-off-white font-medium text-sm">No notes on this page</p>
                  <p className="text-xs mt-1.5 text-gray-500">Double-click on the document to add notes</p>
                </div>
              )
            )}
          </div>

          {/* Footer - only visible when note is selected */}
          {selectedNote && (
            <div className="px-4 py-3 border-t border-navy-700 border-l border-navy-700 flex-shrink-0 bg-navy-900">
              {isEditingInline ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleInlineSave}
                    disabled={!editedContent.trim()}
                    className="flex-1 px-4 py-2 bg-ocean-blue hover:bg-ocean-blue/80 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleInlineCancel}
                    className="flex-1 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleEditClick}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-ocean-blue hover:bg-ocean-blue/80 text-white rounded-lg transition-colors text-sm"
                  >
                    <Edit size={15} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {selectedNote && showEditModal && (
        <EditAnnotationModal
          annotation={selectedNote}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
        />
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Note
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Overlay */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Save Changes
            </h3>
            <p className="text-gray-600 mb-6">
              Do you want to save the changes to this note?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  setPendingUpdates(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewerPage;