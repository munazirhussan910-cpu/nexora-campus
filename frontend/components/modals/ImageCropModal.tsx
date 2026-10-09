'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

const CROP_CONTAINER_SIZE = 280; // Size of the viewport in px
const OUTPUT_SIZE = 320; // Crisp output avatar dimension

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize image and calculate min zoom so image always covers the square viewport
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      const naturalWidth = img.naturalWidth || 1;
      const naturalHeight = img.naturalHeight || 1;

      // Fit the image so the smallest dimension equals container size
      const fitZoom = Math.max(CROP_CONTAINER_SIZE / naturalWidth, CROP_CONTAINER_SIZE / naturalHeight);
      setMinZoom(fitZoom);
      setZoom(fitZoom);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(true);
    };
  }, [imageSrc, isOpen]);

  // Constrain position so image doesn't pan outside viewport
  const clampPosition = useCallback(
    (pos: { x: number; y: number }, currentZoom: number) => {
      if (!imageRef.current) return pos;
      const imgWidth = imageRef.current.naturalWidth * currentZoom;
      const imgHeight = imageRef.current.naturalHeight * currentZoom;

      const maxX = Math.max(0, (imgWidth - CROP_CONTAINER_SIZE) / 2);
      const maxY = Math.max(0, (imgHeight - CROP_CONTAINER_SIZE) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, pos.x)),
        y: Math.min(maxY, Math.max(-maxY, pos.y)),
      };
    },
    []
  );

  // Update live preview whenever zoom or position changes
  const updatePreview = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const img = imageRef.current;
    const scale = zoom;

    // Viewport center
    const vpCenterX = CROP_CONTAINER_SIZE / 2;
    const vpCenterY = CROP_CONTAINER_SIZE / 2;

    // Image center with offset
    const imgCenterX = vpCenterX + position.x;
    const imgCenterY = vpCenterY + position.y;

    // Source rect on natural image
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const srcWidth = CROP_CONTAINER_SIZE / scale;
    const srcHeight = CROP_CONTAINER_SIZE / scale;

    const srcX = (naturalWidth / 2) - (position.x / scale) - (srcWidth / 2);
    const srcY = (naturalHeight / 2) - (position.y / scale) - (srcHeight / 2);

    ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    try {
      // Use webp if supported, with jpeg fallback
      const dataUrl = canvas.toDataURL('image/webp', 0.88);
      setPreviewDataUrl(dataUrl);
    } catch {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPreviewDataUrl(dataUrl);
    }
  }, [zoom, position]);

  useEffect(() => {
    if (imageLoaded) {
      updatePreview();
    }
  }, [imageLoaded, zoom, position, updatePreview]);

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newPos = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPosition(clampPosition(newPos, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newPos = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    };
    setPosition(clampPosition(newPos, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(minZoom * 4, newZoom));
    setZoom(clampedZoom);
    setPosition((prev) => clampPosition(prev, clampedZoom));
  };

  const handleReset = () => {
    setZoom(minZoom);
    setPosition({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!previewDataUrl) return;
    onCropComplete(previewDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-tab-fade">
      {/* Hidden offscreen canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 text-foreground space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <span>Adjust &amp; Crop Profile Photo</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Drag to position and zoom to fit your face in the circular guide.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface hover:bg-surface-secondary text-muted-foreground hover:text-foreground border border-border transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Crop Viewport & Preview Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
          {/* Main interactive cropping viewport */}
          <div className="flex flex-col items-center">
            <div
              ref={containerRef}
              style={{ width: CROP_CONTAINER_SIZE, height: CROP_CONTAINER_SIZE }}
              className="relative overflow-hidden rounded-2xl bg-black border-2 border-[#2b354d] cursor-move select-none shadow-inner shadow-black"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Underlying zoomed & positioned image */}
              {imageLoaded && imageRef.current && (
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom / minZoom})`,
                    transformOrigin: 'center center',
                    width: imageRef.current.naturalWidth * minZoom,
                    height: imageRef.current.naturalHeight * minZoom,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  className="pointer-events-none transition-none"
                />
              )}

              {/* Darkened mask with circular punch-out */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: '0 0 0 9999px rgba(10, 13, 22, 0.65)',
                  borderRadius: '50%',
                  margin: '8px',
                  border: '2px solid rgba(212, 175, 55, 0.85)',
                }}
              />

              {/* Move Indicator badge */}
              <div className="absolute bottom-2 left-2 pointer-events-none px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-gray-300 flex items-center gap-1 border border-white/10">
                <Move size={10} />
                <span>Drag to pan</span>
              </div>
            </div>
          </div>

          {/* Live circular & square thumbnail preview */}
          <div className="flex sm:flex-col items-center justify-center gap-4 p-3 rounded-2xl bg-surface-secondary border border-border sm:w-32">
            <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground hidden sm:block">
              Avatar Preview
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-primary shadow-md bg-black">
                {previewDataUrl && (
                  <img
                    src={previewDataUrl}
                    alt="Circular preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">Circular DP</span>
            </div>
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="bg-surface-secondary p-3 sm:p-4 rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground">
            <span className="font-semibold flex items-center gap-1.5">
              <span>Zoom</span>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - minZoom * 0.25)}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-foreground border border-border transition"
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>

            <input
              type="range"
              min={minZoom}
              max={minZoom * 3.5}
              step={minZoom * 0.05}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-primary cursor-pointer h-1.5 bg-surface rounded-lg"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + minZoom * 0.25)}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-foreground border border-border transition"
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-foreground border border-border text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
