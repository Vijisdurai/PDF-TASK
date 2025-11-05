import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import type { DocumentMetadata } from '../contexts/AppContext';

export interface FileUploadProps {
  onUploadSuccess?: (document: DocumentMetadata) => void;
  onUploadError?: (error: string) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadProgress, isUploading, clearProgress } = useFileUpload();

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return `Unsupported file type. Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 100MB limit`;
    }
    
    return null;
  }, []);

  const createUploadFile = useCallback((file: File): UploadFile => ({
    file,
    id: `${file.name}-${Date.now()}`,
    progress: 0,
    status: 'pending'
  }), []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
      
      newUploadFiles.push(createUploadFile(file));
    });

    if (newUploadFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newUploadFiles]);
    }
  }, [validateFile, createUploadFile, onUploadError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
    clearProgress(fileId);
  }, [clearProgress]);

  // Auto-upload files when they are added
  const handleUpload = useCallback(async (uploadFileData: UploadFile) => {
    try {
      const result = await uploadFile(uploadFileData.file, uploadFileData.id);
      // The uploadFile hook should return the document metadata
      // For now, we'll trigger the success callback without the document
      // The parent component will handle the refresh
      onUploadSuccess?.(result as any);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  }, [uploadFile, onUploadSuccess, onUploadError]);

  // Sync upload progress with local state
  useEffect(() => {
    setUploadFiles(prev => prev.map(file => {
      const progress = uploadProgress[file.id];
      if (progress) {
        return {
          ...file,
          progress: progress.progress,
          status: progress.status,
          error: progress.error
        };
      }
      return file;
    }));
  }, [uploadProgress]);

  // Auto-upload new files
  useEffect(() => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    pendingFiles.forEach(file => {
      handleUpload(file);
    });
  }, [uploadFiles, handleUpload]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word')) {
      return '📝';
    }
    return '📄';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-ocean-blue border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-ocean-blue bg-ocean-blue/10 scale-105' 
            : 'border-navy-600 hover:border-navy-500 hover:bg-navy-800/50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-ocean-blue/20' : 'bg-navy-700'
          }`}>
            <Upload className={`w-8 h-8 transition-colors ${
              isDragOver ? 'text-ocean-blue' : 'text-gray-400'
            }`} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-off-white mb-2">
              {isDragOver ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOC, DOCX, PNG, JPG, JPEG (max 100MB)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-off-white">Files to Upload</h4>
          <div className="space-y-2">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center justify-between p-3 bg-navy-800 rounded-lg border border-navy-700"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(uploadFile.file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-off-white truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-400 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="w-24 bg-navy-600 rounded-full h-2">
                      <div
                        className="bg-ocean-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Status Icon */}
                  {getStatusIcon(uploadFile.status)}

                  {/* Remove Button */}
                  {uploadFile.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;