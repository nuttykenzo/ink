import { create } from "zustand";
import type { AgentData } from "./data/schema";
import { parseAgentData } from "./data/parser";
import { dataToVisualParams, type VisualParams } from "./generation/params";

export type ExportFormat = "video" | "gif" | "png";

interface InkState {
  // Input state
  rawInput: string;
  agentData: AgentData | null;
  parseError: string | null;

  // Visual state
  visualParams: VisualParams | null;

  // Export state
  exporting: boolean;
  exportProgress: number;
  exportFormat: ExportFormat;

  // Actions
  setRawInput: (input: string) => void;
  parseInput: () => boolean;
  clearData: () => void;
  setExportFormat: (format: ExportFormat) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
}

export const useInkStore = create<InkState>((set, get) => ({
  // Initial state
  rawInput: "",
  agentData: null,
  parseError: null,
  visualParams: null,
  exporting: false,
  exportProgress: 0,
  exportFormat: "video",

  // Set raw input text
  setRawInput: (input) => {
    set({ rawInput: input, parseError: null });
  },

  // Parse input and generate visual params
  parseInput: () => {
    const { rawInput } = get();
    const result = parseAgentData(rawInput);

    if (result.ok) {
      const params = dataToVisualParams(result.value);
      set({
        agentData: result.value,
        parseError: null,
        visualParams: params,
      });
      return true;
    } else {
      set({
        agentData: null,
        parseError: result.error.message,
        visualParams: null,
      });
      return false;
    }
  },

  // Clear all data
  clearData: () => {
    set({
      rawInput: "",
      agentData: null,
      parseError: null,
      visualParams: null,
    });
  },

  // Export controls
  setExportFormat: (format) => set({ exportFormat: format }),
  setExporting: (exporting) => set({ exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
}));
