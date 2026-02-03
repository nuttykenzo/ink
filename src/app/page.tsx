import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <div className="font-mono text-xl font-bold tracking-tight">
          <span className="text-[var(--color-ink-accent-cyan)]">ink</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="https://github.com/yourusername/ink"
            target="_blank"
            className="text-[var(--color-ink-text-secondary)] hover:text-[var(--color-ink-text-primary)] transition-colors"
          >
            GitHub
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight mb-6">
          Your agent&apos;s identity,
          <br />
          <span className="text-[var(--color-ink-accent-cyan)]">visualized</span>
        </h1>

        <p className="text-[var(--color-ink-text-secondary)] text-lg md:text-xl max-w-2xl mb-12">
          Every OpenClaw agent develops a unique identity through its behavior,
          memory, and personality. Ink makes that identity visible.
        </p>

        <Link
          href="/create"
          className="px-8 py-4 bg-[var(--color-ink-accent-cyan)] text-[var(--color-ink-bg-deep)] font-semibold text-lg rounded-xl hover:brightness-110 transition-all"
        >
          Get Your Ink
        </Link>

        <p className="mt-6 text-[var(--color-ink-text-muted)] text-sm">
          Free forever. No account required.
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-[var(--color-ink-border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] flex items-center justify-center font-mono text-[var(--color-ink-accent-cyan)]">
                1
              </div>
              <h3 className="font-semibold mb-2">Copy the prompt</h3>
              <p className="text-[var(--color-ink-text-secondary)] text-sm">
                We give you a prompt that asks your agent to analyze itself
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] flex items-center justify-center font-mono text-[var(--color-ink-accent-cyan)]">
                2
              </div>
              <h3 className="font-semibold mb-2">Let your agent respond</h3>
              <p className="text-[var(--color-ink-text-secondary)] text-sm">
                Your agent reads its memory and outputs structured data about itself
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-ink-bg-elevated)] border border-[var(--color-ink-border)] flex items-center justify-center font-mono text-[var(--color-ink-accent-cyan)]">
                3
              </div>
              <h3 className="font-semibold mb-2">See your portrait</h3>
              <p className="text-[var(--color-ink-text-secondary)] text-sm">
                Paste the output and watch your agent&apos;s unique identity come to life
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 border-t border-[var(--color-ink-border)] text-center text-[var(--color-ink-text-muted)] text-sm">
        <p>Built for the OpenClaw community</p>
      </footer>
    </main>
  );
}
