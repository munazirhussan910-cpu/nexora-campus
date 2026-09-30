'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  ZapOff,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  Eye,
} from 'lucide-react';

interface QrCameraScannerProps {
  onScan: (qrToken: string) => void;
  isPaused?: boolean;
  onSwitchToPin?: () => void;
}

export function QrCameraScanner({
  onScan,
  isPaused = false,
  onSwitchToPin,
}: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningLockedRef = useRef(false);

  const [cameraState, setCameraState] = useState<
    'INIT' | 'RUNNING' | 'PERMISSION_DENIED' | 'NO_CAMERA' | 'ERROR'
  >('INIT');
  const [errorMessage, setErrorMessage] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);

  // Play audio chime on successful detection
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay might be restricted before interaction; ignore
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Check for multiple video inputs
  const checkCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch {
      // ignore enumeration errors
    }
  }, []);

  // Frame processing loop with jsQR
  const startScanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    let offscreenCanvas = canvasRef.current;
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      canvasRef.current = offscreenCanvas;
    }
    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let lastTick = 0;

    const scanFrame = (timestamp: number) => {
      // Throttle scanning to ~12-15 fps to preserve battery & CPU while remaining responsive
      if (timestamp - lastTick >= 70) {
        lastTick = timestamp;

        if (
          video.readyState === video.HAVE_ENOUGH_DATA &&
          !isScanningLockedRef.current &&
          !isPaused
        ) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            // Keep analysis canvas reasonable in size (max 640px) for fast parsing
            const scale = Math.min(1, 640 / Math.max(width, height));
            const scaledWidth = Math.floor(width * scale);
            const scaledHeight = Math.floor(height * scale);

            if (offscreenCanvas.width !== scaledWidth || offscreenCanvas.height !== scaledHeight) {
              offscreenCanvas.width = scaledWidth;
              offscreenCanvas.height = scaledHeight;
            }

            ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
            const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data && code.data.trim()) {
              // Lock immediately to prevent duplicate scans of the same QR
              isScanningLockedRef.current = true;
              setScanFlash(true);
              playBeep();

              setTimeout(() => setScanFlash(false), 600);
              onScan(code.data.trim());
              return; // Stop animation loop until unlocked
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [isPaused, onScan, playBeep]);

  // Start device camera
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraState('INIT');
    setErrorMessage('');
    isScanningLockedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('NO_CAMERA');
      setErrorMessage('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch capabilities
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setTorchAvailable(!!capabilities.torch);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraState('RUNNING');
        startScanLoop();
      }

      await checkCameraDevices();
    } catch (err: any) {
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError'
      ) {
        setCameraState('PERMISSION_DENIED');
        setErrorMessage(
          'Camera permission was denied. Please allow camera access in browser settings to scan QR passes.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('NO_CAMERA');
        setErrorMessage('No camera hardware detected on this device.');
      } else {
        setCameraState('ERROR');
        setErrorMessage(err.message || 'Failed to initialize device camera.');
      }
    }
  }, [facingMode, checkCameraDevices, startScanLoop, stopCameraStream]);

  // Flip camera between front and rear
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchAvailable) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      // ignore constraint error
    }
  };

  // Unlock scanning when not paused
  useEffect(() => {
    if (!isPaused && cameraState === 'RUNNING') {
      isScanningLockedRef.current = false;
      if (!animationFrameRef.current) {
        startScanLoop();
      }
    } else if (isPaused) {
      isScanningLockedRef.current = true;
    }
  }, [isPaused, cameraState, startScanLoop]);

  // Camera start / restart on facingMode change or mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  return (
    <div className="w-full space-y-3">
      {/* Scanner Viewport Container */}
      <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[420px] bg-black rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl flex items-center justify-center">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraState === 'RUNNING' ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          playsInline
          muted
        />

        {/* State Overlays */}
        {cameraState === 'INIT' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d111a]/95 text-cyan-400 space-y-3 z-20">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center animate-pulse">
              <Camera size={26} className="text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold tracking-tight text-white">
                Accessing Camera...
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Requesting hardware video stream permissions
              </div>
            </div>
          </div>
        )}

        {cameraState === 'PERMISSION_DENIED' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0e111a] text-gray-300 space-y-4 z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <CameraOff size={26} />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <div className="text-sm font-bold text-white tracking-tight">
                Camera Permission Blocked
              </div>
              <p className="text-xs text-rose-300 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full max-w-xs">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
              {onSwitchToPin && (
                <button
                  type="button"
                  onClick={onSwitchToPin}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b2234] hover:bg-[#252f47] border border-[#2e374d] text-gray-300 font-semibold text-xs transition"
                >
                  Use PIN Instead
                </button>
              )}
            </div>
          </div>
        )}

        {(cameraState === 'NO_CAMERA' || cameraState === 'ERROR') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0e111a] text-gray-300 space-y-4 z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle size={26} />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <div className="text-sm font-bold text-white tracking-tight">
                Camera Unavailable
              </div>
              <p className="text-xs text-amber-300 leading-relaxed">
                {errorMessage || 'Unable to start camera video stream.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full max-w-xs">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Retry Camera</span>
              </button>
              {onSwitchToPin && (
                <button
                  type="button"
                  onClick={onSwitchToPin}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b2234] hover:bg-[#252f47] border border-[#2e374d] text-gray-300 font-semibold text-xs transition"
                >
                  Use PIN Instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Viewfinder & Laser Scanning Overlay (When Running) */}
        {cameraState === 'RUNNING' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            {/* Viewfinder Target Area */}
            <div
              className={`relative w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] rounded-2xl transition-all duration-200 ${
                scanFlash
                  ? 'border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)] scale-105'
                  : 'border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
              }`}
            >
              {/* Corner Reticles */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              {!isPaused && (
                <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-scan-beam" />
              )}

              {/* Scan Detection Flash */}
              {scanFlash && (
                <div className="absolute inset-0 bg-emerald-400/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={48} className="text-emerald-400 animate-in zoom-in-75 duration-150" />
                </div>
              )}
            </div>

            {/* Instruction Banner at Bottom of Viewport */}
            <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-auto">
              <div className="px-3.5 py-1.5 rounded-full bg-[#0a0e17]/85 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-lg">
                <ScanLine size={13} className="text-cyan-400 animate-pulse" />
                <span>
                  {isPaused
                    ? 'QR Code detected • Verifying credentials...'
                    : 'Align student QR code within square'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Action Controls on Viewport */}
        {cameraState === 'RUNNING' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20 pointer-events-auto">
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch Camera (Front/Back)"
                aria-label="Switch Camera"
                className="w-9 h-9 rounded-xl bg-[#0a0e17]/80 hover:bg-[#162033] backdrop-blur-md border border-cyan-500/40 text-cyan-400 flex items-center justify-center transition active:scale-95 shadow-md"
              >
                <RefreshCw size={15} />
              </button>
            )}

            {torchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                aria-label="Toggle Flashlight"
                className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center transition active:scale-95 shadow-md ${
                  torchOn
                    ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                    : 'bg-[#0a0e17]/80 hover:bg-[#162033] border-cyan-500/40 text-cyan-400'
                }`}
              >
                {torchOn ? <ZapOff size={15} /> : <Zap size={15} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Viewport Meta & Scanner Indicator */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono px-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              cameraState === 'RUNNING'
                ? isPaused
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-gray-300">
            {cameraState === 'RUNNING'
              ? isPaused
                ? 'Optical Turnstile Locked'
                : 'Live Optical Stream Active'
              : 'Optical Turnstile Offline'}
          </span>
        </div>

        {cameraState === 'RUNNING' && (
          <span className="text-cyan-400/80 font-bold uppercase tracking-wider text-[10px]">
            {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
          </span>
        )}
      </div>
    </div>
  );
}
