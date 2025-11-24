import React, { useRef, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
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

// Zoom step table for discrete zoom levels (Windows Photo Viewer style)
const ZOOM_STEPS = [0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0];
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

  className = "",
}: ImageViewerProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  // natural image size
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });

  // internal state if controlled props not provided
  const [internalZoom, setInternalZoom] = useState(1);

  // effective scale (prop takes precedence)
  const scale = typeof propZoom === "number" ? propZoom : internalZoom;

  const [fitScale, setFitScale] = useState(1);
  const [isFitMode, setIsFitMode] = useState(true);

  // Drag panning state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Flag to disable transitions for instant centering
  const [instantTransition, setInstantTransition] = useState(false);

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
     Calculate pan bounds for a given scale
     -------------------------- */
  const getPanBounds = useCallback((zoomScale: number) => {
    const outer = outerRef.current;
    if (!outer) return { minX: 0, maxX: 0, minY: 0, maxY: 0, allowPanX: false, allowPanY: false };

    const viewportWidth = outer.clientWidth;
    const viewportHeight = outer.clientHeight;
    const scaledWidth = imgNatural.w * zoomScale;
    const scaledHeight = imgNatural.h * zoomScale;

    const allowPanX = scaledWidth > viewportWidth;
    const allowPanY = scaledHeight > viewportHeight;

    const maxPanX = allowPanX ? (scaledWidth - viewportWidth) / 2 : 0;
    const maxPanY = allowPanY ? (scaledHeight - viewportHeight) / 2 : 0;

    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
      allowPanX,
      allowPanY
    };
  }, [imgNatural]);

  /* --------------------------
     Clamp pan offset to bounds
     -------------------------- */
  const clampPanOffset = useCallback((pan: { x: number; y: number }, zoomScale: number) => {
    const bounds = getPanBounds(zoomScale);
    return {
      x: bounds.allowPanX ? Math.max(bounds.minX, Math.min(bounds.maxX, pan.x)) : 0,
      y: bounds.allowPanY ? Math.max(bounds.minY, Math.min(bounds.maxY, pan.y)) : 0
    };
  }, [getPanBounds]);

  /* --------------------------
     Windows Photo Viewer Style Zoom Logic
     - Discrete zoom steps
     - Always anchored to cursor or viewport center
     - Fit mode vs Actual Size (100%)
     - Instant center when at/below fit scale
     -------------------------- */
  const setZoomAndSync = useCallback(
    (newScale: number, anchorX?: number, anchorY?: number) => {
      const outer = outerRef.current;
      if (!outer) {
        setInternalZoom(newScale);
        onZoomChange?.(newScale);
        return;
      }

      // Clamp zoom level to available steps
      newScale = Math.max(ZOOM_STEPS[0], Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], newScale));

      const viewportWidth = outer.clientWidth;
      const viewportHeight = outer.clientHeight;
      const scaledWidth = imgNatural.w * newScale;
      const scaledHeight = imgNatural.h * newScale;

      const epsilon = 0.02; // Tolerance for fit mode detection

      // Check if this is fit mode (within tolerance of fitScale)
      const isNowFit = Math.abs(newScale - fitScale) < epsilon;

      // FIT MODE: Always centered, instant transition
      if (isNowFit) {
        setInstantTransition(true);
        setInternalZoom(fitScale); // Use exact fit scale
        onZoomChange?.(fitScale);
        setPanOffset({ x: 0, y: 0 });
        setIsFitMode(true);
        setTimeout(() => setInstantTransition(false), 0);
        return;
      }

      setIsFitMode(false);

      // If image fits entirely in viewport, always center it
      const imageFitsInViewport = scaledWidth <= viewportWidth && scaledHeight <= viewportHeight;
      if (imageFitsInViewport) {
        setInstantTransition(true);
        setInternalZoom(newScale);
        onZoomChange?.(newScale);
        setPanOffset({ x: 0, y: 0 });
        setTimeout(() => setInstantTransition(false), 0);
        return;
      }

      // Determine anchor point: cursor position or viewport center
      let anchorScreenX: number;
      let anchorScreenY: number;

      if (anchorX !== undefined && anchorY !== undefined) {
        // Zoom at cursor position
        const rect = outer.getBoundingClientRect();
        anchorScreenX = anchorX - rect.left - viewportWidth / 2;
        anchorScreenY = anchorY - rect.top - viewportHeight / 2;
      } else {
        // Zoom at viewport center (toolbar controls)
        anchorScreenX = 0;
        anchorScreenY = 0;
      }

      // Calculate which image point is currently at the anchor
      // panOffset is in screen pixels: imagePoint = (anchorScreen - panOffset) / currentScale
      const imagePointX = (anchorScreenX - panOffset.x) / scale;
      const imagePointY = (anchorScreenY - panOffset.y) / scale;

      // Calculate new pan offset to keep the same image point at the anchor
      // newPanOffset = anchorScreen - imagePoint * newScale
      const newPan = {
        x: anchorScreenX - imagePointX * newScale,
        y: anchorScreenY - imagePointY * newScale
      };

      // Clamp pan offset to bounds
      const clampedPan = clampPanOffset(newPan, newScale);

      // Apply updates
      setInternalZoom(newScale);
      onZoomChange?.(newScale);
      setPanOffset(clampedPan);
    },
    [fitScale, onZoomChange, imgNatural, scale, panOffset, clampPanOffset]
  );

  /* --------------------------
     Handle external zoom changes (from header controls)
     -------------------------- */
  useEffect(() => {
    if (typeof propZoom === "number" && propZoom !== scale) {
      // External zoom changed - apply it through our zoom function
      setZoomAndSync(propZoom);
    }
  }, [propZoom, scale, setZoomAndSync]);

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

      const vw = outer.clientWidth;
      const vh = outer.clientHeight;

      const s = Math.min(vw / img.naturalWidth, vh / img.naturalHeight);
      setFitScale(s);

      // sync both internal and external on init
      setInternalZoom(s);
      onZoomChange?.(s);
      setIsFitMode(true);
    };

    img.onerror = () => {
      // graceful fallback
    };
  }, [documentUrl, onZoomChange]);

  /* --------------------------
     Resize observer: recalc fit scale and adjust if needed
     -------------------------- */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const ro = new ResizeObserver(() => {
      const vw = outer.clientWidth;
      const vh = outer.clientHeight;
      const s = Math.min(vw / imgNatural.w, vh / imgNatural.h);
      setFitScale(s);

      // If currently in fit mode, update to new fit scale
      if (isFitMode) {
        setInternalZoom(s);
        onZoomChange?.(s);
        setPanOffset({ x: 0, y: 0 });
      } else {
        // Reclamp pan offset to new bounds
        setPanOffset(prev => clampPanOffset(prev, scale));
      }
    });

    ro.observe(outer);
    return () => ro.disconnect();
  }, [imgNatural, isFitMode, onZoomChange, scale, clampPanOffset]);



  /* --------------------------
     Helper to find closest zoom step
     -------------------------- */
  const findClosestZoomStepIndex = useCallback((currentScale: number) => {
    return ZOOM_STEPS.reduce((closestIdx, curr, idx) =>
      Math.abs(curr - currentScale) < Math.abs(ZOOM_STEPS[closestIdx] - currentScale)
        ? idx
        : closestIdx
      , 0);
  }, []);

  /* --------------------------
     Wheel zoom with discrete steps (Windows Photo Viewer style)
     -------------------------- */
  const onWheel = useCallback((e: React.WheelEvent) => {
    // Prevent default browser scrolling
    e.preventDefault();
    e.stopPropagation();

    const delta = -e.deltaY;
    const zoomIn = delta > 0;

    // Find closest step to current scale
    const currentIdx = findClosestZoomStepIndex(scale);

    // Move to next/previous step
    let newIdx;
    if (zoomIn) {
      newIdx = Math.min(currentIdx + 1, ZOOM_STEPS.length - 1);
    } else {
      // If we are at a scale that is NOT in the steps (e.g. fit scale 0.18),
      // and we want to zoom out, we should go to the step BELOW it.
      // currentIdx will point to the closest (e.g. 0.2).
      // If we just do currentIdx - 1, we might go to 0.15, which is correct.
      // But if current scale is 0.18 and closest is 0.15, currentIdx is index of 0.15.
      // Then currentIdx - 1 is 0.1. Correct.
      // But if current scale is 0.18 and closest is 0.2, currentIdx is index of 0.2.
      // Then currentIdx - 1 is 0.15. Correct.

      // However, if we are at Fit Scale (e.g. 0.18) and it's smaller than ALL steps?
      // (Unlikely with 0.1 start, but possible).
      newIdx = Math.max(currentIdx - 1, 0);
    }

    const newScale = ZOOM_STEPS[newIdx];

    // Disable transition for snappy zoom
    setInstantTransition(true);

    // Zoom anchored to mouse position
    setZoomAndSync(newScale, e.clientX, e.clientY);

    // Re-enable transition after a short delay (optional, or just keep it off for zoom)
    requestAnimationFrame(() => setInstantTransition(false));
  }, [scale, findClosestZoomStepIndex, setZoomAndSync]);

  /* --------------------------
     Drag panning handlers (Windows Photos style - no scrollbars)
     -------------------------- */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan with left mouse button and when not clicking on annotation
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-annotation]')) return;

    const bounds = getPanBounds(scale);
    // Only allow dragging if image is larger than viewport in at least one dimension
    if (!bounds.allowPanX && !bounds.allowPanY) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, [getPanBounds, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setPanOffset(prev => {
      const newPan = {
        x: prev.x + deltaX,
        y: prev.y + deltaY
      };
      return clampPanOffset(newPan, scale);
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, clampPanOffset, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);





  /* --------------------------
     Annotation helpers (client -> image px)
     -------------------------- */
  const clientToImage = (clientX: number, clientY: number) => {
    if (!workspaceRef.current) return { x: 0, y: 0 };
    const workspaceRect = workspaceRef.current.getBoundingClientRect();

    // Calculate position relative to the scaled image
    const localX = clientX - workspaceRect.left;
    const localY = clientY - workspaceRect.top;

    return {
      x: Math.round(localX / scale),
      y: Math.round(localY / scale),
    };
  };

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    // Don't handle double-click on annotations
    if ((e.target as HTMLElement).closest('[data-annotation]')) return;

    e.preventDefault();
    e.stopPropagation();

    const epsilon = 0.01;

    // Windows Photo Viewer behavior: Toggle between Fit and Actual Size (100%)
    if (scale >= ACTUAL_SIZE - epsilon) {
      // Currently at or above 100% → Go to Fit (centered)
      setZoomAndSync(fitScale);
    } else {
      // Currently below 100% (fit or zoomed out) → Go to Actual Size, anchored at click
      setZoomAndSync(ACTUAL_SIZE, e.clientX, e.clientY);
    }
  }, [scale, fitScale, setZoomAndSync]);

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

  const handleAnnotationClick = (annotation: ImageAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({
      isOpen: true,
      mode: "edit",
      annotation,
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Right-click or Ctrl+click to create annotation
    if (e.button === 2 || e.ctrlKey) {
      e.preventDefault();
      const pos = clientToImage(e.clientX, e.clientY);
      if (pos.x < 0 || pos.y < 0 || pos.x > imgNatural.w || pos.y > imgNatural.h) return;

      setModalState({
        isOpen: true,
        mode: "create",
        position: pos,
      });
    }
  };

  /* --------------------------
     Render
     -------------------------- */
  const bounds = getPanBounds(scale);
  const canPan = bounds.allowPanX || bounds.allowPanY;

  return (
    <div
      className={`w-full h-full ${className}`}
      style={{
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* OUTER VIEWPORT - Microsoft Photos style container with fixed viewport */}
      <div
        ref={outerRef}
        className="w-full h-full bg-navy-800"
        style={{
          cursor: isDragging ? 'grabbing' : (canPan ? 'grab' : 'default'),
          overflow: 'hidden',
          position: 'relative',
        }}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* WRAPPER - provides centering */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* IMAGE WRAPPER - scales and pans the image */}
          <div
            ref={workspaceRef}
            style={{
              position: 'relative',
              width: imgNatural.w,
              height: imgNatural.h,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: (isDragging || instantTransition) ? 'none' : 'transform 0.2s ease-out, left 0.2s ease-out, top 0.2s ease-out',
              maxWidth: 'none',
              left: `${panOffset.x}px`,
              top: `${panOffset.y}px`,
            }}
          >
            {/* IMAGE LAYER */}
            <img
              ref={imageRef}
              src={documentUrl}
              alt="doc"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                userSelect: 'none',
              }}
            />

            {/* PIXEL-LOCKED NOTES */}
            {annotations.map((a) => (
              <div
                key={a.id}
                data-annotation
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
                  onClick={(ev) => handleAnnotationClick(a, ev)}
                  title={a.content}
                >
                  📝
                </div>
              </div>
            ))}
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
