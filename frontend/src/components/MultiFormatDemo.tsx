import React, { useState } from 'react';
import DocumentViewer from './DocumentViewer';
import { motion } from 'framer-motion';
import { FileText, Image, File } from 'lucide-react';

interface DemoDocument {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  icon: React.ReactNode;
  description: string;
}

const MultiFormatDemo: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<DemoDocument | null>(null);

  // Sample documents for demonstration
  const demoDocuments: DemoDocument[] = [
    {
      id: 'pdf-sample',
      name: 'Sample PDF Document',
      url: '/api/documents/sample-pdf-id/file',
      mimeType: 'application/pdf',
      icon: <FileText className="w-5 h-5" />,
      description: 'PDF document with multiple pages and annotations support'
    },
    {
      id: 'image-sample',
      name: 'Sample Image',
      url: '/api/documents/sample-image-id/file',
      mimeType: 'image/jpeg',
      icon: <Image className="w-5 h-5" />,
      description: 'JPEG image with zoom and pan capabilities'
    },
    {
      id: 'docx-sample',
      name: 'Sample Word Document',
      url: '/api/documents/sample-docx-id/file',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      icon: <File className="w-5 h-5" />,
      description: 'DOCX document converted to HTML for viewing'
    }
  ];

  return (
    <div className="h-screen bg-navy-900 flex">
      {/* Document List Sidebar */}
      <motion.div
        className="w-80 bg-navy-800 border-r border-navy-700 p-4"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-off-white mb-6">
          Multi-Format Document Viewer Demo
        </h2>
        
        <div className="space-y-3">
          {demoDocuments.map((doc, index) => (
            <motion.button
              key={doc.id}
              onClick={() => setSelectedDocument(doc)}
              className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedDocument?.id === doc.id
                  ? 'bg-ocean-blue/20 border-ocean-blue text-off-white'
                  : 'bg-navy-700 border-navy-600 text-gray-300 hover:bg-navy-600 hover:border-navy-500'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded ${
                  selectedDocument?.id === doc.id
                    ? 'bg-ocean-blue/30'
                    : 'bg-navy-600'
                }`}>
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{doc.name}</h3>
                  <p className="text-sm opacity-75 mt-1">{doc.description}</p>
                  <div className="text-xs opacity-60 mt-2 font-mono">
                    {doc.mimeType}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="mt-8 p-4 bg-navy-700 rounded-lg border border-navy-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-off-white mb-2">
            Supported Formats
          </h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• PDF - Full viewer with annotations</li>
            <li>• Images - JPG, PNG, GIF with zoom</li>
            <li>• Word - DOC, DOCX converted to HTML</li>
          </ul>
        </motion.div>
      </motion.div>

      {/* Document Viewer Area */}
      <div className="flex-1 relative">
        {selectedDocument ? (
          <motion.div
            key={selectedDocument.id}
            className="h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <DocumentViewer
              documentId={selectedDocument.id}
              documentUrl={selectedDocument.url}
              mimeType={selectedDocument.mimeType}
              filename={selectedDocument.name}
            />
          </motion.div>
        ) : (
          <motion.div
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center text-gray-400">
              <motion.div
                className="text-6xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                📁
              </motion.div>
              <h3 className="text-xl font-semibold text-off-white mb-2">
                Select a Document
              </h3>
              <p>Choose a document from the sidebar to view it</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MultiFormatDemo;