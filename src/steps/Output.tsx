import { useMemo, useState } from "react";
import JSZip from "jszip";
import { StepFrame } from "../components/StepFrame";
import { useWizard } from "../wizard";
import { generateKit, type GeneratedFile } from "../generators";

export function Output() {
  const { config } = useWizard();
  const kit = useMemo(() => generateKit(config), [config]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const activeIdx = useMemo(() => {
    const desiredPath = activePath ?? "ARCHITECTURE.svg";
    const idx = kit.files.findIndex((f) => f.path === desiredPath);
    return idx >= 0 ? idx : 0;
  }, [activePath, kit.files]);
  const file = kit.files[activeIdx];

  async function copy(content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function downloadZip() {
    const zip = new JSZip();
    const folder = zip.folder("cato-api-guard-kit") ?? zip;
    for (const f of kit.files) folder.file(f.path, f.content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cato-api-guard-kit${
      config.customerName ? `-${slug(config.customerName)}` : ""
    }.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadFile(fileToDownload: GeneratedFile) {
    const blob = new Blob([fileToDownload.content], {
      type: fileToDownload.language === "svg"
        ? "image/svg+xml;charset=utf-8"
        : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(fileToDownload.path);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <StepFrame
      title="Your integration kit"
      subtitle="Hand the runbook and downloadable architecture diagram to the customer alongside the code. The runbook is non-developer friendly - the code is for whoever is wiring it into the application."
      hideNav
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={downloadZip}>
          ↓ Download .zip kit
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => copy(file.content)}
        >
          {copied ? "Copied ✓" : `Copy ${file.path}`}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => downloadFile(file)}
        >
          Download {file.path}
        </button>
        <span className="text-xs text-cato-mist-2 ml-auto">
          {kit.files.length} files generated
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card p-2 self-start">
          <ul className="space-y-1">
            {kit.files.map((f, i) => (
              <li key={f.path}>
                <button
                  type="button"
                  onClick={() => setActivePath(f.path)}
                  className={[
                    "w-full text-left rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    i === activeIdx
                      ? "bg-cato-mist text-cato-black border border-cato-green shadow-sm"
                      : "text-cato-mist-2 hover:bg-cato-navy-2 hover:text-cato-mist border border-transparent",
                  ].join(" ")}
                >
                  <div className="font-mono text-xs truncate">{f.path}</div>
                  <div
                    className={[
                      "text-[10px] mt-0.5 line-clamp-2",
                      i === activeIdx ? "text-cato-black/65" : "text-cato-mist-2/70",
                    ].join(" ")}
                  >
                    {f.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <FileView file={file} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-cato-cyan/30 bg-cato-cyan/5 p-4">
          <div className="font-semibold text-cato-cyan">Next step for you</div>
          <p className="text-cato-mist-2 mt-1 leading-relaxed">
            Send the .zip and walk the customer through{" "}
            <code className="font-mono">RUNBOOK.md</code> and{" "}
            <code className="font-mono">ARCHITECTURE.svg</code>. The visual
            diagram shows each selected guard hook and where it sits in the app
            flow.
          </p>
        </div>
        <div className="rounded-lg border border-cato-orange/30 bg-cato-orange/5 p-4">
          <div className="font-semibold text-cato-orange">Reminder</div>
          <p className="text-cato-mist-2 mt-1 leading-relaxed">
            Generated code is a template. A developer should review for fit
            with the customer's existing logging, error-handling, and
            telemetry conventions before merging.
          </p>
        </div>
      </div>
    </StepFrame>
  );
}

function FileView({ file }: { file: GeneratedFile }) {
  const isSvg = file.language === "svg" || file.path.toLowerCase().endsWith(".svg");
  const svgPreviewSrc = useMemo(() => {
    if (!isSvg) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`;
  }, [file.content, isSvg]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-cato-line px-4 py-2.5">
        <div>
          <div className="font-mono text-sm text-cato-mist">{file.path}</div>
          <div className="text-[11px] text-cato-mist-2 mt-0.5">
            {file.description}
          </div>
        </div>
        <span className="chip border-cato-line text-cato-mist-2 bg-cato-navy-2">
          {file.language}
        </span>
      </div>
      {isSvg ? (
        <div className="p-4">
          <div className="overflow-auto rounded-md border border-cato-line bg-white p-3">
            <img
              src={svgPreviewSrc}
              alt="Generated Cato API Guard architecture diagram"
              className="block h-auto w-full"
            />
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-cato-green hover:text-cato-mist">
              Show SVG source
            </summary>
            <pre className="mt-2 overflow-auto rounded-md border border-cato-line bg-cato-ink/80 p-4 max-h-[36vh] text-[12px] leading-[1.55] font-mono text-cato-mist">
              <code>{file.content}</code>
            </pre>
          </details>
        </div>
      ) : (
        <pre className="overflow-auto p-4 max-h-[60vh] text-[12px] leading-[1.55] font-mono text-cato-mist">
          <code>{file.content}</code>
        </pre>
      )}
    </div>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileName(path: string) {
  return path.split(/[\\/]/).pop() || path;
}
