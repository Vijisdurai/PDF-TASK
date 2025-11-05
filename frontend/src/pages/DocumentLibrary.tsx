import React, { useState } from 'react';
import { RefreshCw, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';
import { useDocuments } from '../hooks/useDocuments';
import { useAppContext } from '../contexts/AppContext';
import type { DocumentMetadata } from '../contexts/AppContext';

const DocumentLibrary: React.FC = () => {
  const { state } = useAppContext();
  const { documents, isLoading, error, refreshDocuments, deleteDocument, selectDocument } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSuccess = (document: DocumentMetadata) => {
    setUploadError(null);
    // Document is already added to state by the upload hook
    console.log('Document uploaded successfully:', document);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    console.error('Upload error:', error);
  };

  const handleDocumentSelect = (document: DocumentMetadata) => {
    selectDocument(document);
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshDocuments();
      setUploadError(null);
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-off-white mb-2">
              Document Library
            </h1>
            <p className="text-gray-300">
              Upload and manage your documents for annotation
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Online/Offline Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              state.isOnline 
                ? 'bg-green-900/30 text-green-400 border border-green-700' 
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                state.isOnline ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span>{state.isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-off-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Upload Toggle Button */}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center space-x-2 px-4 py-2 bg-ocean-blue hover:bg-ocean-blue/80 text-white rounded-lg transition-colors"
            >
              <UploadIcon className="w-4 h-4" />
              <span>{showUpload ? 'Hide Upload' : 'Upload Files'}</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(error || uploadError) && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 mt-1">{error || uploadError}</p>
          </div>
        )}

        {/* Upload Component */}
        {showUpload && (
          <div className="mb-6 p-6 bg-navy-800 rounded-lg border border-navy-700">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        )}
      </div>

      {/* Document List */}
      <DocumentList
        documents={documents}
        onDocumentSelect={handleDocumentSelect}
        onDocumentDelete={handleDocumentDelete}
        isLoading={isLoading}
      />

      {/* Stats Footer */}
      {documents.length > 0 && (
        <div className="mt-8 p-4 bg-navy-800 rounded-lg border border-navy-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Total Documents: {documents.length}</span>
            <span>
              Total Size: {documents.reduce((total, doc) => total + doc.size, 0) > 0 
                ? `${(documents.reduce((total, doc) => total + doc.size, 0) / (1024 * 1024)).toFixed(2)} MB`
                : '0 MB'
              }
            </span>
            <span>
              Sync Status: {state.syncStatus === 'idle' ? 'Up to date' : state.syncStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;