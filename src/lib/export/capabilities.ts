import type { ExportFormat } from "./types";

export interface BrowserCapabilities {
  webgl2: boolean;
  mediaRecorder: boolean;
  webmVp9: boolean;
  webmH264: boolean;
  mp4H264: boolean;
  webWorkers: boolean;
  offscreenCanvas: boolean;
}

let cachedCapabilities: BrowserCapabilities | null = null;

export function detectCapabilities(): BrowserCapabilities {
  if (cachedCapabilities) return cachedCapabilities;

  // Check WebGL2
  const canvas = document.createElement("canvas");
  const webgl2 = !!canvas.getContext("webgl2");

  // Check MediaRecorder
  const hasMediaRecorder = typeof MediaRecorder !== "undefined";

  // Check codec support
  const webmVp9 =
    hasMediaRecorder &&
    MediaRecorder.isTypeSupported("video/webm;codecs=vp9");
  const webmH264 =
    hasMediaRecorder &&
    MediaRecorder.isTypeSupported("video/webm;codecs=h264");
  const mp4H264 =
    hasMediaRecorder &&
    MediaRecorder.isTypeSupported("video/mp4;codecs=avc1");

  // Check Web Workers
  const webWorkers = typeof Worker !== "undefined";

  // Check OffscreenCanvas
  const offscreenCanvas = typeof OffscreenCanvas !== "undefined";

  cachedCapabilities = {
    webgl2,
    mediaRecorder: hasMediaRecorder,
    webmVp9,
    webmH264,
    mp4H264,
    webWorkers,
    offscreenCanvas,
  };

  return cachedCapabilities;
}

export function getRecommendedVideoCodec(
  caps: BrowserCapabilities
): string | null {
  if (caps.webmVp9) return "video/webm;codecs=vp9";
  if (caps.webmH264) return "video/webm;codecs=h264";
  if (caps.mp4H264) return "video/mp4;codecs=avc1";
  return null;
}

export function canExport(
  format: ExportFormat,
  caps: BrowserCapabilities
): boolean {
  switch (format) {
    case "png":
      return caps.webgl2;
    case "video":
      return caps.webgl2 && caps.mediaRecorder;
    case "gif":
      return caps.webgl2 && caps.webWorkers;
  }
}

export function getExportError(
  format: ExportFormat,
  caps: BrowserCapabilities
): string | null {
  if (!caps.webgl2) {
    return "WebGL 2 is not supported in this browser";
  }

  switch (format) {
    case "video":
      if (!caps.mediaRecorder) {
        return "Video recording is not supported in this browser";
      }
      break;
    case "gif":
      if (!caps.webWorkers) {
        return "Web Workers are not supported in this browser";
      }
      break;
  }

  return null;
}
