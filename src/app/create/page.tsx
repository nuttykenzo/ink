"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Copy, Check, ArrowRight, AlertCircle, Download, Loader2 } from "lucide-react";
import { useInkStore } from "@/lib/store";
import { useExport } from "@/lib/export";

// Dynamic import for R3F (requires client-side only)
const Portrait = dynamic(() => import("@/components/Portrait"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--color-ink-accent-cyan)] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const ANALYSIS_PROMPT = `I want to create a visual portrait of your identity. Please analyze yourself by:

1. Reading your memory files (MEMORY.md, daily logs in memory/)
2. Counting your session files in ~/.openclaw/agents/<your-id>/sessions/
3. Examining your typical response patterns
4. Assessing your personality based on your behavior

Output a JSON object with exactly this structure:

{
  "agent_id": "<your unique identifier>",
  "created_at": "<ISO timestamp of your first session>",
  "sessions_count": <total number of sessions>,
  "memory_entries": <count of distinct memories in MEMORY.md>,
  "primary_topics": ["<top 3-5 topics from your memory>"],
  "tools_usage": {
    "<tool_name>": <usage_count>,
    ...
  },
  "metrics": {
    "avg_response_length": <1-10 scale, 10=very verbose>,
    "response_speed": <1-10 scale, 10=very fast>,
    "assertiveness": <1-10 scale, 10=very assertive>,
    "creativity": <1-10 scale, 10=highly creative>,
    "precision": <1-10 scale, 10=very precise/structured>
  },
  "self_assessed_traits": ["<3-5 personality traits you identify in yourself>"],
  "signature_phrase": "<a phrase or pattern you often use>"
}

Run the necessary shell commands to gather accurate data. Be honest in your self-assessment.`;

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  const { rawInput, setRawInput, parseInput, parseError, visualParams, exporting } =
    useInkStore();

  const { progress, startExport, registerCapture, isFormatSupported } = useExport();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ANALYSIS_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParse = () => {
    const success = parseInput();
    if (success) {
      setStep(3);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center border-b border-[var(--color-ink-border)]">
        <Link
          href="/"
          className="font-mono text-xl font-bold tracking-tight"
        >
          <span className="text-[var(--color-ink-accent-cyan)]">ink</span>
        </Link>
      </nav>

      <div className="flex-1 flex">
        {/* Left panel - Steps */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 overflow-auto">
          {/* Step indicators */}
          <div className="flex gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 ${
                  s === step
                    ? "text-[var(--color-ink-text-primary)]"
                    : s < step
                    ? "text-[var(--color-ink-accent-cyan)]"
                    : "text-[var(--color-ink-text-muted)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                    s === step
                      ? "bg-[var(--color-ink-accent-cyan)] text-[var(--color-ink-bg-deep)]"
                      : s < step
                      ? "border border-[var(--color-ink-accent-cyan)]"
                      : "border border-[var(--color-ink-border)]"
                  }`}
                >
                  {s}
                </div>
                <span className="hidden sm:inline text-sm">
                  {s === 1 && "Copy prompt"}
                  {s === 2 && "Paste output"}
                  {s === 3 && "Export"}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Copy prompt */}
          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl font-semibold mb-4">
                Copy this prompt to your agent
              </h1>
              <p className="text-[var(--color-ink-text-secondary)] mb-6">
                Paste this into your OpenClaw agent. It will analyze itself and
                output the data we need to generate your portrait.
              </p>

              <div className="relative">
                <pre className="p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl text-sm font-mono text-[var(--color-ink-text-secondary)] overflow-auto max-h-96">
                  {ANALYSIS_PROMPT}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 bg-[var(--color-ink-bg-subtle)] rounded-lg hover:bg-[var(--color-ink-border)] transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[var(--color-ink-success)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-6 px-6 py-3 bg-[var(--color-ink-accent-cyan)] text-[var(--color-ink-bg-deep)] font-semibold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all"
              >
                I&apos;ve copied it
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Paste output */}
          {step === 2 && (
            <div>
              <h1 className="font-display text-3xl font-semibold mb-4">
                Paste your agent&apos;s response
              </h1>
              <p className="text-[var(--color-ink-text-secondary)] mb-6">
                Copy the JSON output from your agent and paste it below.
              </p>

              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder='{"agent_id": "...", "sessions_count": ..., ...}'
                className="w-full h-64 p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl text-sm font-mono placeholder:text-[var(--color-ink-text-muted)] focus:border-[var(--color-ink-accent-cyan)] focus:outline-none resize-none"
              />

              {parseError && (
                <div className="mt-4 p-4 bg-[var(--color-ink-error)]/10 border border-[var(--color-ink-error)]/30 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-ink-error)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-ink-error)]">
                    {parseError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-[var(--color-ink-border)] text-[var(--color-ink-text-primary)] font-semibold rounded-xl hover:border-[var(--color-ink-text-muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleParse}
                  disabled={!rawInput.trim()}
                  className="px-6 py-3 bg-[var(--color-ink-accent-cyan)] text-[var(--color-ink-bg-deep)] font-semibold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate portrait
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Export */}
          {step === 3 && visualParams && (
            <div>
              <h1 className="font-display text-3xl font-semibold mb-4">
                Your agent&apos;s portrait
              </h1>
              <p className="text-[var(--color-ink-text-secondary)] mb-6">
                Export and share your unique visualization.
              </p>

              {/* Progress indicator */}
              {progress.phase !== "idle" && progress.phase !== "complete" && (
                <div className="mb-4 p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-ink-accent-cyan)]" />
                    <span className="text-sm font-medium">{progress.message}</span>
                  </div>
                  {progress.progress > 0 && (
                    <div className="w-full h-2 bg-[var(--color-ink-bg-subtle)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-ink-accent-cyan)] transition-all duration-200"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {progress.phase === "complete" && (
                <div className="mb-4 p-4 bg-[var(--color-ink-success)]/10 border border-[var(--color-ink-success)]/30 rounded-xl flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--color-ink-success)]" />
                  <span className="text-sm text-[var(--color-ink-success)]">
                    Downloaded!
                  </span>
                </div>
              )}

              {progress.phase === "error" && (
                <div className="mb-4 p-4 bg-[var(--color-ink-error)]/10 border border-[var(--color-ink-error)]/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-ink-error)]" />
                  <span className="text-sm text-[var(--color-ink-error)]">
                    {progress.message}
                  </span>
                </div>
              )}

              {/* Export options */}
              <div className="space-y-4">
                <button
                  onClick={() => startExport("video")}
                  disabled={exporting || !isFormatSupported("video")}
                  className="w-full p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl text-left hover:border-[var(--color-ink-accent-cyan)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold mb-1">Video (MP4)</div>
                    <div className="text-sm text-[var(--color-ink-text-secondary)]">
                      15-30 second seamless loop for TikTok, Reels
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-[var(--color-ink-text-muted)]" />
                </button>

                <button
                  onClick={() => startExport("gif")}
                  disabled={exporting || !isFormatSupported("gif")}
                  className="w-full p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl text-left hover:border-[var(--color-ink-accent-cyan)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold mb-1">GIF</div>
                    <div className="text-sm text-[var(--color-ink-text-secondary)]">
                      Short loop for Discord, Twitter
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-[var(--color-ink-text-muted)]" />
                </button>

                <button
                  onClick={() => startExport("png")}
                  disabled={exporting}
                  className="w-full p-4 bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] rounded-xl text-left hover:border-[var(--color-ink-accent-cyan)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold mb-1">Image (PNG)</div>
                    <div className="text-sm text-[var(--color-ink-text-secondary)]">
                      High-res static image (2048x2048)
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-[var(--color-ink-text-muted)]" />
                </button>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  useInkStore.getState().clearData();
                }}
                disabled={exporting}
                className="mt-6 text-[var(--color-ink-text-secondary)] hover:text-[var(--color-ink-text-primary)] transition-colors disabled:opacity-50"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {/* Right panel - Preview */}
        <div className="hidden lg:flex w-1/2 bg-[var(--color-ink-bg-base)] items-center justify-center border-l border-[var(--color-ink-border)]">
          {visualParams ? (
            <Portrait
              params={visualParams}
              className="w-96 h-96 rounded-2xl overflow-hidden"
              onRegisterCapture={registerCapture}
            />
          ) : (
            <div className="text-center text-[var(--color-ink-text-muted)]">
              <p>Your portrait will appear here</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
