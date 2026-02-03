"use client";

import { useCallback, useState, useRef } from "react";
import { useInkStore } from "@/lib/store";
import type {
  ExportFormat,
  ExportProgress,
  ExportResult,
  CanvasCapture,
} from "../types";
import {
  detectCapabilities,
  canExport,
  getExportError,
  type BrowserCapabilities,
} from "../capabilities";
import { downloadBlob } from "../download";
import { exportPng } from "../png/pngExporter";
import { exportGif } from "../gif/gifExporter";
import { exportVideo } from "../video/videoExporter";

export function useExport() {
  const [progress, setProgress] = useState<ExportProgress>({
    phase: "idle",
    progress: 0,
    message: "",
  });

  const captureRef = useRef<CanvasCapture | null>(null);
  const capabilitiesRef = useRef<BrowserCapabilities | null>(null);

  // Lazy detect capabilities (only in browser)
  const getCapabilities = useCallback((): BrowserCapabilities => {
    if (!capabilitiesRef.current) {
      capabilitiesRef.current = detectCapabilities();
    }
    return capabilitiesRef.current;
  }, []);

  // Register the canvas capture interface
  const registerCapture = useCallback((capture: CanvasCapture) => {
    captureRef.current = capture;
  }, []);

  // Start export
  const startExport = useCallback(
    async (format: ExportFormat): Promise<ExportResult> => {
      if (!captureRef.current) {
        return { success: false, error: "Canvas not ready" };
      }

      const capabilities = getCapabilities();

      if (!canExport(format, capabilities)) {
        const error = getExportError(format, capabilities);
        return { success: false, error: error || "Export not supported" };
      }

      const { setExporting, agentData } = useInkStore.getState();

      setExporting(true);
      setProgress({ phase: "preparing", progress: 0, message: "Preparing..." });

      try {
        let result: ExportResult;

        const visualParams = useInkStore.getState().visualParams;

        switch (format) {
          case "png":
            result = await exportPng(captureRef.current, 2048, (p) => {
              setProgress({
                phase: "capturing",
                progress: p,
                message: `Capturing... ${Math.round(p)}%`,
              });
            });
            break;

          case "gif":
            // Calculate GIF duration based on complexity (3-6 seconds)
            const gifDuration = visualParams
              ? 3 + (visualParams.complexity / 10) * 3
              : 4;
            result = await exportGif(
              captureRef.current,
              { format: "gif", gifDuration, gifFps: 15, gifSize: 720 },
              setProgress
            );
            break;

          case "video":
            // Calculate video duration based on complexity (15-30 seconds)
            const videoDuration = visualParams
              ? 15 + (visualParams.complexity / 10) * 15
              : 20;
            result = await exportVideo(
              captureRef.current,
              {
                format: "video",
                videoDuration,
                videoFps: 30,
                videoWidth: 1080,
                videoHeight: 1920,
              },
              setProgress
            );
            break;
        }

        if (result.success && result.blob && result.filename) {
          downloadBlob(result.blob, result.filename);
          setProgress({
            phase: "complete",
            progress: 100,
            message: "Downloaded!",
          });
        } else if (!result.success) {
          setProgress({
            phase: "error",
            progress: 0,
            message: result.error || "Export failed",
          });
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed";
        setProgress({ phase: "error", progress: 0, message });
        return { success: false, error: message };
      } finally {
        setExporting(false);

        // Reset to idle after a delay
        setTimeout(() => {
          setProgress({ phase: "idle", progress: 0, message: "" });
        }, 2000);
      }
    },
    [getCapabilities]
  );

  // Check if a format is supported
  const isFormatSupported = useCallback(
    (format: ExportFormat): boolean => {
      return canExport(format, getCapabilities());
    },
    [getCapabilities]
  );

  return {
    progress,
    startExport,
    registerCapture,
    isFormatSupported,
  };
}
