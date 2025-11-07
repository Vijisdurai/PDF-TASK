import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import mammoth from 'mammoth';
import { FileText, Download, Loader2 } from 'lucide-react';

interface DocxViewerProps {
  documentUrl: string;
  documentId: string;
  filename: string;
  onDocumentLoad?: () => void;
}

const DocxViewer: React.FC<DocxViewerProps> = ({
  documentUrl,
  documentId,
  filename,
  onDocumentLoad
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocx = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch the DOCX file as ArrayBuffer
      const response = await fetch(documentUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Convert DOCX to HTML using Mammoth.js
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }

      setHtmlContent(result.value);
      setIsLoading(false);

      if (onDocumentLoad) {
        onDocumentLoad();
      }
    } catch (err) {
      console.error('Error loading DOCX:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Word document');
      setIsLoading(false);
    }
  }, [documentUrl, onDocumentLoad]);

  useEffect(() => {
    if (documentUrl) {
      loadDocx();
    }
  }, [loadDocx]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [documentUrl, filename]);

  if (isLoading) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center">
          <motion.div
            className="flex items-center justify-center mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-ocean-blue" />
          </motion.div>
          <p className="text-off-white">Converting Word document...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            📄
          </motion.div>
          <h3 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Document
          </h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <motion.button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-ocean-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={16} className="mr-2" />
            Download Original
          </motion.button>
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
      {/* Toolbar */}
      <motion.div
        className="bg-navy-900 border-b border-navy-700 p-3 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center space-x-2">
          <FileText size={16} className="text-off-white" />
          <span className="text-off-white text-sm">Word Document</span>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleDownload}
            className="p-2 rounded bg-navy-800 text-off-white hover:bg-navy-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            title="Download Original"
          >
            <Download size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Document content */}
      <motion.div
        className="flex-1 overflow-auto bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto p-8">
          <motion.div
            className="prose prose-lg max-w-none"
            style={{
              color: '#1f2937',
              lineHeight: '1.7'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DocxViewer;