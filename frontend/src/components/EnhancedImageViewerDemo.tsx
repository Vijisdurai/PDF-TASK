import React, { useState } from 'react';
import ImageViewer from './ImageViewer';
import { motion } from 'framer-motion';
import { Image, CheckCircle, Zap } from 'lucide-react';

interface DemoImage {
  id: string;
  name: string;
  url: string;
  description: string;
  features: string[];
}

const EnhancedImageViewerDemo: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<DemoImage | null>(null);
  const [viewerState, setViewerState] = useState({
    zoomScale: 1,
    panOffset: { x: 0, y: 0 }
  });

  // Sample images for demonstration
  const demoImages: DemoImage[] = [
    {
      id: 'landscape-sample',
      name: 'Landscape Photo',
      url: '/api/documents/sample-landscape/file',
      description: 'High-resolution landscape image for testing zoom and pan',
      features: ['Auto-fit on load', 'Smooth zoom/pan', 'Annotation support', 'Fit-to-screen']
    },
    {
      id: 'portrait-sample',
      name: 'Portrait Photo',
      url: '/api/documents/sample-portrait/file',
      description: 'Portrait orientation image to test different aspect ratios',
      features: ['Responsive scaling', 'Note placement', 'Pan with mouse drag', 'Reset view']
    },
    {
      id: 'diagram-sample',
      name: 'Technical Diagram',
      url: '/api/documents/sample-diagram/file',
      description: 'Technical diagram perfect for detailed annotations',
      features: ['Precise annotations', 'High zoom levels', 'Note persistence', 'Click to annotate']
    }
  ];

  const handleZoomChange = (scale: number) => {
    setViewerState(prev => ({ ...prev, zoomScale: scale }));
  };

  const handlePanChange = (offset: { x: number; y: number }) => {
    setViewerState(prev => ({ ...prev, panOffset: offset }));
  };

  const handleDocumentLoad = () => {
    console.log('Image loaded successfully');
  };

  const handleAnnotationCreate = (annotation: any) => {
    console.log('Annotation created:', annotation);
  };

  return (
    <div className="h-screen bg-navy-900 flex">
      {/* Image List Sidebar */}
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
            Enhanced Image Viewer
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Auto-fit, zoom/pan, and annotation capabilities for images
          </p>
        </motion.div>
        
        <div className="space-y-4">
          {demoImages.map((image, index) => (
            <motion.button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedImage?.id === image.id
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
                  selectedImage?.id === image.id
                    ? 'bg-ocean-blue/30'
                    : 'bg-navy-600'
                }`}>
                  <Image className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{image.name}</h3>
                  <p className="text-sm opacity-75 mt-1">{image.description}</p>
                  
                  {/* Features List */}
                  <div className="mt-3 space-y-1">
                    {image.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="opacity-70">{feature}</span>
                      </div>
                    ))}
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
          <h3 className="text-sm font-semibold text-off-white mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            Enhanced Features
          </h3>
          <ul className="text-xs text-gray-400 space-y-2">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Auto-fit to container on load</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Smooth zoom with mouse wheel</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Pan by dragging image</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Toggle annotation mode</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Click to place sticky notes</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Notes persist with zoom/pan</span>
            </li>
          </ul>
        </motion.div>

        {/* Current State Display */}
        {selectedImage && (
          <motion.div
            className="mt-6 p-3 bg-navy-600 rounded-lg border border-navy-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <h4 className="text-sm font-medium text-off-white mb-2">Current State</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Zoom: {Math.round(viewerState.zoomScale * 100)}%</div>
              <div>Pan X: {Math.round(viewerState.panOffset.x)}px</div>
              <div>Pan Y: {Math.round(viewerState.panOffset.y)}px</div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="mt-6 p-3 bg-green-900/20 border border-green-700 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <div className="flex items-center space-x-2 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Issues Fixed</span>
          </div>
          <ul className="text-xs text-green-300 mt-2 space-y-1">
            <li>• Auto-fit prevents overflow issues</li>
            <li>• Smooth zoom and pan controls</li>
            <li>• Annotation mode with visual feedback</li>
            <li>• Notes anchored to image coordinates</li>
            <li>• Responsive to container resizing</li>
          </ul>
        </motion.div>
      </motion.div>

      {/* Image Viewer Area */}
      <div className="flex-1 relative">
        {selectedImage ? (
          <motion.div
            key={selectedImage.id}
            className="h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <ImageViewer
              documentUrl={selectedImage.url}
              documentId={selectedImage.id}
              zoomScale={viewerState.zoomScale}
              panOffset={viewerState.panOffset}
              onZoomChange={handleZoomChange}
              onPanChange={handlePanChange}
              onDocumentLoad={handleDocumentLoad}
              onAnnotationCreate={handleAnnotationCreate}
              annotations={[]}
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
                🖼️
              </motion.div>
              <h3 className="text-xl font-semibold text-off-white mb-2">
                Enhanced Image Viewer
              </h3>
              <p className="mb-4">Select an image to see the enhanced features</p>
              <div className="text-sm text-gray-500">
                <p>✅ Auto-fit and responsive scaling</p>
                <p>✅ Zoom/pan with smooth controls</p>
                <p>✅ Annotation mode with sticky notes</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedImageViewerDemo;