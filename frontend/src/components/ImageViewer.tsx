import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { X, Minus, Plus, Scan, Expand, Shrink, PanelRight } from "lucide-react";
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
  onToggleSidePanel?: () => void;

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

// Zoom step table for discrete zoom levels (Windows Photo Viewer style)
const ZOOM_STEPS = [0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0, 10.0];
const ACTUAL_SIZE = 1.0;

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
                  className={`w-10 h-10 rounded border-2 transition-all ${color === c ? "border-off-white scale-110" : "border-navy-600 hover:border-navy-500"
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
  onToggleSidePanel,

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

  // Initial fit logic - Only runs once when both image and container are ready
  useEffect(() => {
    if (isLoaded && imgNatural.w > 0 && containerSize.w > 0) {
      // Only set initial fit if we haven't set it yet (or if we want to force it on load)
      // We use a ref to track if we've done the initial fit for this document
      const fit = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
      setScale(fit);
      setTranslate({ x: 0, y: 0 });
      onZoomChange?.(fit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, imgNatural.w, imgNatural.h, documentUrl]); // Only run when image loads/changes

  // Clamp translation to keep image within bounds (if larger than viewport)
  // or center it (if smaller than viewport)
  const clampTranslate = useCallback((x: number, y: number, s: number) => {
    const scaledW = imgNatural.w * s;
    const scaledH = imgNatural.h * s;

    let newX = x;
    let newY = y;

    // Horizontal clamping
    if (scaledW <= containerSize.w) {
      newX = 0; // Center
    } else {
      const maxX = (scaledW - containerSize.w) / 2;
      newX = Math.max(-maxX, Math.min(maxX, x));
    }

    // Vertical clamping
    if (scaledH <= containerSize.h) {
      newY = 0; // Center
    } else {
      const maxY = (scaledH - containerSize.h) / 2;
      newY = Math.max(-maxY, Math.min(maxY, y));
    }

    return { x: newX, y: newY };
  }, [imgNatural, containerSize]);

  // Update scale and sync with prop if needed
  const updateScale = useCallback((newScale: number, center?: { x: number, y: number }) => {
    // Clamp scale
    const clampedScale = Math.max(0.01, Math.min(10.0, newScale));

    setScale(prevScale => {
      if (center) {
        // Zoom towards point
        // Point relative to container center
        const relX = center.x - containerSize.w / 2;
        const relY = center.y - containerSize.h / 2;

        // Calculate new translation
        // The point under the mouse should stay at the same screen position
        // ScreenPos = Center + Translate + (LocalPos * Scale)
        // We want ScreenPos to be constant.
        // LocalPos = (ScreenPos - Center - OldTranslate) / OldScale

        // Let's use a simpler delta approach:
        // The offset from center scales up/down.
        // NewTranslate = OldTranslate + (MousePos - OldTranslate) * (1 - NewScale/OldScale)
        // Wait, that formula assumes MousePos is relative to image center? No.

        // Correct formula for zooming into a point (cx, cy) relative to viewport center:
        // newTx = cx - (cx - oldTx) * (newScale / oldScale)
        // newTy = cy - (cy - oldTy) * (newScale / oldScale)

        // Where cx, cy are coordinates of the mouse relative to the center of the viewport
        // (which is also the origin of our translation system)

        // Let's verify:
        // Mouse is at 100px right of center. translate is 0. scale is 1.
        // We zoom to 2.
        // newTx = 100 - (100 - 0) * (2/1) = 100 - 200 = -100.
        // Image moves 100px left.
        // Point that was at 100px is now at: 0 + (-100) + (original_local_x * 2).
        // original_local_x for point at 100 was 100.
        // New pos = -100 + 200 = 100. Correct.

        setTranslate(prevTranslate => {
          const cx = center.x - containerSize.w / 2;
          const cy = center.y - containerSize.h / 2;

          const newTx = cx - (cx - prevTranslate.x) * (clampedScale / prevScale);
          const newTy = cy - (cy - prevTranslate.y) * (clampedScale / prevScale);

          return clampTranslate(newTx, newTy, clampedScale);
        });
      } else {
        // Just center zoom or fit
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
      // Fit command
      const fit = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
      updateScale(fit);
    }
  }, [propZoom, imgNatural, containerSize, getFitScale, updateScale]); // Removed 'scale' to avoid loops

  // Wheel Zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = -e.deltaY;
    const zoomIn = delta > 0;

    // Find next step
    const currentStepIdx = ZOOM_STEPS.findIndex(s => s >= scale);
    let nextScale = scale;

    if (zoomIn) {
      // If exact match, go next. If between, go to next larger.
      const nextIdx = ZOOM_STEPS.findIndex(s => s > scale + 0.001);
      if (nextIdx !== -1) nextScale = ZOOM_STEPS[nextIdx];
      else nextScale = ZOOM_STEPS[ZOOM_STEPS.length - 1];
    } else {
      // Find first step smaller than current
      // We iterate backwards or just find last one < scale
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

    // Get mouse position relative to viewport
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

  // Double Click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-annotation]')) return;

    const fit = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
    // If close to fit, zoom to 1.0. Else zoom to fit.
    if (Math.abs(scale - fit) < 0.01) {
      updateScale(1.0, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }); // Zoom to 100% at mouse? Or center? Windows viewer zooms to 100% at mouse.
      // offsetX is relative to target, which might be image. We need relative to container.
      const rect = outerRef.current?.getBoundingClientRect();
      if (rect) {
        updateScale(1.0, { x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      updateScale(fit);
    }
  };

  // Annotations coordinate conversion
  const clientToImage = (clientX: number, clientY: number) => {
    if (!outerRef.current) return { x: 0, y: 0 };
    const rect = outerRef.current.getBoundingClientRect();

    // Mouse relative to container center
    const cx = clientX - rect.left - rect.width / 2;
    const cy = clientY - rect.top - rect.height / 2;

    // Apply inverse transform
    // Screen = Translate + Scale * Local
    // Local = (Screen - Translate) / Scale
    const localX = (cx - translate.x) / scale;
    const localY = (cy - translate.y) / scale;

    // Local (0,0) is center of image
    // Image coords (0,0) is top-left
    return {
      x: Math.round(localX + imgNatural.w / 2),
      y: Math.round(localY + imgNatural.h / 2)
    };
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (e.button === 2 || e.ctrlKey) {
      e.preventDefault();
      const pos = clientToImage(e.clientX, e.clientY);
      if (pos.x < 0 || pos.y < 0 || pos.x > imgNatural.w || pos.y > imgNatural.h) return;
      setModalState({ isOpen: true, mode: "create", position: pos });
    }
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
  const handleAnnotationSave = (content: string, color: string) => {
    if (modalState.mode === "create" && modalState.position) {
      const newAnn = {
        type: "image" as const,
        documentId,
        xPixel: modalState.position.x,
        yPixel: modalState.position.y,
        content,
        color,
      };
      if (onAnnotationCreate) onAnnotationCreate(newAnn);
      else {
        setLocalAnnotations(prev => [...prev, { ...newAnn, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() }]);
      }
    } else if (modalState.mode === "edit" && modalState.annotation) {
      if (onAnnotationUpdate) onAnnotationUpdate(modalState.annotation.id, { content, color });
      else {
        setLocalAnnotations(prev => prev.map(a => a.id === modalState.annotation!.id ? { ...a, content, color, updatedAt: new Date() } : a));
      }
    }
  };

  const handleAnnotationDelete = () => {
    if (modalState.annotation) {
      if (onAnnotationDelete) onAnnotationDelete(modalState.annotation.id);
      else setLocalAnnotations(prev => prev.filter(a => a.id !== modalState.annotation!.id));
    }
  };

  const fitScale = getFitScale(imgNatural.w, imgNatural.h, containerSize.w, containerSize.h);
  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      ref={outerRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onClick={handleImageClick}
      onContextMenu={(e) => e.preventDefault()}
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
            pointerEvents: 'none' // Let events pass to wrapper/container for dragging, but we need clicks for annotations?
            // Actually we handle clicks on container.
          }}
        >
          <img
            ref={imageRef}
            src={documentUrl}
            alt="view"
            draggable={false}
            className="w-full h-full block"
          />

          {/* Annotations */}
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-md cursor-pointer transform hover:scale-125 transition-transform z-10 flex items-center justify-center text-xs font-bold text-black pointer-events-auto"
              style={{
                left: annotation.xPixel,
                top: annotation.yPixel,
                backgroundColor: annotation.color || "#FFEB3B",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setModalState({ isOpen: true, mode: "edit", annotation });
              }}
              data-annotation="true"
              title={annotation.content}
            >
              !
            </div>
          ))}
        </div>
      </div>

      {/* Vertical Toolbar (Right Center) */}
      <div
        className="group absolute right-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 px-1.5 py-2.5 bg-navy-900/90 backdrop-blur-xl border border-white/10 hover:border-blue-400/50 rounded-xl shadow-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] z-50 transition-all duration-300"
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
          className="p-1.5 text-blue-400 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-blue-300 hover:border-white/20 rounded-lg transition-all"
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
          className="p-1.5 text-blue-400 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-blue-300 hover:border-white/20 rounded-lg transition-all"
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
          className="p-1.5 text-blue-400 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-blue-300 hover:border-white/20 rounded-lg transition-all"
          title={Math.abs(scale - fitScale) < 0.01 ? "Zoom to Actual Size" : "Fit to Screen"}
        >
          <Scan size={18} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 backdrop-blur-sm border rounded-lg transition-all ${isFullscreen
            ? "text-blue-400 bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 hover:text-blue-300"
            : "text-blue-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-blue-300 hover:border-white/20"
            }`}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Shrink size={18} /> : <Expand size={18} />}
        </button>
      </div>

      <AnnotationModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialContent={modalState.annotation?.content}
        initialColor={modalState.annotation?.color}
        createdAt={modalState.annotation?.createdAt}
        updatedAt={modalState.annotation?.updatedAt}
        onSave={handleAnnotationSave}
        onDelete={handleAnnotationDelete}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
    </div>
  );
}
