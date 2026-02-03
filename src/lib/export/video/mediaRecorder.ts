import type { CanvasCapture } from "../types";

/**
 * Record canvas frames using MediaRecorder
 * Uses real-time capture - the recording takes as long as the duration
 */
export async function recordWithMediaRecorder(
  capture: CanvasCapture,
  duration: number,
  fps: number,
  mimeType: string,
  onProgress: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create stream from canvas at target fps
    const stream = capture.canvas.captureStream(fps);
    const chunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000, // 8 Mbps - good quality, reasonable size
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.onerror = (e) => {
      reject(new Error(`MediaRecorder error: ${e}`));
    };

    // Start recording
    recorder.start(100); // Request data every 100ms for smoother progress

    // Track progress in real-time
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const updateProgress = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min((elapsed / durationMs) * 100, 100);
      onProgress(progress);

      if (elapsed < durationMs) {
        requestAnimationFrame(updateProgress);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(updateProgress);
  });
}
