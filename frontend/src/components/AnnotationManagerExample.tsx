/**
 * AnnotationManagerExample Component
 * 
 * Demonstrates how to use the AnnotationManager component and utilities
 * This file serves as documentation and can be used as a reference
 */

import React, { useState } from 'react';
import AnnotationManager from './AnnotationManager';
import SharedAnnotationMarker from './SharedAnnotationMarker';
import { useAnnotationManager } from '../hooks/useAnnotationManager';
import type { Annotation, DocumentAnnotation, ImageAnnotation } from '../contexts/AppContext';

/**
 * Example 1: Using AnnotationManager with render prop pattern
 */
export function AnnotationManagerRenderPropExample() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleCreate = (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Annotation;
    setAnnotations(prev => [...prev, newAnnotation]);
  };
  
  const handleUpdate = (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => {
    setAnnotations(prev =>
      prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a)
    );
  };
  
  const handleDelete = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };
  
  const handleError = (error: { type: string; message: string; details?: string[] }) => {
    console.error('Annotation error:', error);
    alert(`Error: ${error.message}`);
  };
  
  return (
    <div className="relative w-full h-full">
      <AnnotationManager
        documentId="example-doc-1"
        documentType="document"
        containerWidth={800}
        containerHeight={600}
        documentWidth={612}
        documentHeight={792}
        scale={1.0}
        panOffset={{ x: 0, y: 0 }}
        currentPage={1}
        annotations={annotations}
        onAnnotationCreate={handleCreate}
        onAnnotationUpdate={handleUpdate}
        onAnnotationDelete={handleDelete}
        onError={handleError}
      >
        {(utils) => (
          <div
            className="w-full h-full bg-gray-100"
            onDoubleClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const screenX = e.clientX - rect.left;
              const screenY = e.clientY - rect.top;
              
              if (utils.isWithinBounds(screenX, screenY)) {
                const content = prompt('Enter annotation content:');
                if (content) {
                  utils.createAnnotation(screenX, screenY, content);
                }
              }
            }}
          >
            {/* Render visible annotations */}
            {utils.getVisibleAnnotations().map((annotation) => {
              const screenPos = utils.getAnnotationScreenPosition(annotation);
              if (!screenPos || !utils.isAnnotationVisible(annotation)) return null;
              
              return (
                <SharedAnnotationMarker
                  key={annotation.id}
                  id={annotation.id}
                  x={screenPos.x}
                  y={screenPos.y}
                  content={annotation.content}
                  color={annotation.type === 'image' ? annotation.color : undefined}
                  variant={annotation.type}
                  isSelected={selectedId === annotation.id}
                  onClick={() => setSelectedId(annotation.id)}
                  onHover={(isHovered) => {
                    if (isHovered) {
                      console.log('Hovering annotation:', annotation.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </AnnotationManager>
    </div>
  );
}

/**
 * Example 2: Using useAnnotationManager hook (simpler approach)
 */
export function AnnotationManagerHookExample() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleCreate = (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Annotation;
    setAnnotations(prev => [...prev, newAnnotation]);
  };
  
  const handleUpdate = (id: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>) => {
    setAnnotations(prev =>
      prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a)
    );
  };
  
  const handleDelete = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };
  
  // Use the hook for simpler API
  const annotationManager = useAnnotationManager({
    documentId: "example-doc-2",
    documentType: "image",
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 1920,
    documentHeight: 1080,
    scale: 1.0,
    panOffset: { x: 0, y: 0 },
    annotations,
    onAnnotationCreate: handleCreate,
    onAnnotationUpdate: handleUpdate,
    onAnnotationDelete: handleDelete,
    onError: (error) => {
      console.error('Annotation error:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  return (
    <div className="relative w-full h-full">
      <div
        className="w-full h-full bg-gray-100"
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          
          if (annotationManager.isWithinBounds(screenX, screenY)) {
            const content = prompt('Enter annotation content:');
            const color = prompt('Enter color (hex):', '#FFEB3B');
            if (content) {
              annotationManager.createAnnotation(screenX, screenY, content, { color: color || undefined });
            }
          }
        }}
      >
        {/* Render visible annotations */}
        {annotationManager.visibleAnnotations.map((annotation) => {
          const screenPos = annotationManager.getAnnotationScreenPosition(annotation);
          if (!screenPos || !annotationManager.isAnnotationVisible(annotation)) return null;
          
          return (
            <SharedAnnotationMarker
              key={annotation.id}
              id={annotation.id}
              x={screenPos.x}
              y={screenPos.y}
              content={annotation.content}
              color={annotation.type === 'image' ? annotation.color : undefined}
              variant={annotation.type}
              isSelected={selectedId === annotation.id}
              onClick={() => {
                setSelectedId(annotation.id);
                const newContent = prompt('Edit content:', annotation.content);
                if (newContent && newContent !== annotation.content) {
                  annotationManager.updateAnnotation(annotation.id, { content: newContent });
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Example 3: Coordinate transformation utilities
 */
export function CoordinateTransformExample() {
  const annotationManager = useAnnotationManager({
    documentId: "example-doc-3",
    documentType: "document",
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 612,
    documentHeight: 792,
    scale: 1.5,
    panOffset: { x: 100, y: 50 },
    currentPage: 1,
    annotations: [],
  });
  
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convert screen to percentage
    const percentCoords = annotationManager.screenToPercentage(screenX, screenY);
    console.log('Percentage coords:', percentCoords);
    
    // Convert back to screen
    const backToScreen = annotationManager.percentageToScreen(
      percentCoords.xPercent,
      percentCoords.yPercent
    );
    console.log('Back to screen:', backToScreen);
    
    // For images, convert to pixels
    const pixelCoords = annotationManager.screenToPixel(screenX, screenY);
    console.log('Pixel coords:', pixelCoords);
    
    // Check if within bounds
    const isValid = annotationManager.isWithinBounds(screenX, screenY);
    console.log('Is within bounds:', isValid);
  };
  
  return (
    <div
      className="w-full h-full bg-gray-100 cursor-crosshair"
      onClick={handleClick}
    >
      <p className="p-4 text-sm text-gray-600">
        Click anywhere to see coordinate transformations in console
      </p>
    </div>
  );
}

/**
 * Example 4: Validation utilities
 */
export function ValidationExample() {
  const annotationManager = useAnnotationManager({
    documentId: "example-doc-4",
    documentType: "document",
    containerWidth: 800,
    containerHeight: 600,
    documentWidth: 612,
    documentHeight: 792,
    scale: 1.0,
    panOffset: { x: 0, y: 0 },
    currentPage: 1,
    annotations: [],
  });
  
  const testValidation = () => {
    // Test valid document annotation
    const validDoc: Partial<DocumentAnnotation> = {
      type: 'document',
      documentId: 'test-doc',
      page: 1,
      xPercent: 50,
      yPercent: 50,
      content: 'Valid annotation'
    };
    console.log('Valid doc:', annotationManager.validateAnnotation(validDoc));
    
    // Test invalid document annotation (out of bounds)
    const invalidDoc: Partial<DocumentAnnotation> = {
      type: 'document',
      documentId: 'test-doc',
      page: 1,
      xPercent: 150, // Invalid!
      yPercent: 50,
      content: 'Invalid annotation'
    };
    console.log('Invalid doc:', annotationManager.validateAnnotation(invalidDoc));
    
    // Test valid image annotation
    const validImage: Partial<ImageAnnotation> = {
      type: 'image',
      documentId: 'test-img',
      xPixel: 100,
      yPixel: 200,
      content: 'Valid image annotation',
      color: '#FF0000'
    };
    console.log('Valid image:', annotationManager.validateAnnotation(validImage));
    
    // Test invalid image annotation (bad color)
    const invalidImage: Partial<ImageAnnotation> = {
      type: 'image',
      documentId: 'test-img',
      xPixel: 100,
      yPixel: 200,
      content: 'Invalid image annotation',
      color: 'red' // Invalid format!
    };
    console.log('Invalid image:', annotationManager.validateAnnotation(invalidImage));
  };
  
  return (
    <div className="p-4">
      <button
        onClick={testValidation}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Validation (check console)
      </button>
    </div>
  );
}

export default AnnotationManagerRenderPropExample;
