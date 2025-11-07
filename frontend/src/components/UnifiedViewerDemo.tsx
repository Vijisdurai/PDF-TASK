import React, { useState } from 'react';
import DocumentViewer from './DocumentViewer';
import { motion } from 'framer-motion';
import { FileText, Image, File, CheckCircle } from 'lucide-react';

interface DemoDocument {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const UnifiedViewerDemo: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<DemoDocument | null>(null);

  // Sample documents showcasing the unified viewer
  const demoDocuments: DemoDocument[] = [
    {
      id: 'pdf-sample',
      name: 'Sample PDF Document',
      url: '/api/documents/sample-pdf-id/file',
      mimeType: 'application/pdf',
      icon: <FileText className="w-5 h-5" />,
      description: 'Multi-page PDF with full annotation support',
      features: ['Page navigation', 'Zoom controls', 'Annotations', 'Fit-to-screen']
    },
    {
      id: 'image-sample',
      name: 'Sample Image',
      url: '/api/documents/sample-image-id/file',
      mimeType: 'image/jpeg',
      icon: <Image className="w-5 h-5" />,
      description: 'High-resolution image with zoom and pan',
      features: ['Instant loading', 'Zoom/pan controls', 'Error handling', 'Smooth transitions']
    },
    {
      id: 'docx-sample',
      name: 'Sample Word Document',
      url: '/api/documents/sample-docx-id/file',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      icon: <File className="w-5 h-5" />,
      description: 'Word document with rich formatting and pagination',
      features: ['Rich formatting', 'Smart pagination', 'Zoom controls', 'Typography preservation']
    }
  ];

  return (
    <div className="h-screen bg-navy-900 flex">
      {/* Document List Sidebar */}
      <motion.div
        className="w-96 bg-navy-800 border-r border-navy-700 p-6"
        initial={{ x: -384, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-off-white mb-2">
            Unified Document Viewer
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Single viewer for PDF, images, and Word documents with consistent controls
          </p>
        </motion.div>
        
        <div className="space-y-4">
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
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
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
                  <h3 className="font-semibold truncate">{doc.name}</h3>
                  <p className="text-sm opacity-75 mt-1">{doc.description}</p>
                  
                  {/* Features List */}
                  <div className="mt-3 space-y-1">
                    {doc.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="opacity-70">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs opacity-50 mt-3 font-mono bg-navy-800 px-2 py-1 rounded">
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
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <h3 className="text-sm font-semibold text-off-white mb-3">
            ✨ Unified Features
          </h3>
          <ul className="text-xs text-gray-400 space-y-2">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Consistent zoom/pan controls</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Smart loading states</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Error handling & fallbacks</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Smooth animations</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Responsive design</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="mt-6 p-3 bg-green-900/20 border border-green-700 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <div className="flex items-center space-x-2 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Issues Fixed</span>
          </div>
          <ul className="text-xs text-green-300 mt-2 space-y-1">
            <li>• Images no longer stuck on loading</li>
            <li>• DOCX with proper formatting & zoom</li>
            <li>• Smart pagination for long documents</li>
            <li>• Unified controls across all formats</li>
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
                🚀
              </motion.div>
              <h3 className="text-xl font-semibold text-off-white mb-2">
                Unified Document Viewer
              </h3>
              <p className="mb-4">Select a document to see the enhanced viewer in action</p>
              <div className="text-sm text-gray-500">
                <p>✅ No more loading spinner issues</p>
                <p>✅ Rich DOCX formatting with zoom</p>
                <p>✅ Consistent controls across formats</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UnifiedViewerDemo;