import type { CanvasCapture, ExportConfig, ExportProgress, ExportResult } from "../types";
import type GIFType from "gif.js";

// Lazy-load gif.js
type GIFConstructor = typeof GIFType;
let GIF: GIFConstructor | null = null;

async function loadGifJs(): Promise<GIFConstructor> {
  if (GIF) return GIF;
  // gif.js exports default as the constructor
  const module = await import("gif.js");
  GIF = module.default as unknown as GIFConstructor;
  return GIF;
}

/**
 * Export the portrait as an animated GIF
 */
export async function exportGif(
  capture: CanvasCapture,
  config: ExportConfig,
  onProgress: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const GIFConstructor = await loadGifJs();

  const duration = config.gifDuration ?? 4;
  const fps = config.gifFps ?? 15;
  const size = config.gifSize ?? 720;

  const totalFrames = Math.floor(duration * fps);
  const frameDelay = 1000 / fps;

  // Store original size
  const original = capture.getSize();

  try {
    onProgress({ phase: "preparing", progress: 0, message: "Initializing..." });

    // Resize canvas to export size
    capture.setSize(size, size);

    const gif = new GIFConstructor({
      workers: Math.min(navigator.hardwareConcurrency || 2, 4),
      quality: 10, // Lower is better quality (1-30)
      width: size,
      height: size,
      workerScript: "/gif.worker.js",
    });

    onProgress({ phase: "capturing", progress: 0, message: "Capturing frames..." });

    // Capture frames
    for (let frame = 0; frame < totalFrames; frame++) {
      // Set time for this frame (normalized to loop duration)
      const time = (frame / totalFrames) * duration;
      capture.setTime(time);
      capture.render();

      // Add frame (copy: true is essential for async rendering)
      gif.addFrame(capture.canvas, { delay: frameDelay, copy: true });

      const progress = Math.round((frame / totalFrames) * 100);
      onProgress({
        phase: "capturing",
        progress,
        message: `Capturing frame ${frame + 1}/${totalFrames}`,
      });
    }

    // Encode GIF
    onProgress({ phase: "encoding", progress: 0, message: "Encoding GIF..." });

    return new Promise<ExportResult>((resolve) => {
      gif.on("progress", (p: number) => {
        onProgress({
          phase: "encoding",
          progress: Math.round(p * 100),
          message: `Encoding... ${Math.round(p * 100)}%`,
        });
      });

      gif.on("finished", (blob: Blob) => {
        onProgress({ phase: "finalizing", progress: 100, message: "Done!" });
        resolve({
          success: true,
          blob,
          filename: `ink-portrait-${Date.now()}.gif`,
        });
      });

      gif.render();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "GIF export failed",
    };
  } finally {
    // Restore original size
    capture.setSize(original.width, original.height);
  }
}
