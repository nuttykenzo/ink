import type { CanvasCapture, ExportConfig, ExportProgress, ExportResult } from "../types";
import { detectCapabilities, getRecommendedVideoCodec } from "../capabilities";
import { recordWithMediaRecorder } from "./mediaRecorder";
import { convertToMp4 } from "./ffmpegEncoder";

/**
 * Export the portrait as an MP4 video
 */
export async function exportVideo(
  capture: CanvasCapture,
  config: ExportConfig,
  onProgress: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const caps = detectCapabilities();
  const codec = getRecommendedVideoCodec(caps);

  if (!codec) {
    return {
      success: false,
      error: "No supported video codec found in this browser",
    };
  }

  const duration = config.videoDuration ?? 5;
  const fps = config.videoFps ?? 30;

  // Use original canvas size (no resize needed)
  const original = capture.getSize();
  const width = config.videoWidth ?? original.width;
  const height = config.videoHeight ?? original.height;

  try {
    onProgress({ phase: "preparing", progress: 0, message: "Preparing..." });

    // Only resize if different from original
    if (width !== original.width || height !== original.height) {
      capture.setSize(width, height);
    }

    // Phase 1: Capture with MediaRecorder
    onProgress({ phase: "capturing", progress: 0, message: "Recording frames..." });

    const webmBlob = await recordWithMediaRecorder(
      capture,
      duration,
      fps,
      codec,
      (frameProgress) => {
        onProgress({
          phase: "capturing",
          progress: frameProgress,
          message: `Recording... ${Math.round(frameProgress)}%`,
        });
      }
    );

    // Phase 2: Convert WebM to MP4 for broader compatibility
    onProgress({ phase: "encoding", progress: 0, message: "Converting to MP4..." });

    const mp4Blob = await convertToMp4(webmBlob, (encodeProgress) => {
      onProgress({
        phase: "encoding",
        progress: encodeProgress,
        message: `Encoding... ${Math.round(encodeProgress)}%`,
      });
    });

    onProgress({ phase: "finalizing", progress: 100, message: "Complete!" });

    return {
      success: true,
      blob: mp4Blob,
      filename: `ink-portrait-${Date.now()}.mp4`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video export failed",
    };
  } finally {
    // Restore original size
    capture.setSize(original.width, original.height);
  }
}
