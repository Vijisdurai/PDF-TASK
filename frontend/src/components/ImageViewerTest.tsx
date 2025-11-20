import React, { useState } from 'react';
import ImageViewer from './ImageViewer';

const ImageViewerTest: React.FC = () => {
  const [viewerState, setViewerState] = useState({
    zoomScale: 1,
    panOffset: { x: 0, y: 0 }
  });

  const handleZoomChange = (scale: number) => {
    console.log('Zoom changed to:', scale);
    setViewerState(prev => ({ ...prev, zoomScale: scale }));
  };

  const handlePanChange = (offset: { x: number; y: number }) => {
    console.log('Pan changed to:', offset);
    setViewerState(prev => ({ ...prev, panOffset: offset }));
  };

  const handleAnnotationCreate = (annotation: any) => {
    console.log('✅ Annotation created:', annotation);
  };

  // Test with a sample image URL - replace with your actual image
  const testImageUrl = 'https://via.placeholder.com/1200x800/4A90E2/FFFFFF?text=Test+Image+for+Zoom';
  const testDocumentId = 'test-document-id';

  return (
    <div className="h-screen bg-navy-900">
      <div className="h-full">
        <ImageViewer
          documentUrl={testImageUrl}
          documentId={testDocumentId}
          zoomScale={viewerState.zoomScale}
          panOffset={viewerState.panOffset}
          onZoomChange={handleZoomChange}
          onPanChange={handlePanChange}
          onAnnotationCreate={handleAnnotationCreate}
          annotations={[]}
        />
      </div>
      
      {/* Debug info */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm shadow-xl">
        <div className="font-semibold mb-3 text-ocean-blue">ImageViewer Zoom Test</div>
        <div className="space-y-1">
          <div>Zoom: <span className="font-mono text-green-400">{Math.round(viewerState.zoomScale * 100)}%</span></div>
          <div>Pan X: <span className="font-mono">{Math.round(viewerState.panOffset.x)}px</span></div>
          <div>Pan Y: <span className="font-mono">{Math.round(viewerState.panOffset.y)}px</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-300 space-y-1">
          <div>✅ Zoom via buttons</div>
          <div>✅ Zoom via mouse scroll</div>
          <div>✅ Keyboard shortcuts (+, -, 0)</div>
          <div>✅ Maintains aspect ratio</div>
          <div>✅ Smooth transitions</div>
          <div>✅ Double-click to annotate</div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerTest;