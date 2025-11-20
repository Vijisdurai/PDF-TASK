import React, { useState } from 'react';
import UnifiedDocumentViewer from '../components/UnifiedDocumentViewer';

const ViewerDemo: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('/sample.pdf');

  return (
    <div className="h-screen flex flex-col bg-navy-900">
      {/* Header */}
      <div className="bg-navy-800 border-b border-navy-700 p-4">
        <h1 className="text-2xl font-bold text-off-white mb-4">
          Unified Document Viewer Demo
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedDoc('/sample.pdf')}
            className={`px-4 py-2 rounded transition-colors ${
              selectedDoc === '/sample.pdf'
                ? 'bg-ocean-blue text-white'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            Sample PDF
          </button>
          <button
            onClick={() => setSelectedDoc('/document.pdf')}
            className={`px-4 py-2 rounded transition-colors ${
              selectedDoc === '/document.pdf'
                ? 'bg-ocean-blue text-white'
                : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
            }`}
          >
            Document PDF
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        <UnifiedDocumentViewer
          documentUrl={selectedDoc}
          documentType="pdf"
          onPageChange={(page) => console.log('Page changed:', page)}
          onZoomChange={(zoom) => console.log('Zoom changed:', zoom)}
        />
      </div>
    </div>
  );
};

export default ViewerDemo;
