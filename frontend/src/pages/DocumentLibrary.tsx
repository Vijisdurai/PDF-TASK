import React, { useState } from 'react';
import { RefreshCw, Upload as UploadIcon, AlertCircle, CheckCircle, Search, Grid, List } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';
import { useDocuments } from '../hooks/useDocuments';
import { useAppContext } from '../contexts/AppContext';
import type { DocumentMetadata } from '../contexts/AppContext';

type ViewMode = 'grid' | 'list';

const DocumentLibrary: React.FC = () => {
  const { state } = useAppContext();
  const { documents, isLoading, error, refreshDocuments, deleteDocument, selectDocument } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Calculate filtered documents count
  const filteredDocumentsCount = React.useMemo(() => {
    if (!searchTerm) return documents.length;
    return documents.filter(doc => {
      const displayName = doc.originalFilename || doc.filename;
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    }).length;
  }, [documents, searchTerm]);

  const handleUploadSuccess = (document: DocumentMetadata) => {
    setUploadError(null);
    // Don't show individual success messages during batch upload
    // The completion handler will show the final message
    console.log('Document uploaded successfully:', document);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null); // Clear any success message
    console.error('Upload error:', error);
  };

  const handleDocumentSelect = (document: DocumentMetadata) => {
    selectDocument(document);
  };

  const handleDocumentDelete = async (documentId: string) => {
    setIsDeleting(true);
    setUploadError(null);
    try {
      await deleteDocument(documentId);
      
      // Refresh the document list to ensure UI is in sync
      await refreshDocuments();
      
      setUploadSuccess('Document deleted successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete document:', error);
      setUploadError('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (documentIds: string[]) => {
    setIsDeleting(true);
    setUploadError(null);
    try {
      // Delete documents one by one using the existing delete function
      for (const documentId of documentIds) {
        await deleteDocument(documentId);
      }
      
      // Refresh the document list to ensure UI is in sync
      await refreshDocuments();
      
      // Show success message
      setUploadSuccess(`Successfully deleted ${documentIds.length} document${documentIds.length > 1 ? 's' : ''}!`);
      setTimeout(() => setUploadSuccess(null), 3000);
      
    } catch (error) {
      console.error('Failed to delete documents:', error);
      setUploadError('Failed to delete some documents. Please try again.');
    } finally {
      setIsDeleting(false);
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
    <div className="h-full w-full flex flex-col bg-navy-900">
      {/* Unified Toolbar */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          {/* Left Side - Search Bar and Action Buttons */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-off-white placeholder-gray-400 focus:outline-none focus:border-ocean-blue"
              />
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

          {/* Right Side - View Mode Toggle */}
          <div className="flex gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white/10 text-ocean-400 shadow-sm' 
                  : 'text-gray-400 hover:text-off-white hover:bg-white/5'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white/10 text-ocean-400 shadow-sm' 
                  : 'text-gray-400 hover:text-off-white hover:bg-white/5'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Count Indicator */}
        <div className="text-sm text-gray-400 px-1">
          {selectedCount > 0 ? (
            <span>
              {selectedCount} of {filteredDocumentsCount} {filteredDocumentsCount === 1 ? 'document' : 'documents'} selected
            </span>
          ) : searchTerm ? (
            <span>
              {filteredDocumentsCount} of {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </span>
          ) : (
            <span>{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
          )}
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

        {/* Success Display */}
        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Success</span>
            </div>
            <p className="text-green-300 mt-1">{uploadSuccess}</p>
          </div>
        )}

        {/* Upload Component */}
        {showUpload && (
          <div className="mb-6 p-6 bg-navy-800 rounded-lg border border-navy-700">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onUploadStart={(count) => {
                setIsUploading(true);
                setUploadingCount(count);
                setUploadedCount(0);
              }}
              onUploadProgress={(uploaded, total) => {
                console.log('Upload progress:', uploaded, 'of', total);
                setUploadedCount(uploaded);
                setUploadingCount(total);
              }}
              onUploadComplete={() => {
                // Keep the overlay visible for a moment to show completion
                setTimeout(() => {
                  setIsUploading(false);
                  setUploadingCount(0);
                  setUploadedCount(0);
                  
                  // Refresh documents after all uploads complete
                  refreshDocuments();
                  
                  // Show success message
                  setUploadSuccess('Upload complete!');
                  setTimeout(() => setUploadSuccess(null), 3000);
                  
                  // Close upload section
                  setShowUpload(false);
                }, 800);
              }}
              existingFiles={documents.map(doc => doc.originalFilename || doc.filename)}
            />
          </div>
        )}
      </div>

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-navy-800 border border-navy-600 rounded-lg p-6 shadow-2xl min-w-[320px] animate-scale-in">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                {uploadedCount === uploadingCount && uploadingCount > 0 ? (
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-500 animate-scale-in" />
                  </div>
                ) : (
                  <div className="w-8 h-8 border-2 border-ocean-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-off-white font-medium transition-all duration-300">
                    {uploadedCount === uploadingCount && uploadingCount > 0 
                      ? 'Upload complete!' 
                      : 'Uploading documents...'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1 transition-all duration-300">
                    {uploadingCount === 1 
                      ? uploadedCount === 0 
                        ? 'Uploading file...'
                        : 'File uploaded successfully'
                      : `${uploadedCount} of ${uploadingCount} files uploaded`
                    }
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-navy-600 rounded-full h-2.5 overflow-hidden">
                  <div
                    key={`progress-${uploadedCount}-${uploadingCount}`}
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      uploadedCount === uploadingCount && uploadingCount > 0
                        ? 'bg-green-500'
                        : 'bg-ocean-400'
                    }`}
                    style={{ 
                      width: `${uploadingCount > 0 ? Math.round((uploadedCount / uploadingCount) * 100) : 0}%`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 transition-all duration-300">
                    {uploadedCount} / {uploadingCount}
                  </p>
                  <p className="text-xs text-gray-500 font-medium transition-all duration-300">
                    {uploadingCount > 0 ? Math.round((uploadedCount / uploadingCount) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deleting Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-navy-800 border border-navy-600 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-2 border-ocean-blue border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-off-white font-medium">Deleting documents...</p>
                <p className="text-gray-400 text-sm">Please wait</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document List - flex-1 to fill remaining space, consistent padding */}
      <div className="flex-1 px-8 overflow-y-auto min-h-0">
        <DocumentList
          documents={documents}
          onDocumentSelect={handleDocumentSelect}
          onDocumentDelete={handleDocumentDelete}
          onBulkDelete={handleBulkDelete}
          isLoading={isLoading}
          searchTerm={searchTerm}
          hideControls={true}
          onSelectionChange={setSelectedCount}
          viewMode={viewMode}
        />
      </div>


    </div>
  );
};

export default DocumentLibrary;