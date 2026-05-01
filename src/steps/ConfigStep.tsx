import { StepFrame } from "../components/StepFrame";
import { Choice } from "../components/Choice";
import { useWizard } from "../wizard";

const SESSION_OPTIONS = [
  { value: "per_conversation" as const, label: "Per conversation", description: "Same x-cato-session-id for all turns of one chat. Recommended." },
  { value: "per_user" as const, label: "Per user", description: "All conversations from one user share a session id." },
  { value: "per_request" as const, label: "Per request", description: "Fresh session id every call. No grouping in Cato analytics." },
];

export function ConfigStep() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="Final integration knobs"
      subtitle="Defaults are sensible for most customers. Adjust only if you know the customer's environment requires it."
    >
      <div className="grid gap-6 max-w-2xl">
        <div>
          <label className="label">Environment variable for the guard key</label>
          <input
            className="input font-mono text-sm"
            value={config.guardKeyEnvVar}
            onChange={(e) => setConfig({ guardKeyEnvVar: e.target.value })}
          />
          <p className="hint">
            The generated code reads the guard key from this environment variable
            via <code className="font-mono">os.environ</code> /{" "}
            <code className="font-mono">process.env</code>. Never commit the key.
          </p>
        </div>
        <div>
          <label className="label">Cato API endpoint</label>
          <input
            className="input font-mono text-sm"
            value={config.apiBaseUrl}
            onChange={(e) => setConfig({ apiBaseUrl: e.target.value })}
          />
          <p className="hint">
            Use the endpoint shown on the Guard details page. Override the default only for non-production or regional endpoints.
          </p>
        </div>
        <div>
          <label className="label mb-3">Session ID strategy</label>
          <Choice
            columns={1}
            value={config.sessionIdStrategy}
            onChange={(v) => setConfig({ sessionIdStrategy: v })}
            options={SESSION_OPTIONS}
          />
        </div>
      </div>
    </StepFrame>
  );
}
