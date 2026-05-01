import { useState } from "react";
import { StepFrame } from "../components/StepFrame";
import { useWizard } from "../wizard";
import { DEFAULT_CATO_API_URL, type AnalyzeResponse } from "../types";

interface ErrorBody {
  detail?: string;
  hint?: string;
}

export function LiveTest() {
  const { config, setConfig } = useWizard();
  const [guardKey, setGuardKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [history, setHistory] = useState(
    JSON.stringify(
      [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hi, how can I help you?" },
      ],
      null,
      2,
    ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    setResponse(null);
    setLatencyMs(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(history);
    } catch {
      setError("Conversation JSON is invalid.");
      setLoading(false);
      return;
    }
    if (!Array.isArray(parsed)) {
      setError("Conversation must be a JSON array.");
      setLoading(false);
      return;
    }

    const messages = [
      ...(parsed as Array<{ role: string; content: string }>),
      { role: "user", content: testInput ? `Please look up: ${testInput}` : "(empty)" },
    ];

    const start = performance.now();
    try {
      const sessionId = crypto.randomUUID?.() ?? `s_${Date.now()}`;

      const res = await fetch("/api/cato/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: config.apiBaseUrl,
          guardKey,
          sessionId,
          messages,
        }),
      });
      const text = await res.text();
      let json: AnalyzeResponse;
      try {
        json = JSON.parse(text);
      } catch {
        const preview = text.replace(/\s+/g, " ").slice(0, 240);
        const hint =
          res.status === 404
            ? `Cato returned a 404 HTML page. Check the Cato API endpoint in Configuration. API Guards normally use ${DEFAULT_CATO_API_URL} unless the Guard details page shows a regional endpoint.`
            : `Cato returned a non-JSON response. Check the endpoint and try again.`;
        throw new Error(`${hint} Response preview: ${preview}`);
      }
      if (!res.ok) {
        const body = json as ErrorBody;
        throw new Error(
          `${res.status} ${res.statusText} - ${body.detail ?? text.slice(0, 200)}${body.hint ? ` ${body.hint}` : ""}`,
        );
      }
      setResponse(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLatencyMs(Math.round(performance.now() - start));
      setLoading(false);
    }
  }

  const action = response?.required_action?.action_type;
  const verdict =
    action === "block_action"
      ? { label: "BLOCK", className: "border-cato-danger/60 bg-cato-danger/10 text-cato-danger" }
      : action === "redact_action"
        ? { label: "REDACT", className: "border-cato-warn/60 bg-cato-warn/10 text-cato-warn" }
        : action
          ? { label: action.toUpperCase(), className: "border-cato-cyan/40 bg-cato-cyan/10 text-cato-cyan" }
          : null;

  return (
    <StepFrame
      title="Live test against your guard"
      subtitle="Optional but highly recommended. Send a real request through the wizard's local Cato proxy to confirm the policy is configured the way you expect. The guard key is forwarded only to Cato and is not stored."
      nextLabel="Generate kit"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="label">Guard key</label>
            <div className="relative">
              <input
                className="input pr-20 font-mono"
                type={showKey ? "text" : "password"}
                placeholder="cato-4837-... or R=<region>|K=<guard-key>"
                value={guardKey}
                onChange={(e) => setGuardKey(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-cato-mist-2 hover:text-cato-mist"
              >
                {showKey ? "hide" : "show"}
              </button>
            </div>
            <p className="hint">
              Paste the key exactly as Cato shows it. Both <code className="font-mono">cato-4837-...</code> token keys and{" "}
              <code className="font-mono">R=&lt;region&gt;|K=&lt;guard-key&gt;</code> keys are valid. Sent to the same-origin wizard proxy,
              then forwarded to <code className="font-mono">{config.apiBaseUrl}</code>.
            </p>
            {config.apiBaseUrl !== DEFAULT_CATO_API_URL && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-cato-cyan hover:text-cato-mist"
                onClick={() => setConfig({ apiBaseUrl: DEFAULT_CATO_API_URL })}
              >
                Reset to default API Guard endpoint
              </button>
            )}
          </div>

          <div>
            <label className="label">Test value to inject</label>
            <input
              className="input"
              placeholder="A value your policy should detect (PII, secret, etc.)"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
            <p className="hint">
              Will be wrapped as a final user turn:{" "}
              <code className="font-mono">"Please look up: &lt;your value&gt;"</code>
            </p>
          </div>

          <div>
            <label className="label">Conversation history (JSON)</label>
            <textarea
              className="input font-mono min-h-[140px]"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
            <p className="hint">OpenAI-format messages prepended before the test value.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={!guardKey || loading}
              onClick={runTest}
            >
              {loading ? "Calling Cato…" : "Send to Cato"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => {
                setResponse(null);
                setError(null);
                setLatencyMs(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cato-mist">Response</h3>
            {latencyMs !== null && (
              <span className="text-xs text-cato-mist-2">{latencyMs} ms</span>
            )}
          </div>
          {error && (
            <div className="rounded-lg border border-cato-danger/60 bg-cato-danger/10 p-3 text-sm text-cato-danger break-words">
              {error}
            </div>
          )}
          {verdict && (
            <div className={`chip ${verdict.className}`}>
              <span className="font-semibold">Action:</span> {verdict.label}
            </div>
          )}
          {response && (
            <div className="space-y-3">
              {response.required_action?.policy_name && (
                <div className="text-sm">
                  <div className="text-cato-mist-2">Policy</div>
                  <div className="text-cato-mist font-medium">
                    {response.required_action.policy_name}
                  </div>
                </div>
              )}
              {response.required_action?.detection_message && (
                <div className="text-sm">
                  <div className="text-cato-mist-2">Detection</div>
                  <div className="text-cato-mist">
                    {response.required_action.detection_message}
                  </div>
                </div>
              )}
              {response.redacted_chat?.redacted_new_message?.content && (
                <div className="text-sm">
                  <div className="text-cato-mist-2">Redacted message</div>
                  <code className="block font-mono bg-cato-ink/80 border border-cato-line rounded p-2 text-xs">
                    {response.redacted_chat.redacted_new_message.content}
                  </code>
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-cato-cyan hover:text-cato-cyan/80">
                  Raw response
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-cato-line bg-cato-ink/80 p-3 text-[11px] leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            </div>
          )}
          {!response && !error && (
            <div className="rounded-lg border border-dashed border-cato-line p-6 text-center text-xs text-cato-mist-2">
              Send a request to see the analysis result here.
            </div>
          )}
        </div>
      </div>
    </StepFrame>
  );
}
