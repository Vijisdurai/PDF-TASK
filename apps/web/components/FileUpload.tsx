import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import type { DocumentMetadata } from '../contexts/AppContext';

export interface FileUploadProps {
  onUploadSuccess?: (document: DocumentMetadata) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: (totalFiles: number) => void;
  onUploadProgress?: (uploadedCount: number, totalCount: number) => void;
  onUploadComplete?: () => void;
  existingFiles?: string[];
}

interface UploadFile {
  file: File;
  id: string;
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

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  existingFiles = []
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false); // Prevent re-processing
  const { uploadFile } = useFileUpload();

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return `Unsupported file type. Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG`;
    }
    return null;
  }, []);

  const createUploadFile = useCallback((file: File, index: number): UploadFile => ({
    file,
    id: `${file.name}-${Date.now()}-${index}`,
    status: 'pending'
  }), []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadFiles: UploadFile[] = [];
    const duplicateFiles: string[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach((file, index) => {
      // Check for duplicate file names against existing files
      if (existingFiles.includes(file.name)) {
        duplicateFiles.push(file.name);
        return;
      }

      const error = validateFile(file);
      if (error) {
        invalidFiles.push(file.name);
        return;
      }
      
      newUploadFiles.push(createUploadFile(file, index));
    });

    // Show warnings for duplicates
    if (duplicateFiles.length > 0) {
      const message = duplicateFiles.length === 1
        ? `File "${duplicateFiles[0]}" already exists and was skipped.`
        : `${duplicateFiles.length} files already exist and were skipped.`;
      onUploadError?.(message);
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      const message = invalidFiles.length === 1
        ? `File "${invalidFiles[0]}" has an invalid format.`
        : `${invalidFiles.length} files have invalid formats.`;
      onUploadError?.(message);
    }

    if (newUploadFiles.length > 0) {
      setUploadFiles(newUploadFiles);
      onUploadStart?.(newUploadFiles.length);
    }
  }, [validateFile, createUploadFile, onUploadError, existingFiles, onUploadStart]);

  // Process uploads - ONLY runs when uploadFiles changes from empty to non-empty
  useEffect(() => {
    // Guard: Don't process if already processing or no files
    if (processingRef.current || uploadFiles.length === 0) {
      return;
    }

    // Mark as processing to prevent re-entry
    processingRef.current = true;

    const processUploads = async () => {
      let completed = 0;
      const total = uploadFiles.length;
      
      for (const fileData of uploadFiles) {
        try {
          // Update status to uploading
          setUploadFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, status: 'uploading' as const } : f
          ));

          const result = await uploadFile(fileData.file, fileData.id);
          
          // Update status to success
          setUploadFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, status: 'success' as const } : f
          ));
          
          completed++;
          onUploadProgress?.(completed, total);
          onUploadSuccess?.(result);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          
          // Update status to error
          setUploadFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, status: 'error' as const, error: errorMessage } : f
          ));
          
          completed++;
          onUploadProgress?.(completed, total);
          
          // Handle specific error types
          if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
            onUploadError?.(`File "${fileData.file.name}" already exists.`);
          } else {
            onUploadError?.(`Failed to upload "${fileData.file.name}": ${errorMessage}`);
          }
        }
      }
      
      // Wait longer to show 100% completion with green bar
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // All uploads complete
      onUploadComplete?.();
      
      // Clear queue after delay
      setTimeout(() => {
        setUploadFiles([]);
        processingRef.current = false;
      }, 2000);
    };

    processUploads();
  }, [uploadFiles.length]); // ONLY depend on length, not the array itself

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    
    // Reset input to allow same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
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
        return <Loader2 className="w-4 h-4 text-ocean-blue animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const isProcessing = processingRef.current;

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
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
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
              Supports PDF, DOC, DOCX, PNG, JPG, JPEG
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          {uploadFiles.map((fileData) => (
            <div
              key={fileData.id}
              className="flex items-center justify-between p-3 bg-navy-800 rounded-lg border border-navy-700"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-2xl">{getFileIcon(fileData.file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-off-white truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(fileData.file.size)}
                  </p>
                  {fileData.error && (
                    <p className="text-xs text-red-400 mt-1">{fileData.error}</p>
                  )}
                </div>
              </div>
              <div className="ml-3">
                {getStatusIcon(fileData.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
