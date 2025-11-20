import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageProps {
  page: pdfjsLib.PDFPageProxy;
  scale: number;
  onDimensionsCalculated?: (width: number, height: number) => void;
}

/**
 * PDFPage Component
 * Renders a single PDF page on canvas
 * Only re-renders when page changes, NOT on zoom
 */
const PDFPage: React.FC<PDFPageProps> = ({ page, scale, onDimensionsCalculated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || isRendering) return;

      try {
        setIsRendering(true);

        // Cancel previous render if exists
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Get viewport at scale 1 (actual PDF size)
        const viewport = page.getViewport({ scale: 1 });

        // Set canvas size to actual PDF dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Notify parent of dimensions
        if (onDimensionsCalculated) {
          onDimensionsCalculated(viewport.width, viewport.height);
        }

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF at scale 1
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
        setIsRendering(false);
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', error);
        }
        setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [page]); // Only re-render when page changes

  return (
    <canvas
      ref={canvasRef}
      className="pdf-page-canvas"
      style={{
        display: 'block',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
};

export default PDFPage;
