import type { CanvasCapture, ExportResult } from "../types";

/**
 * Export the portrait as a high-resolution PNG
 */
export async function exportPng(
  capture: CanvasCapture,
  resolution: number = 2048,
  onProgress?: (progress: number) => void
): Promise<ExportResult> {
  onProgress?.(10);

  // Store original size
  const original = capture.getSize();

  try {
    // Resize to export resolution (square aspect ratio for PNG)
    capture.setSize(resolution, resolution);
    onProgress?.(30);

    // Render a single frame at current time
    capture.render();
    onProgress?.(60);

    // Capture canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      capture.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create PNG blob"));
          }
        },
        "image/png",
        1.0
      );
    });

    onProgress?.(90);

    return {
      success: true,
      blob,
      filename: `ink-portrait-${Date.now()}.png`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "PNG export failed",
    };
  } finally {
    // Restore original size
    capture.setSize(original.width, original.height);
    onProgress?.(100);
  }
}
