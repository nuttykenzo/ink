import type { CanvasCapture } from "../types";

/**
 * Record canvas frames using MediaRecorder
 */
export async function recordWithMediaRecorder(
  capture: CanvasCapture,
  duration: number,
  fps: number,
  mimeType: string,
  onProgress: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create stream from canvas
    const stream = capture.canvas.captureStream(fps);
    const chunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 15_000_000, // 15 Mbps for high quality
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
    recorder.start();

    // Animate for duration with frame-accurate timing
    const totalFrames = Math.floor(duration * fps);
    let frame = 0;
    const frameInterval = 1000 / fps;
    const startTime = performance.now();

    const animate = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Render frame
      const time = (frame / totalFrames) * duration;
      capture.setTime(time);
      capture.render();

      frame++;
      onProgress((frame / totalFrames) * 100);

      // Schedule next frame with accurate timing
      const elapsed = performance.now() - startTime;
      const nextFrameTime = frame * frameInterval;
      const delay = Math.max(0, nextFrameTime - elapsed);

      setTimeout(animate, delay);
    };

    animate();
  });
}
