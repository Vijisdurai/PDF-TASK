import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// ✅ Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  documentUrl: string;
  documentId: string;
  currentPage: number;
  zoomScale: number;
  panOffset: { x: number; y: number };
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onPanChange: (offset: { x: number; y: number }) => void;
  onDocumentLoad: (pages: number) => void;
  onAnnotationCreate?: (annotation: any) => void;
  onAnnotationUpdate?: (id: string, content: string) => void;
  onAnnotationDelete?: (id: string) => void;
  onAnnotationClick?: (annotation: any) => void;
  annotations: any[];
}

/**
 * PDFViewer component — renders a PDF document page by page with zoom and pan support
 */
const PDFViewer: React.FC<PDFViewerProps> = ({
  documentUrl,
  currentPage,
  zoomScale,
  panOffset,
  onDocumentLoad
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(documentUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        onDocumentLoad(pdf.numPages);
        console.log(`✅ PDF loaded: ${pdf.numPages} pages`);
      } catch (err) {
        console.error('❌ Failed to load PDF:', err);
      }
    };

    loadPdf();
  }, [documentUrl]);

  // Render the current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc) return;
      const canvas = canvasRef.current;
      if (!canvas) return; // 🚫 Guard null canvas

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale });

        // Setup canvas
        const context = canvas.getContext('2d');
        if (!context) {
          console.warn('⚠️ Canvas context not available');
          return;
        }

        // Clear previous content
        context.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page
        const renderContext = { canvasContext: context, viewport };
        await page.render(renderContext).promise;
        console.log(`📄 Rendered page ${currentPage}`);
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoomScale]);

  // Apply pan effect
  const panStyle = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
  };

  return (
    <div
      className="flex justify-center items-center w-full h-full overflow-hidden bg-gray-900"
      style={{ userSelect: 'none' }}
    >
      <div style={panStyle}>
        <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
      </div>
    </div>
  );
};

export default PDFViewer;
