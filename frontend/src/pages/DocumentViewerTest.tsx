import React from 'react';
import DocumentViewer from '../components/DocumentViewer';

const DocumentViewerTest: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-navy-900">
      <div className="bg-navy-800 border-b border-navy-700 p-4">
        <h1 className="text-2xl font-bold text-off-white">
          Document Viewer Test
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Fixed container • Transform-based zoom • Centered content • Smooth pan
        </p>
      </div>

      <div className="flex-1">
        <DocumentViewer
          documentUrl="/sample.pdf"
          documentType="pdf"
        />
      </div>
    </div>
  );
};

export default DocumentViewerTest;
