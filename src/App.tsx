import { Shell } from "./components/Shell";
import { WizardProvider } from "./state";
import { useWizard } from "./wizard";
import { Welcome } from "./steps/Welcome";
import { Customer } from "./steps/Customer";
import { Stack } from "./steps/Stack";
import { ArchitectureStep } from "./steps/ArchitectureStep";
import { Inspection } from "./steps/Inspection";
import { ActionStep } from "./steps/ActionStep";
import { ConfigStep } from "./steps/ConfigStep";
import { LiveTest } from "./steps/LiveTest";
import { Output } from "./steps/Output";

function CurrentStep() {
  const { stepId } = useWizard();
  switch (stepId) {
    case "welcome":
      return <Welcome />;
    case "customer":
      return <Customer />;
    case "stack":
      return <Stack />;
    case "architecture":
      return <ArchitectureStep />;
    case "inspection":
      return <Inspection />;
    case "action":
      return <ActionStep />;
    case "config":
      return <ConfigStep />;
    case "test":
      return <LiveTest />;
    case "output":
      return <Output />;
  }
}

export default function App() {
  return (
    <WizardProvider>
      <Shell>
        <CurrentStep />
      </Shell>
    </WizardProvider>
  );
}
