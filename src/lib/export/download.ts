/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Cleanup after a short delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate a filename for export
 */
export function generateFilename(
  format: "png" | "gif" | "mp4" | "webm",
  agentId?: string
): string {
  const timestamp = Date.now();
  const id = agentId ? `-${agentId.slice(0, 8)}` : "";
  return `ink-portrait${id}-${timestamp}.${format}`;
}
