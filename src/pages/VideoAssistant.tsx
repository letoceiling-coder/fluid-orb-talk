import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, CameraOff, SwitchCamera, Mic, MicOff, Video,
  Zap, Maximize2, Minimize2, Aperture, Eye, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoAssistantController } from "@/controllers/assistant/VideoAssistantController";

type AnalysisState = "idle" | "scanning" | "analyzing" | "complete";

export default function VideoAssistant() {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<VideoAssistantController | null>(null);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !controllerRef.current) return;
    try {
      await controllerRef.current.initialize(videoRef.current);
      setCurrentAnalysis("");
    } catch {
      // handled by controller callbacks
    }
  }, []);

  const stopCamera = useCallback(() => {
    controllerRef.current?.stopCamera();
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (!videoRef.current || !controllerRef.current) return;
    try {
      await controllerRef.current.switchCamera(videoRef.current);
    } catch {
      // handled by controller callbacks
    }
  }, [facingMode]);

  const captureFrame = useCallback(async () => {
    if (!controllerRef.current) return;
    setAnalysisState("scanning");
    setTimeout(() => setAnalysisState("analyzing"), 300);

    try {
      const { frame, result } = await controllerRef.current.captureFrame();
      setCapturedFrames((prev) => [frame, ...prev].slice(0, 6));
      setCurrentAnalysis(result.description);
      setAnalysisState("complete");
      setTimeout(() => setAnalysisState("idle"), 6000);
    } catch {
      setAnalysisState("idle");
    }
  }, []);

  useEffect(() => {
    const controller = new VideoAssistantController({
      onVisionResult: (result) => {
        console.log("[VideoAssistant] Vision response:", result);
      },
      onStateChange: (state) => {
        if (state === "CAMERA_READY") setCameraActive(true);
        if (state === "STOPPED" || state === "CAMERA_ERROR") setCameraActive(false);
      },
      onError: (error, state) => {
        if (state === "CAMERA_ERROR") {
          setCurrentAnalysis(`Camera error: ${error}`);
          setAnalysisState("idle");
        } else {
          setCurrentAnalysis(`Vision error: ${error}`);
          setAnalysisState("idle");
        }
      },
    });
    controllerRef.current = controller;

    const timer = setTimeout(() => {
      if (videoRef.current) void controller.initialize(videoRef.current);
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.stopAutoScan();
      controller.stopCamera();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div className={`flex flex-col h-[calc(100vh-3rem)] bg-background ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Video Assistant</h1>
            <p className="text-[10px] text-muted-foreground">AI Vision Analysis • Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {analysisState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-[10px] font-medium text-primary capitalize">{analysisState}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera viewport */}
        <div className="flex-1 relative bg-black/90 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? "opacity-100" : "opacity-0 absolute pointer-events-none"}`}
          />
          {/* Scanning overlay */}
          <AnimatePresence>
            {cameraActive && analysisState === "scanning" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 1.5, ease: "linear" }}
                />
                <div className="absolute inset-4 border border-primary/30 rounded-lg" />
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Detection boxes */}
          <AnimatePresence>
            {cameraActive && analysisState === "analyzing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {[
                  { top: "15%", left: "20%", w: "25%", h: "30%" },
                  { top: "40%", left: "55%", w: "20%", h: "25%" },
                  { top: "60%", left: "10%", w: "30%", h: "20%" },
                ].map((box, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className="absolute border border-primary/60 rounded-md"
                    style={{ top: box.top, left: box.left, width: box.w, height: box.h }}
                  >
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-primary/80 rounded text-[9px] text-primary-foreground font-medium">
                      Object {i + 1}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
            {!cameraActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-muted-foreground px-6 text-center"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
                <Camera className="h-16 w-16 relative z-10 text-muted-foreground/40" />
              </div>
              {currentAnalysis && currentAnalysis.startsWith("Camera error") ? (
                <>
                  <p className="text-sm text-destructive/80">{currentAnalysis}</p>
                  <Button onClick={startCamera} variant="outline" className="gap-2">
                    <Camera className="h-4 w-4" /> Retry Camera
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm">Enable camera to start AI vision analysis</p>
                  <Button onClick={startCamera} className="gap-2">
                    <Camera className="h-4 w-4" /> Start Camera
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Bottom controls */}
          {cameraActive && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-background/20 backdrop-blur-lg border border-border/30 text-foreground hover:bg-background/40"
                onClick={() => setMicActive(!micActive)}
              >
                {micActive ? <Mic className="h-4 w-4 text-primary" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={captureFrame}
                className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
              >
                <Aperture className="h-6 w-6 text-primary-foreground" />
              </motion.button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-background/20 backdrop-blur-lg border border-border/30 text-foreground hover:bg-background/40"
                onClick={switchCamera}
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive/20 backdrop-blur-lg border border-destructive/30 text-destructive hover:bg-destructive/40"
                onClick={stopCamera}
              >
                <CameraOff className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right panel - Analysis */}
        <div className="w-80 border-l border-border/30 flex flex-col bg-card/30">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">AI Analysis</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
            {/* Current analysis */}
            <AnimatePresence mode="wait">
              {currentAnalysis && (
                <motion.div
                  key={currentAnalysis}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel p-3 glow-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary">Latest Analysis</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{currentAnalysis}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Captured frames */}
            {capturedFrames.length > 0 && (
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Captured Frames</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {capturedFrames.map((frame, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-lg overflow-hidden border border-border/30 aspect-video"
                    >
                      <img src={frame} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <span className="text-[8px] text-white/80">Frame {i + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!currentAnalysis && capturedFrames.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/60">Capture a frame to begin AI analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
