import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Aperture, Loader2, Eye, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { visionService, type VisionResponse } from '@/services/VisionService';

interface CameraOverlayProps {
  onAnalysis?:    (result: VisionResponse) => void;
  analyzePrompt?: string;
  showControls?:  boolean;
  autoStart?:     boolean;
  className?:     string;
}

export function CameraOverlay({
  onAnalysis,
  analyzePrompt = 'Describe what you see in detail.',
  showControls  = true,
  autoStart     = true,
  className     = '',
}: CameraOverlayProps) {
  const {
    videoRef,
    isActive,
    isStarting,
    error,
    permissionDenied,
    startCamera,
    stopCamera,
    captureFrame,
    supported,
  } = useCamera(false); // manage auto-start ourselves so we can pass autoStart prop

  const [isAnalyzing,     setIsAnalyzing]     = useState(false);
  const [lastResult,      setLastResult]      = useState<VisionResponse | null>(null);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);

  // ── Auto-start on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (autoStart && supported) {
      startCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Vision analysis ──────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    setCapturedFrameUrl(frame);
    setIsAnalyzing(true);
    setLastResult(null);

    try {
      const result = await visionService.analyzeImage(frame, analyzePrompt);
      setLastResult(result);
      onAnalysis?.(result);
    } catch (e) {
      setLastResult({
        description: e instanceof Error ? e.message : 'Analysis failed. Check backend connection.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrame, analyzePrompt, onAnalysis]);

  // ── Idle / error state (camera not active) ────────────────────────────────
  const renderIdleState = () => {
    if (!supported) {
      return (
        <div className="flex flex-col items-center gap-3 text-muted-foreground px-4 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-xs">Camera API not supported in this browser.</p>
        </div>
      );
    }

    if (isStarting) {
      return (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <p className="text-xs">Requesting camera access…</p>
        </div>
      );
    }

    if (permissionDenied) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive/60" />
          <p className="text-xs text-destructive font-medium">Camera permission denied</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Please allow camera access in your browser settings, then click Retry.
          </p>
          {showControls && (
            <Button
              onClick={() => startCamera()}
              size="sm"
              variant="outline"
              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-[10px] text-destructive leading-relaxed">{error}</p>
          {showControls && (
            <Button onClick={() => startCamera()} size="sm" variant="outline" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      );
    }

    // Default idle — camera off, no error
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Camera className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-xs">Camera off</p>
        {showControls && (
          <Button onClick={() => startCamera()} size="sm" className="gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Enable Camera
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* ── Video viewport ─────────────────────────────────────────────── */}
      <div className="relative bg-black/90 flex items-center justify-center overflow-hidden flex-1 min-h-[200px]">

        {/* Always rendered so the ref is available immediately */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video w-full h-full object-cover transition-opacity duration-300 ${
            isActive ? 'opacity-90' : 'opacity-0 absolute pointer-events-none'
          }`}
        />

        {/* Idle / error overlay */}
        {!isActive && (
          <div className="flex flex-col items-center gap-3 z-10">
            {renderIdleState()}
          </div>
        )}

        {/* ── Analyzing overlay ───────────────────────────────────────── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                >
                  <Eye className="h-8 w-8 text-primary" />
                </motion.div>
                <span className="text-xs text-primary font-medium">Analyzing…</span>
              </div>
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active camera controls ──────────────────────────────────── */}
        {isActive && showControls && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/20 backdrop-blur-lg border border-border/30 text-foreground hover:bg-background/40"
              onClick={stopCamera}
              title="Turn off camera"
            >
              <CameraOff className="h-4 w-4 text-destructive" />
            </Button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors disabled:opacity-50"
              title="Capture and analyze"
            >
              {isAnalyzing
                ? <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
                : <Aperture className="h-6 w-6 text-primary-foreground" />
              }
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Analysis result ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-card/50 border-t border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                  Vision Analysis
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{lastResult.description}</p>
              {lastResult.objects && lastResult.objects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {lastResult.objects.map((obj) => (
                    <span key={obj} className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {obj}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Captured frame thumbnail ─────────────────────────────────────── */}
      {capturedFrameUrl && (
        <div className="absolute top-2 right-2 w-20 h-12 rounded border border-border/30 overflow-hidden shadow-md">
          <img src={capturedFrameUrl} alt="Captured" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
