export type ExportFormat = "png" | "video" | "gif";

export interface ExportConfig {
  format: ExportFormat;
  // PNG
  pngResolution?: number; // Default: 2048
  // Video
  videoDuration?: number; // Default: calculated from complexity
  videoFps?: number; // Default: 30
  videoWidth?: number; // Default: 1080
  videoHeight?: number; // Default: 1920
  // GIF
  gifDuration?: number; // Default: 4
  gifFps?: number; // Default: 15
  gifSize?: number; // Default: 720
}

export type ExportPhase =
  | "idle"
  | "preparing"
  | "capturing"
  | "encoding"
  | "finalizing"
  | "complete"
  | "error";

export interface ExportProgress {
  phase: ExportPhase;
  progress: number; // 0-100
  message: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

export interface CanvasCapture {
  canvas: HTMLCanvasElement;
  getSize: () => { width: number; height: number };
  setSize: (width: number, height: number) => void;
  render: () => void;
  setTime: (time: number) => void;
  getAnimSpeed: () => number;
}
