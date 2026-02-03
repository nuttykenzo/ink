import type { FFmpeg } from "@ffmpeg/ffmpeg";

// Type for the FFmpeg instance we use
interface FFmpegInstance {
  ffmpeg: FFmpeg;
  fetchFile: (file: string | Blob | File) => Promise<Uint8Array>;
}

// Lazy-loaded FFmpeg.wasm module
let ffmpegInstance: FFmpegInstance | null = null;
let ffmpegLoading: Promise<FFmpegInstance> | null = null;

/**
 * Lazy load FFmpeg.wasm (~31MB)
 * Only loaded when video export is actually requested
 */
async function loadFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL, fetchFile } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();

    // Load FFmpeg core from CDN
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegInstance = { ffmpeg, fetchFile: fetchFile as FFmpegInstance["fetchFile"] };
    return ffmpegInstance;
  })();

  return ffmpegLoading;
}

/**
 * Pre-warm FFmpeg.wasm by starting the load early
 * Call this when the portrait is first displayed
 */
export function prewarmFFmpeg(): void {
  // Start loading but don't await - fire and forget
  loadFFmpeg().catch(() => {
    // Silently ignore errors during prewarm
  });
}

/**
 * Convert WebM blob to MP4 using FFmpeg.wasm
 */
export async function convertToMp4(
  webmBlob: Blob,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const { ffmpeg, fetchFile } = await loadFFmpeg();

  // Set up progress handler (clamp to valid range)
  ffmpeg.on("progress", ({ progress }) => {
    const pct = Math.max(0, Math.min(100, progress * 100));
    onProgress(pct);
  });

  // Write input file
  await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob));

  // Convert to MP4 with H.264
  await ffmpeg.exec([
    "-i",
    "input.webm",
    "-c:v",
    "libx264",
    "-preset",
    "fast", // Faster encode with minimal quality loss
    "-crf",
    "20", // Good quality, faster encode
    "-pix_fmt",
    "yuv420p", // Compatibility
    "-movflags",
    "+faststart", // Web playback optimization
    "output.mp4",
  ]);

  // Read output file
  const data = await ffmpeg.readFile("output.mp4");

  // Cleanup
  await ffmpeg.deleteFile("input.webm");
  await ffmpeg.deleteFile("output.mp4");

  // FFmpeg returns FileData (Uint8Array), copy to new buffer to ensure type compatibility
  const uint8Data = data as Uint8Array;
  const buffer = new ArrayBuffer(uint8Data.length);
  const view = new Uint8Array(buffer);
  view.set(uint8Data);

  return new Blob([view], { type: "video/mp4" });
}
