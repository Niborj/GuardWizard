import { StepFrame } from "../components/StepFrame";
import { Choice } from "../components/Choice";
import { useWizard } from "../wizard";
import type { ActionMode, FailureMode } from "../types";

const ACTIONS: { value: ActionMode; label: string; description: string }[] = [
  { value: "policy_driven", label: "Policy-driven", description: "Honor the action_type returned by Cato per policy: block, redact, or pass-through." },
  { value: "block", label: "Block", description: "Return an error to the user and never forward the message to the model." },
  { value: "redact", label: "Redact and forward", description: "Replace detected entities with placeholders (e.g. [SSN_1]) and continue." },
  { value: "log_only", label: "Log only", description: "Detect and emit telemetry but never alter or block traffic. Good for shadow rollout." },
];

const FAILURES: { value: FailureMode; label: string; description: string }[] = [
  { value: "fail_open", label: "Fail-open (recommended for availability)", description: "If Cato is unreachable or errors, forward the original message. Logs the failure." },
  { value: "fail_closed", label: "Fail-closed (recommended for high-risk)", description: "If Cato is unreachable, block the request. Highest safety, will impact uptime." },
];

export function ActionStep() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="What happens on a detection?"
      subtitle="Pick how the integration reacts when the guard finds something, and how it behaves if the guard itself is unavailable."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-cato-mist mb-3">On detection</h2>
          <Choice
            columns={2}
            value={config.actionMode}
            onChange={(v) => setConfig({ actionMode: v })}
            options={ACTIONS}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-cato-mist mb-3">If the guard itself fails</h2>
          <Choice
            columns={2}
            value={config.failureMode}
            onChange={(v) => setConfig({ failureMode: v })}
            options={FAILURES}
          />
        </div>
      </div>
    </StepFrame>
  );
}
