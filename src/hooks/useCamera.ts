import { useState, useCallback, useRef, useEffect } from 'react';
import { cameraService, type CameraOptions } from '@/services/CameraService';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  error: string | null;
  startCamera: (options?: CameraOptions) => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { cameraService.stopCamera(); };
  }, []);

  const startCamera = useCallback(async (options?: CameraOptions) => {
    if (!videoRef.current) return;
    setError(null);
    try {
      await cameraService.startCamera(videoRef.current, options);
      setIsActive(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera unavailable';
      setError(msg);
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraService.stopCamera();
    setIsActive(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    return cameraService.captureFrame();
  }, []);

  return { videoRef, isActive, error, startCamera, stopCamera, captureFrame };
}
