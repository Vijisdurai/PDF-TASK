import React, { useRef, useState, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X } from "lucide-react";
import type { ImageAnnotation } from "../contexts/AppContext";

interface ImageViewerProps {
  documentUrl: string;
  documentId: string;
  zoomScale?: number;
  onZoomChange?: (scale: number) => void;

  annotations?: ImageAnnotation[];
  onAnnotationCreate?: (a: Omit<ImageAnnotation, "id" | "createdAt" | "updatedAt">) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Omit<ImageAnnotation, "id" | "documentId" | "createdAt">>) => void;
  onAnnotationDelete?: (id: string) => void;

  className?: string;
}

interface AnnotationModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialContent?: string;
  initialColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
  onSave: (content: string, color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  "#FFEB3B", // Yellow
  "#FF9800", // Orange
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#4CAF50", // Green
];

function AnnotationModal({
  isOpen,
  mode,
  initialContent = "",
  initialColor = "#FFEB3B",
  createdAt,
  updatedAt,
  onSave,
  onDelete,
  onClose,
}: AnnotationModalProps) {
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState(initialColor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setColor(initialColor);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialContent, initialColor]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim(), color);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-navy-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-navy-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-off-white">
            {mode === "create" ? "Create Annotation" : "Edit Annotation"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-navy-700 rounded transition-colors text-gray-400 hover:text-off-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Note Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note..."
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-off-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Marker Color</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded border-2 transition-all ${
                    color === c ? "border-off-white scale-110" : "border-navy-600 hover:border-navy-500"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Metadata (Edit mode only) */}
          {mode === "edit" && (createdAt || updatedAt) && (
            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-navy-700">
              {createdAt && <div>Created: {formatDate(createdAt)}</div>}
              {updatedAt && <div>Updated: {formatDate(updatedAt)}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-navy-700">
          <div>
            {mode === "edit" && onDelete && (
              <>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Confirm delete?</span>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-navy-700 hover:bg-navy-600 text-off-white rounded text-sm transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-off-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageViewer({
  documentUrl,
  documentId,
  zoomScale: propZoom,
  onZoomChange,

  annotations: externalAnnotations,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,

  className = "",
}: ImageViewerProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  // natural image size
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });

  // outer viewport size
  const [viewport, setViewport] = useState({ w: 800, h: 600 });

  // internal state if controlled props not provided
  const [internalZoom, setInternalZoom] = useState(1);

  // effective scale (prop takes precedence)
  const scale = typeof propZoom === "number" ? propZoom : internalZoom;

  // workspace factor (Canva-style)
  const WORKSPACE_FACTOR = 5;

  const [fitScale, setFitScale] = useState(1);

  // local fallback for annotations
  const [localAnnotations, setLocalAnnotations] = useState<ImageAnnotation[]>([]);
  const annotations = externalAnnotations ?? localAnnotations;



  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    position?: { x: number; y: number };
    annotation?: ImageAnnotation;
  }>({
    isOpen: false,
    mode: "create",
  });



  /* --------------------------
     Helper to update zoom
     -------------------------- */
  const setZoomAndSync = useCallback(
    (newScale: number) => {
      // clamp
      const MIN = Math.max(0.25, fitScale * 0.5);
      const MAX = Math.max(fitScale * 6, 4);
      newScale = Math.max(MIN, Math.min(MAX, newScale));

      // update both internal and external
      setInternalZoom(newScale);
      onZoomChange?.(newScale);
    },
    [fitScale, onZoomChange]
  );

  /* --------------------------
     Image load: set fit scale and initial view
     -------------------------- */
  useEffect(() => {
    const img = new Image();
    img.src = documentUrl;
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });

      const outer = outerRef.current;
      if (!outer) return;

      // Subtract padding (32px total) to get actual available space
      const vw = outer.clientWidth - 32;
      const vh = outer.clientHeight - 32;
      setViewport({ w: vw, h: vh });

      const s = Math.min(vw / img.naturalWidth, vh / img.naturalHeight);
      setFitScale(s);

      // sync both internal and external on init
      setInternalZoom(s);
      onZoomChange?.(s);

      // Center scroll position using requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (outer) {
            const centerX = (outer.scrollWidth - outer.clientWidth) / 2;
            const centerY = (outer.scrollHeight - outer.clientHeight) / 2;
            outer.scrollLeft = centerX;
            outer.scrollTop = centerY;
          }
        });
      });
    };

    img.onerror = () => {
      // graceful fallback
    };
  }, [documentUrl, onZoomChange]);

  /* --------------------------
     Resize observer: recalc fit scale
     -------------------------- */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const ro = new ResizeObserver(() => {
      // Subtract padding (32px total) to get actual available space
      const vw = outer.clientWidth - 32;
      const vh = outer.clientHeight - 32;
      setViewport({ w: vw, h: vh });
      const s = Math.min(vw / imgNatural.w, vh / imgNatural.h);
      setFitScale(s);

      // if currently at (approx) fitScale, snap to new fitScale to keep image fully visible
      if (Math.abs(scale - fitScale) < 1e-6) {
        setInternalZoom(s);
        onZoomChange?.(s);
      }
    });

    ro.observe(outer);
    return () => ro.disconnect();
  }, [imgNatural, scale, fitScale, onZoomChange]);

  /* --------------------------
     Center scroll when scale changes to fit scale
     -------------------------- */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer || imgNatural.w === 1) return;

    // Only center when at fit scale (reset view)
    if (Math.abs(scale - fitScale) < 0.01) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const centerX = (outer.scrollWidth - outer.clientWidth) / 2;
          const centerY = (outer.scrollHeight - outer.clientHeight) / 2;
          outer.scrollLeft = centerX;
          outer.scrollTop = centerY;
        });
      });
    }
  }, [scale, fitScale, imgNatural.w]);

  /* --------------------------
     Wheel zoom
     -------------------------- */
  const onWheel = (e: React.WheelEvent) => {
    // Only handle Ctrl/Cmd + scroll for zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Smoother zoom with smaller increments
      const delta = -e.deltaY;
      const factor = 1 + Math.sign(delta) * 0.1;
      
      setZoomAndSync(scale * factor);
    }
    // Otherwise, let the browser handle normal scrolling (both vertical and horizontal)
  };

  /* --------------------------
     Buttons
     -------------------------- */
  const zoomIn = useCallback(() => {
    console.log('Zoom In clicked, current scale:', scale);
    setZoomAndSync(scale * 1.25);
  }, [scale, setZoomAndSync]);
  
  const zoomOut = useCallback(() => {
    console.log('Zoom Out clicked, current scale:', scale);
    setZoomAndSync(scale * 0.8);
  }, [scale, setZoomAndSync]);

  const resetView = useCallback(() => {
    console.log('Reset View clicked');
    const s = fitScale;
    setInternalZoom(s);
    onZoomChange?.(s);
  }, [fitScale, onZoomChange]);

  /* --------------------------
     Keyboard shortcuts
     -------------------------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom in: + or =
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        zoomIn();
      }
      // Zoom out: -
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        zoomOut();
      }
      // Reset: 0
      if (e.key === '0' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        resetView();
      }
      // Ctrl/Cmd + Scroll for zoom
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        }
        if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetView]);

  /* --------------------------
     Annotation helpers (client -> image px)
     -------------------------- */
  const clientToImage = (clientX: number, clientY: number) => {
    if (!outerRef.current || !workspaceRef.current) return { x: 0, y: 0 };
    const outerRect = outerRef.current.getBoundingClientRect();
    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    
    // Calculate position relative to the scaled image
    const localX = clientX - workspaceRect.left;
    const localY = clientY - workspaceRect.top;
    
    return {
      x: Math.round(localX / scale),
      y: Math.round(localY / scale),
    };
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const pos = clientToImage(e.clientX, e.clientY);
    if (pos.x < 0 || pos.y < 0 || pos.x > imgNatural.w || pos.y > imgNatural.h) return;

    // Open modal for annotation creation
    setModalState({
      isOpen: true,
      mode: "create",
      position: pos,
    });
  };

  const handleAnnotationSave = (content: string, color: string) => {
    if (modalState.mode === "create" && modalState.position) {
      // Create new annotation
      if (onAnnotationCreate) {
        onAnnotationCreate({
          type: "image",
          documentId,
          xPixel: modalState.position.x,
          yPixel: modalState.position.y,
          content,
          color,
        });
      } else {
        // Local fallback
        const newAnnotation: ImageAnnotation = {
          id: crypto.randomUUID(),
          type: "image",
          documentId,
          xPixel: modalState.position.x,
          yPixel: modalState.position.y,
          content,
          color,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setLocalAnnotations((prev) => [...prev, newAnnotation]);
      }
    } else if (modalState.mode === "edit" && modalState.annotation) {
      // Update existing annotation
      if (onAnnotationUpdate) {
        onAnnotationUpdate(modalState.annotation.id, { content, color });
      } else {
        // Local fallback
        setLocalAnnotations((prev) =>
          prev.map((a) =>
            a.id === modalState.annotation!.id
              ? { ...a, content, color, updatedAt: new Date() }
              : a
          )
        );
      }
    }
  };

  const handleAnnotationDelete = () => {
    if (modalState.annotation) {
      if (onAnnotationDelete) {
        onAnnotationDelete(modalState.annotation.id);
      } else {
        // Local fallback
        setLocalAnnotations((prev) => prev.filter((a) => a.id !== modalState.annotation!.id));
      }
    }
  };

  const handleAnnotationClick = (annotation: ImageAnnotation) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      annotation,
    });
  };

  /* --------------------------
     Render
     -------------------------- */
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* OUTER VIEWPORT */}
      <div
        ref={outerRef}
        className="w-full h-full relative overflow-auto bg-navy-800 scroll-smooth"
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        {/* IMAGE CONTAINER WRAPPER */}
        <div className="p-4 min-h-full" style={{
          display: 'flex',
          // viewport already has padding subtracted
          alignItems: (imgNatural.h * scale) > viewport.h ? 'flex-start' : 'center',
          justifyContent: (imgNatural.w * scale) > viewport.w ? 'flex-start' : 'center'
        }}>
          <div
            ref={workspaceRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: (() => {
                // viewport already has padding subtracted
                const overflowsWidth = (imgNatural.w * scale) > viewport.w;
                const overflowsHeight = (imgNatural.h * scale) > viewport.h;
                if (overflowsWidth && overflowsHeight) return "top left";
                if (overflowsWidth) return "center left";
                if (overflowsHeight) return "top center";
                return "center";
              })(),
              transition: "transform 0.1s ease-out",
            }}
          >
          {/* IMAGE LAYER */}
          <div
            style={{
              position: "relative",
              width: imgNatural.w,
              height: imgNatural.h,
            }}
          >
            <img
              ref={imageRef}
              src={documentUrl}
              alt="doc"
              draggable={false}
              style={{ width: "100%", height: "100%", display: "block" }}
            />

            {/* PIXEL-LOCKED NOTES */}
            {annotations.map((a) => (
              <div
                key={a.id}
                style={{
                  position: "absolute",
                  left: a.xPixel,
                  top: a.yPixel,
                  transform: "translate(-50%, -100%)",
                  zIndex: 20,
                }}
              >
                <div
                  className="px-2 py-1 rounded shadow cursor-pointer border-2 text-xs font-medium transition-transform hover:scale-110"
                  style={{
                    backgroundColor: a.color || "#FFEB3B",
                    borderColor: a.color ? `${a.color}CC` : "#F9A825",
                    color: "#000",
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleAnnotationClick(a);
                  }}
                  title={a.content}
                >
                  📝
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Annotation Modal */}
      <AnnotationModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialContent={modalState.annotation?.content}
        initialColor={modalState.annotation?.color}
        createdAt={modalState.annotation?.createdAt}
        updatedAt={modalState.annotation?.updatedAt}
        onSave={handleAnnotationSave}
        onDelete={modalState.mode === "edit" ? handleAnnotationDelete : undefined}
        onClose={() => setModalState({ isOpen: false, mode: "create" })}
      />
    </div>
  );
}
