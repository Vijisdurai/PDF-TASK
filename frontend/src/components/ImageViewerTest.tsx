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

  const handleDocumentLoad = () => {
    console.log('✅ Image loaded successfully');
  };

  const handleAnnotationCreate = (annotation: any) => {
    console.log('✅ Annotation created:', annotation);
  };

  // Test with a sample image URL - replace with your actual image
  const testImageUrl = 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Test+Image';

  return (
    <div className="h-screen bg-navy-900">
      <div className="h-full">
        <ImageViewer
          documentUrl={testImageUrl}
          documentId="test-image-123"
          zoomScale={viewerState.zoomScale}
          panOffset={viewerState.panOffset}
          onZoomChange={handleZoomChange}
          onPanChange={handlePanChange}
          onDocumentLoad={handleDocumentLoad}
          onAnnotationCreate={handleAnnotationCreate}
          annotations={[]}
        />
      </div>
      
      {/* Debug info */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
        <div className="font-semibold mb-2">ImageViewer Debug Info:</div>
        <div>Zoom: {Math.round(viewerState.zoomScale * 100)}%</div>
        <div>Pan X: {Math.round(viewerState.panOffset.x)}px</div>
        <div>Pan Y: {Math.round(viewerState.panOffset.y)}px</div>
        <div className="mt-2 text-xs text-gray-300">
          <div>✅ Auto-fit on load</div>
          <div>✅ Zoom/pan controls</div>
          <div>✅ Annotation toggle</div>
          <div>✅ Sticky notes</div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerTest;