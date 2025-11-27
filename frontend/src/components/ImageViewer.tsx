import React, { useRef, useState, useEffect, useCallback } from "react";
import { Minus, Plus, Scan, Expand, Shrink } from "lucide-react";
import AnnotationOverlay from './AnnotationOverlay';
import type { ImageAnnotation } from "../contexts/AppContext";

interface ImageViewerProps {
  documentUrl: string;
  documentId: string;
  zoomScale?: number;
  onZoomChange?: (scale: number) => void;

  annotations?: ImageAnnotation[];
  onAnnotationCreate?: (xPixel: number, yPixel: number, content: string, color: string) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Omit<ImageAnnotation, "id" | "documentId" | "createdAt">>) => void;
  onAnnotationDelete?: (id: string) => void;
  onAnnotationClick?: (annotation: import("../contexts/AppContext").Annotation) => void;

  className?: string;
}

// Zoom step table for discrete zoom levels (Windows Photo Viewer style)
const ZOOM_STEPS = [0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0, 10.0];

export default function ImageViewer({
  documentUrl,
  documentId,
  zoomScale: propZoom,
  onZoomChange,

  annotations: externalAnnotations,
  onAnnotationCreate,
  onAnnotationClick,

  className = "",
}: ImageViewerProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // State
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startTranslate, setStartTranslate] = useState({ x: 0, y: 0 });

  // Local annotations fallback
  const [localAnnotations, setLocalAnnotations] = useState<ImageAnnotation[]>([]);
  const annotations = externalAnnotations ?? localAnnotations;

  // Calculate fit scale
  const getFitScale = useCallback((imgW: number, imgH: number, contW: number, contH: number) => {
    if (imgW === 0 || imgH === 0 || contW === 0 || contH === 0) return 1;
    const scaleX = contW / imgW;
    const scaleY = contH / imgH;
    return Math.min(scaleX, scaleY);
  }, []);

  // Initialize image
  useEffect(() => {
    setIsLoaded(false);
    const img = new Image();
    img.src = documentUrl;
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setIsLoaded(true);
    };
  }, [documentUrl]);

  // Handle container resize
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(outer);
    return () => observer.disconnect();
  }, []);

  // Initial fit logic
  useEffect(() => {
    if (isLoaded && imgNatural.w > 0 && containerSize.w > 0) {
      const fit = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
      setScale(fit);
      setTranslate({ x: 0, y: 0 });
      onZoomChange?.(fit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, imgNatural.w, imgNatural.h, documentUrl]);

  // Clamp translation
  const clampTranslate = useCallback((x: number, y: number, s: number) => {
    const scaledW = imgNatural.w * s;
    const scaledH = imgNatural.h * s;

    let newX = x;
    let newY = y;

    if (scaledW <= containerSize.w) {
      newX = 0;
    } else {
      const maxX = (scaledW - containerSize.w) / 2;
      newX = Math.max(-maxX, Math.min(maxX, x));
    }

    if (scaledH <= containerSize.h) {
      newY = 0;
    } else {
      const maxY = (scaledH - containerSize.h) / 2;
      newY = Math.max(-maxY, Math.min(maxY, y));
    }

    return { x: newX, y: newY };
  }, [imgNatural, containerSize]);

  // Update scale
  const updateScale = useCallback((newScale: number, center?: { x: number, y: number }) => {
    const clampedScale = Math.max(0.01, Math.min(10.0, newScale));

    setScale(prevScale => {
      if (center) {
        setTranslate(prevTranslate => {
          const cx = center.x - containerSize.w / 2;
          const cy = center.y - containerSize.h / 2;

          const newTx = cx - (cx - prevTranslate.x) * (clampedScale / prevScale);
          const newTy = cy - (cy - prevTranslate.y) * (clampedScale / prevScale);

          return clampTranslate(newTx, newTy, clampedScale);
        });
      } else {
        setTranslate(prev => clampTranslate(prev.x, prev.y, clampedScale));
      }
      return clampedScale;
    });

    onZoomChange?.(clampedScale);
  }, [containerSize, clampTranslate, onZoomChange]);

  // Handle external zoom prop changes
  useEffect(() => {
    if (typeof propZoom === "number" && propZoom > 0 && Math.abs(propZoom - scale) > 0.001) {
      updateScale(propZoom);
    } else if (propZoom === -1) {
      const fit = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
      updateScale(fit);
    }
  }, [propZoom, imgNatural, containerSize, getFitScale, updateScale]);

  // Wheel Zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = -e.deltaY;
    const zoomIn = delta > 0;

    let nextScale = scale;

    if (zoomIn) {
      const nextIdx = ZOOM_STEPS.findIndex(s => s > scale + 0.001);
      if (nextIdx !== -1) nextScale = ZOOM_STEPS[nextIdx];
      else nextScale = ZOOM_STEPS[ZOOM_STEPS.length - 1];
    } else {
      let prevIdx = -1;
      for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
        if (ZOOM_STEPS[i] < scale - 0.001) {
          prevIdx = i;
          break;
        }
      }
      if (prevIdx !== -1) nextScale = ZOOM_STEPS[prevIdx];
      else nextScale = ZOOM_STEPS[0];
    }

    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    updateScale(nextScale, { x: mouseX, y: mouseY });
  }, [scale, updateScale]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    outer.addEventListener('wheel', handleWheel, { passive: false });
    return () => outer.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Drag Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-annotation]')) return;
    e.preventDefault();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartTranslate({ ...translate });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const newTx = startTranslate.x + dx;
    const newTy = startTranslate.y + dy;

    setTranslate(clampTranslate(newTx, newTy, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double Click - Disabled for zoom, used for annotations via AnnotationOverlay
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Zoom logic removed to allow double-click for annotations
    e.preventDefault();
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      outerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Annotation handlers
  const handleAnnotationCreate = (xPixel: number, yPixel: number, content: string, color: string) => {
    // Ensure coordinates are integers and within bounds
    const safeX = Math.max(0, Math.min(imgNatural.w, Math.round(xPixel)));
    const safeY = Math.max(0, Math.min(imgNatural.h, Math.round(yPixel)));

    if (onAnnotationCreate) {
      onAnnotationCreate(safeX, safeY, content, color);
    } else {
      // Fallback for local testing if needed
      const newAnn: ImageAnnotation = {
        id: crypto.randomUUID(),
        type: "image",
        documentId,
        xPixel: safeX,
        yPixel: safeY,
        content,
        color,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setLocalAnnotations(prev => [...prev, newAnn]);
    }
  };

  const handleAnnotationClick = (annotation: import("../contexts/AppContext").Annotation) => {
    // Exit fullscreen if active so the notes panel becomes visible
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        // Call the callback after exiting fullscreen
        if (onAnnotationClick) {
          onAnnotationClick(annotation);
        }
      }).catch((err) => {
        console.error('Failed to exit fullscreen:', err);
        // Call the callback anyway even if fullscreen exit fails
        if (onAnnotationClick) {
          onAnnotationClick(annotation);
        }
      });
    } else {
      // Not in fullscreen, just call the callback
      if (onAnnotationClick) {
        onAnnotationClick(annotation);
      }
    }
  };

  const fitScale = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);

  return (
    <div
      ref={outerRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Centered Wrapper */}
      <div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          width: 0,
          height: 0,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`
        }}
      >
        {/* Image centered on wrapper origin */}
        <div
          style={{
            width: imgNatural.w,
            height: imgNatural.h,
            position: 'absolute',
            left: -imgNatural.w / 2,
            top: -imgNatural.h / 2,
            pointerEvents: 'none'
          }}
        >
          <img
            ref={imageRef}
            src={documentUrl}
            alt="view"
            draggable={false}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Annotation Overlay - Same as PDFViewer */}
      {isLoaded && imgNatural.w > 0 && (
        <AnnotationOverlay
          annotations={annotations}
          documentType="image"
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
          documentWidth={imgNatural.w}
          documentHeight={imgNatural.h}
          scale={scale}
          panOffset={translate}
          isDragging={isDragging}
          onAnnotationClick={handleAnnotationClick}
          onCreateAnnotation={handleAnnotationCreate}
        />
      )}

      {/* Vertical Toolbar (Left Center) */}
      <div
        className="group absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 px-1.5 py-2.5 bg-black/20 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl shadow-lg z-50 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Zoom In */}
        <button
          onClick={() => {
            const currentIdx = ZOOM_STEPS.findIndex(s => s > scale + 0.001);
            const nextIdx = currentIdx === -1 ? ZOOM_STEPS.length - 1 : currentIdx;
            updateScale(ZOOM_STEPS[nextIdx]);
          }}
          className="p-1.5 text-white/70 bg-transparent border border-transparent hover:bg-white/10 hover:text-white hover:border-white/15 rounded-lg transition-all"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            const currentIdx = ZOOM_STEPS.findIndex(s => s >= scale - 0.001);
            const prevIdx = Math.max(0, currentIdx - 1);
            updateScale(ZOOM_STEPS[prevIdx]);
          }}
          className="p-1.5 text-white/70 bg-transparent border border-transparent hover:bg-white/10 hover:text-white hover:border-white/15 rounded-lg transition-all"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>

        <div className="w-3.5 h-px bg-white/20 my-0.5" />

        {/* Fit / Actual Size */}
        <button
          onClick={() => {
            if (Math.abs(scale - fitScale) < 0.01) {
              updateScale(1.0);
            } else {
              updateScale(fitScale);
            }
          }}
          className="p-1.5 text-white/70 bg-transparent border border-transparent hover:bg-white/10 hover:text-white hover:border-white/15 rounded-lg transition-all"
          title={Math.abs(scale - fitScale) < 0.01 ? "Zoom to Actual Size" : "Fit to Screen"}
        >
          <Scan size={18} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 border rounded-lg transition-all ${isFullscreen
            ? "text-white bg-white/20 border-white/20 hover:bg-white/25 hover:text-white"
            : "text-white/70 bg-transparent border-transparent hover:bg-white/10 hover:text-white hover:border-white/15"
            }`}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Shrink size={18} /> : <Expand size={18} />}
        </button>
      </div>
    </div>
  );
}
