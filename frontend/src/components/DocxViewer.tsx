import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
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
  isLoading: boolean;
  error: string | null;
}

interface PageLayout {
  pageIndex: number;
  top: number;
  left: number;
  width: number;
  height: number;
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<DocxViewerState>({
    isLoading: true,
    error: null
  });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [pageLayouts, setPageLayouts] = useState<PageLayout[]>([]);

  // Load DOCX document
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDocx = async () => {
      // Wait for contentRef to be available if it's not yet
      if (!contentRef.current) {
        console.warn('DocxViewer: contentRef is null, retrying in 100ms');
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!contentRef.current) {
          console.error('DocxViewer: contentRef still null after retry');
          return;
        }
      }

      if (!documentUrl) {
        console.warn('DocxViewer: No documentUrl provided');
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false, error: 'No document URL provided' }));
          if (onDocumentLoad) onDocumentLoad(0);
        }
        return;
      }

      console.log('DocxViewer: Starting load for', documentUrl);

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Loading timed out after 15s')), 15000);
        });

        // Fetch blob
        const fetchPromise = fetch(documentUrl, { signal: abortController.signal })
          .then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.blob();
          });

        const blob = await Promise.race([fetchPromise, timeoutPromise]) as Blob;

        console.log('DocxViewer: Fetched blob size:', blob.size);

        if (!isMounted || !contentRef.current) return;

        // Clear previous content
        contentRef.current.innerHTML = '';

        console.log('DocxViewer: Calling renderAsync...');

        // Render with docx-preview
        await Promise.race([
          renderAsync(blob, contentRef.current, contentRef.current, {
            className: 'docx-content',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderChanges: false,
            debug: true,
          }),
          timeoutPromise
        ]);

        console.log('DocxViewer: renderAsync completed');
        console.log('DocxViewer: Rendered HTML length:', contentRef.current.innerHTML.length);

        if (!isMounted) return;

        setState({
          isLoading: false,
          error: null
        });

        // Detect pages and store their layouts
        const pageElements = contentRef.current.querySelectorAll('section.docx-page, div.docx-page');
        console.log('DocxViewer: Detected pages:', pageElements.length);

        const layouts: PageLayout[] = [];

        if (pageElements.length > 0) {
          pageElements.forEach((el, index) => {
            const relativeTop = (el as HTMLElement).offsetTop;
            const relativeLeft = (el as HTMLElement).offsetLeft;

            layouts.push({
              pageIndex: index + 1,
              top: relativeTop,
              left: relativeLeft,
              width: (el as HTMLElement).offsetWidth,
              height: (el as HTMLElement).offsetHeight
            });
          });
        } else {
          // Fallback if no pages detected (single continuous doc)
          layouts.push({
            pageIndex: 1,
            top: 0,
            left: 0,
            width: contentRef.current.offsetWidth,
            height: contentRef.current.offsetHeight
          });
        }

        setPageLayouts(layouts);

        if (onDocumentLoad) {
          onDocumentLoad(layouts.length);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('DocxViewer: Error loading DOCX:', err);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to load Word document'
          }));

          // Ensure parent knows loading is done, even on error
          if (onDocumentLoad) {
            onDocumentLoad(0);
          }
        }
      }
    };

    loadDocx();

    return () => {
      isMounted = false;
      abortController.abort();
    };
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

  // Handle Scroll to update current page
  const handleScroll = useCallback(() => {
    if (!containerRef.current || pageLayouts.length === 0) return;

    const container = containerRef.current;
    const scrollMid = container.scrollTop + container.clientHeight / 2;

    const scaledScroll = scrollMid / zoomScale;

    const currentPageLayout = pageLayouts.find(layout => {
      const pageBottom = layout.top + layout.height;
      return scaledScroll >= layout.top && scaledScroll < pageBottom;
    });

    if (currentPageLayout && currentPageLayout.pageIndex !== currentPage) {
      onPageChange(currentPageLayout.pageIndex);
    }
  }, [pageLayouts, zoomScale, currentPage, onPageChange]);

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

    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setScrollStart({ x: container.scrollLeft, y: container.scrollTop });
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#525659] bg-opacity-90">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-ocean-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-off-white text-sm">Loading Document...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {state.error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#525659]">
          <div className="text-center text-red-400">
            <p className="text-lg font-semibold mb-2">Error</p>
            <p>{state.error}</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#525659] scroll-smooth"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onScroll={handleScroll}
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
              ref={contentRef}
              className="bg-white shadow-2xl origin-top-center docx-wrapper"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                minHeight: '100px', // Ensure it has some height even when empty
                minWidth: '100px'
              }}
            />

            {/* Annotation Overlays - One per page */}
            {onAnnotationCreate && pageLayouts.map((layout) => (
              <div
                key={layout.pageIndex}
                style={{
                  position: 'absolute',
                  top: layout.top,
                  left: layout.left,
                  width: layout.width,
                  height: layout.height,
                  pointerEvents: 'none',
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left', // Scale from top-left of the page
                }}
              >
                <AnnotationOverlay
                  annotations={annotations}
                  documentType="docx"
                  currentPage={layout.pageIndex}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                  documentWidth={layout.width}
                  documentHeight={layout.height}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocxViewer;