import React, { useRef, useEffect, useState, useCallback } from 'react';
import mammoth from 'mammoth';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AnnotationOverlay from './AnnotationOverlay';
import type { Annotation } from '../contexts/AppContext';

interface DocxViewerProps {
  documentUrl: string;
  documentId: string;
  filename: string;
  currentPage: number;
  zoomScale: number;
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
  onAnnotationCreate?: (xPercent: number, yPercent: number, content: string) => void;
  onAnnotationUpdate?: (id: string, content: string) => void;
  onAnnotationDelete?: (id: string) => void;
  annotations?: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
}

interface DocxViewerState {
  htmlContent: string;
  pages: string[];
  isLoading: boolean;
  error: string | null;
}

const DocxViewer: React.FC<DocxViewerProps> = ({
  documentUrl,
  currentPage,
  zoomScale,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  onAnnotationCreate,
  annotations = [],
  onAnnotationClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<DocxViewerState>({
    htmlContent: '',
    pages: [],
    isLoading: true,
    error: null
  });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [documentDimensions, setDocumentDimensions] = useState({ width: 0, height: 0 });

  // Load DOCX document
  useEffect(() => {
    const loadDocx = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: [
            "p[style-name='Normal'] => p:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            "r[style-name='Strong'] => strong:fresh",
            "r[style-name='Emphasis'] => em:fresh"
          ]
        });

        const html = result.value;

        // Split into pages
        const pageBreaks = html.split(/<hr\s*\/?>/i);
        let pages = [];
        if (pageBreaks.length > 1) {
          pages = pageBreaks;
        } else {
          const words = html.split(' ');
          const wordsPerPage = 500;
          for (let i = 0; i < words.length; i += wordsPerPage) {
            pages.push(words.slice(i, i + wordsPerPage).join(' '));
          }
          if (pages.length === 0) pages = [html];
        }

        setState({
          htmlContent: html,
          pages,
          isLoading: false,
          error: null
        });

        if (onDocumentLoad) {
          onDocumentLoad(pages.length);
        }
      } catch (err) {
        console.error('Error loading DOCX:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load Word document'
        }));
      }
    };

    if (documentUrl) {
      loadDocx();
    }
  }, [documentUrl, onDocumentLoad]);

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update document dimensions when page renders or zoom changes
  useEffect(() => {
    if (pageRef.current) {
      setDocumentDimensions({
        width: pageRef.current.offsetWidth,
        height: pageRef.current.offsetHeight
      });
    }
  }, [state.pages, currentPage, zoomScale]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const prevScale = zoomScale;
      const baseScale = prevScale > 0 ? prevScale : 1;
      const newScale = Math.max(0.25, Math.min(5, baseScale + delta));

      if (newScale !== prevScale) {
        onZoomChange(newScale);
      }
    }
  }, [zoomScale, onZoomChange]);

  // Drag scrolling handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return;
    // Don't start drag if clicking on text (allow selection)
    // But PDF viewer allows drag everywhere. 
    // To allow text selection, we might want to check target.
    // However, requirement says "Pan with pointer drag".
    // Let's allow drag if not on an interactive element?
    // For now, replicate PDF behavior: drag everywhere.
    // If text selection is needed, user can't drag.
    // PDF.js usually handles this by allowing drag on background.

    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setScrollStart({ x: container.scrollLeft, y: container.scrollTop });
    // event.preventDefault(); // Prevent default to stop text selection? 
    // If we want text selection, we shouldn't prevent default, but then drag might interfere.
    // PDF viewer usually uses a "hand tool" mode vs "text selection" mode.
    // The requirement says "Pan with pointer drag".
    // I will enable drag and prevent default for now to match "Pan" behavior.
    event.preventDefault();
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    container.scrollLeft = scrollStart.x - deltaX;
    container.scrollTop = scrollStart.y - deltaY;
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-2 h-2 bg-ocean-blue rounded-full mx-auto mb-4 opacity-75" />
          <p className="text-off-white text-sm">Loading Document...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#525659] scroll-smooth"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 min-h-full min-w-full flex justify-center">
          <div className="relative">
            {/* Page Content */}
            <div
              ref={pageRef}
              className="bg-white shadow-2xl origin-top-center"
              style={{
                width: '816px', // Standard Letter width approx
                minHeight: '1056px', // Standard Letter height approx
                padding: '48px', // 0.5 inch margins
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <div
                className="prose prose-lg max-w-none"
                style={{
                  color: '#1f2937',
                  lineHeight: '1.7',
                  fontFamily: 'Georgia, serif'
                }}
                dangerouslySetInnerHTML={{
                  __html: state.pages[currentPage - 1] || ''
                }}
              />
            </div>

            {/* Annotation Overlay */}
            {onAnnotationCreate && documentDimensions.width > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: documentDimensions.width,
                  height: documentDimensions.height,
                  pointerEvents: 'none' // Let clicks pass through to overlay content
                }}
              >
                <AnnotationOverlay
                  annotations={annotations}
                  documentType="docx"
                  currentPage={currentPage}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                  documentWidth={documentDimensions.width}
                  documentHeight={documentDimensions.height}
                  onAnnotationClick={(annotation) => {
                    if (onAnnotationClick) {
                      onAnnotationClick(annotation);
                    }
                  }}
                  onCreateAnnotation={(x, y, content) => {
                    if (onAnnotationCreate) {
                      onAnnotationCreate(x, y, content);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocxViewer;