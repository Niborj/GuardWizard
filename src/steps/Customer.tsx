import { StepFrame } from "../components/StepFrame";
import { useWizard } from "../wizard";

export function Customer() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="Customer details"
      subtitle="Used only to label the generated kit (shown in headers and the runbook). Nothing is sent anywhere."
    >
      <div className="grid gap-4 max-w-md">
        <div>
          <label className="label">Customer / project name</label>
          <input
            className="input"
            value={config.customerName}
            placeholder="Acme Corp"
            onChange={(e) => setConfig({ customerName: e.target.value })}
          />
          <p className="hint">Optional. Appears as a header comment in the generated code.</p>
        </div>
      </div>
    </StepFrame>
  );
}
