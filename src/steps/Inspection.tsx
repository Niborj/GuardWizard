import { StepFrame } from "../components/StepFrame";
import { CheckList } from "../components/Choice";
import { useWizard } from "../wizard";
import type { InspectionPoint } from "../types";

const POINTS: { value: InspectionPoint; label: string; description: string }[] = [
  {
    value: "system_message",
    label: "System message",
    description: "Inspect the system prompt at conversation start. Catches prompt-injection embedded in the system prompt itself.",
  },
  {
    value: "user_input",
    label: "User input",
    description: "Every user turn is sent to the guard before forwarding to the model. Primary line of defense for PII and prompt injection.",
  },
  {
    value: "assistant_output",
    label: "Assistant output",
    description: "Inspect each model response before showing it to the user. Catches hallucinated PII, jailbroken outputs, and unsafe content.",
  },
  {
    value: "tool_call_args",
    label: "Tool call arguments",
    description: "Inspect tool / function call args before the tool executes. Critical for agents - blocks data exfil to external tools.",
  },
  {
    value: "tool_result",
    label: "Tool result",
    description: "Inspect tool return values before they re-enter the model context. Catches sensitive data pulled from internal systems.",
  },
];

export function Inspection() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="Which messages should the guard inspect?"
      subtitle="The recommended baseline is user input + assistant output. For agentic apps, also enable tool call args and tool results."
      nextDisabled={config.inspectionPoints.length === 0}
    >
      <CheckList
        values={config.inspectionPoints}
        onChange={(v) => setConfig({ inspectionPoints: v })}
        options={POINTS}
      />
      {config.inspectionPoints.length === 0 && (
        <p className="mt-4 text-xs text-cato-warn">
          Pick at least one inspection point to continue.
        </p>
      )}
    </StepFrame>
  );
}
