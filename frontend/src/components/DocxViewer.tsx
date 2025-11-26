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
  const [pageElements, setPageElements] = useState<HTMLElement[]>([]);
  const [effectiveScale, setEffectiveScale] = useState(1);

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

        if (!isMounted) return;

        // Detect pages
        // Try multiple selectors
        let detectedPageElements = Array.from(contentRef.current.querySelectorAll('section.docx-content, section.docx-page, div.docx-page, article.docx-page')) as HTMLElement[];

        // If still 0, try looking for any section or article if they look like pages
        if (detectedPageElements.length === 0) {
          console.log('DocxViewer: No standard page classes found, trying broad search');
          const potentialPages = Array.from(contentRef.current.querySelectorAll('section, article')) as HTMLElement[];
          if (potentialPages.length > 0) {
            console.log('DocxViewer: Found potential pages via tag name:', potentialPages.length);
            detectedPageElements = potentialPages;
          }
        }

        console.log('DocxViewer: Detected pages:', detectedPageElements.length);
        setPageElements(detectedPageElements);

        const layouts: PageLayout[] = [];

        if (detectedPageElements.length > 0) {
          detectedPageElements.forEach((el, index) => {
            layouts.push({
              pageIndex: index + 1,
              width: el.offsetWidth,
              height: el.offsetHeight
            });
          });
        } else {
          // Fallback if no pages detected (single continuous doc)
          layouts.push({
            pageIndex: 1,
            width: contentRef.current.offsetWidth,
            height: contentRef.current.offsetHeight
          });
        }

        setPageLayouts(layouts);

        setState({
          isLoading: false,
          error: null
        });

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

  // Handle Pagination: Show only current page
  useEffect(() => {
    if (pageElements.length === 0) return;

    pageElements.forEach((el, index) => {
      if (index + 1 === currentPage) {
        el.style.display = 'block';
        // Add some margin/shadow to make it look like a page
        el.style.marginBottom = '20px';
        el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        el.style.backgroundColor = 'white';
      } else {
        el.style.display = 'none';
      }
    });

    // Scroll to top when page changes
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage, pageElements]);

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

  // Calculate effective scale based on Fit mode
  useEffect(() => {
    if (pageLayouts.length === 0 || containerDimensions.width === 0) return;

    const currentPageLayout = pageLayouts[currentPage - 1] || pageLayouts[0];
    const padding = 40; // 20px padding on each side

    let newScale = 1;

    if (zoomScale === -1) {
      // Fit to Page (Contain)
      const scaleX = (containerDimensions.width - padding) / currentPageLayout.width;
      const scaleY = (containerDimensions.height - padding) / currentPageLayout.height;
      newScale = Math.min(scaleX, scaleY);
    } else if (zoomScale === -2) {
      // Fit to Width
      newScale = (containerDimensions.width - padding) / currentPageLayout.width;
    } else {
      // Custom Zoom
      newScale = zoomScale;
    }

    // Clamp scale to reasonable limits
    newScale = Math.max(0.1, Math.min(5, newScale));

    setEffectiveScale(newScale);

  }, [zoomScale, containerDimensions, pageLayouts, currentPage]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const prevScale = effectiveScale;
      const newScale = Math.max(0.25, Math.min(5, prevScale + delta));

      if (newScale !== prevScale) {
        onZoomChange(newScale);
      }
    }
  }, [effectiveScale, onZoomChange]);

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

  const currentPageLayout = pageLayouts[currentPage - 1];

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
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 min-h-full min-w-full flex" style={{ width: 'fit-content' }}>
          <div
            className="relative m-auto"
            style={{
              width: currentPageLayout ? currentPageLayout.width * effectiveScale : 'auto',
              height: currentPageLayout ? currentPageLayout.height * effectiveScale : 'auto',
              overflow: 'hidden'
            }}
          >
            {/* Page Content */}
            <div
              ref={contentRef}
              className="bg-transparent origin-top-left docx-wrapper"
              style={{
                width: currentPageLayout ? currentPageLayout.width : 'auto',
                height: currentPageLayout ? currentPageLayout.height : 'auto',
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                minHeight: '100px',
                minWidth: '100px'
              }}
            />

            {/* Annotation Overlays - Only for current page */}
            {onAnnotationCreate && currentPageLayout && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none'
                }}
              >
                <AnnotationOverlay
                  annotations={annotations}
                  documentType="docx"
                  currentPage={currentPage}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                  documentWidth={currentPageLayout.width * effectiveScale}
                  documentHeight={currentPageLayout.height * effectiveScale}
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