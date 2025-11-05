import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Image, 
  Calendar, 
  HardDrive, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import type { DocumentMetadata } from '../contexts/AppContext';

export interface DocumentListProps {
  documents: DocumentMetadata[];
  onDocumentSelect: (document: DocumentMetadata) => void;
  onDocumentDelete?: (documentId: string) => void;
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-6 h-6 text-blue-400" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-400" />;
    } else if (mimeType.includes('word')) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    return <FileText className="w-6 h-6 text-gray-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'application/msword') return 'DOC';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase();
    return 'Unknown';
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'date':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.mimeType.localeCompare(b.mimeType);
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchTerm, sortBy]);

  const handleDocumentClick = (document: DocumentMetadata) => {
    onDocumentSelect(document);
    navigate(`/document/${document.id}`);
  };

  const handleDocumentDelete = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    if (onDocumentDelete && window.confirm('Are you sure you want to delete this document?')) {
      onDocumentDelete(documentId);
    }
  };

  const toggleDocumentSelection = (e: React.MouseEvent | React.ChangeEvent, documentId: string) => {
    e.stopPropagation();
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-ocean-blue border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-400">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-off-white mb-2">No documents yet</h3>
        <p className="text-gray-400">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 pr-8 text-off-white text-sm focus:outline-none focus:border-ocean-blue"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="type">Sort by Type</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-navy-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-ocean-blue text-white' : 'bg-navy-800 text-gray-400 hover:text-off-white'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-ocean-blue text-white' : 'bg-navy-800 text-gray-400 hover:text-off-white'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Count */}
      <div className="text-sm text-gray-400">
        {filteredAndSortedDocuments.length} of {documents.length} documents
        {selectedDocuments.size > 0 && (
          <span className="ml-2">({selectedDocuments.size} selected)</span>
        )}
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedDocuments.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document)}
              className={`
                relative group bg-navy-800 rounded-lg border border-navy-700 p-4 cursor-pointer 
                transition-all duration-200 hover:border-ocean-blue hover:shadow-lg hover:shadow-ocean-blue/20
                ${selectedDocuments.has(document.id) ? 'ring-2 ring-ocean-blue' : ''}
              `}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="checkbox"
                  checked={selectedDocuments.has(document.id)}
                  onChange={(e) => toggleDocumentSelection(e, document.id)}
                  className="w-4 h-4 text-ocean-blue bg-navy-700 border-navy-600 rounded focus:ring-ocean-blue"
                />
              </div>

              {/* Delete Button */}
              {onDocumentDelete && (
                <button
                  onClick={(e) => handleDocumentDelete(e, document.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                {/* File Icon */}
                <div className="w-12 h-12 bg-navy-700 rounded-lg flex items-center justify-center">
                  {getFileIcon(document.mimeType)}
                </div>

                {/* File Info */}
                <div className="space-y-1 w-full">
                  <h3 className="font-medium text-off-white text-sm truncate" title={document.filename}>
                    {document.filename}
                  </h3>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <span>{getFileTypeLabel(document.mimeType)}</span>
                    <span>•</span>
                    <span>{formatFileSize(document.size)}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedDocuments.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document)}
              className={`
                group flex items-center justify-between p-4 bg-navy-800 rounded-lg border border-navy-700 
                cursor-pointer transition-all duration-200 hover:border-ocean-blue hover:shadow-lg hover:shadow-ocean-blue/20
                ${selectedDocuments.has(document.id) ? 'ring-2 ring-ocean-blue' : ''}
              `}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedDocuments.has(document.id)}
                  onChange={(e) => toggleDocumentSelection(e, document.id)}
                  className="w-4 h-4 text-ocean-blue bg-navy-700 border-navy-600 rounded focus:ring-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(document.mimeType)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-off-white truncate" title={document.filename}>
                    {document.filename}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                    <span>{getFileTypeLabel(document.mimeType)}</span>
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(document.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(document.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocumentClick(document);
                  }}
                  className="p-2 text-gray-400 hover:text-ocean-blue transition-colors"
                  title="View document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {onDocumentDelete && (
                  <button
                    onClick={(e) => handleDocumentDelete(e, document.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAndSortedDocuments.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-off-white mb-2">No documents found</h3>
          <p className="text-gray-400">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default DocumentList;