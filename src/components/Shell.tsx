import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Stepper } from "./Stepper";
import { useWizard } from "../wizard";

export function Shell({ children }: { children: ReactNode }) {
  const { reset } = useWizard();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-cato-line/70 bg-cato-black/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <a
              href="https://www.catonetworks.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cato-mist-2 hover:text-cato-mist"
            >
              catonetworks.com
            </a>
            <button
              type="button"
              onClick={reset}
              className="btn-ghost text-xs"
            >
              Start over
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card p-3">
              <Stepper />
            </div>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-cato-mist-2/70">
              This wizard generates a turnkey integration kit for Cato API
              Guard. Output includes copy-paste code, a runbook, a visual
              architecture diagram, and an optional live test against your
              guard.
            </p>
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </main>
      <footer className="border-t border-cato-line/60 mt-8">
        <div className="mx-auto max-w-7xl px-6 py-4 text-[11px] text-cato-mist-2/60 flex justify-between">
          <span>
            Cato Networks API Guard — Sales Engineering Integration Wizard
          </span>
          <span>
            Endpoint: <code className="font-mono">api.aisec.catonetworks.com</code>
          </span>
        </div>
      </footer>
    </div>
  );
}
