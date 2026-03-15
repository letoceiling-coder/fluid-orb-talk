import { useState, useCallback, useRef, useEffect } from 'react';
import { cameraService, type CameraOptions } from '@/services/CameraService';

export interface UseCameraResult {
  videoRef:        React.RefObject<HTMLVideoElement | null>;
  isActive:        boolean;
  isStarting:      boolean;
  error:           string | null;
  permissionDenied: boolean;
  startCamera:     (options?: CameraOptions) => Promise<void>;
  stopCamera:      () => void;
  captureFrame:    () => string | null;
  supported:       boolean;
}

export function useCamera(autoStart = false): UseCameraResult {
  const videoRef       = useRef<HTMLVideoElement | null>(null);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isActive,    setIsActive]    = useState(false);
  const [isStarting,  setIsStarting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startCamera = useCallback(async (options?: CameraOptions) => {
    console.log("Camera request starting");
    console.log("Video element:", videoRef.current);
    if (!videoRef.current) {
      console.error("videoRef.current is null");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => void startCamera(options), 300);
      return;
    }
    setError(null);
    setPermissionDenied(false);
    setIsStarting(true);

    try {
      const stream = await cameraService.startCamera(videoRef.current, options);
      console.log("Camera stream obtained", stream);
      console.log("Stream tracks:", stream.getTracks());
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log("Video stream attached to element");
      setIsActive(true);
    } catch (e) {
      console.error("Camera start error", e);
      const msg = e instanceof Error ? e.message : 'Camera unavailable';
      setError(msg);
      setIsActive(false);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => void startCamera(options), 300);

      // Detect permission denial from the human-readable message CameraService produces
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setPermissionDenied(true);
      }
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    cameraService.stopCamera();
    setIsActive(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    return cameraService.captureFrame();
  }, []);

  // Auto-start on mount when requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      cameraService.stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    isActive,
    isStarting,
    error,
    permissionDenied,
    startCamera,
    stopCamera,
    captureFrame,
    supported: cameraService.supported,
  };
}
