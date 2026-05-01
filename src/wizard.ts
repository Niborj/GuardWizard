import { createContext, useContext } from "react";
import type { StepId, WizardConfig } from "./types";

export interface WizardState {
  config: WizardConfig;
  setConfig: (patch: Partial<WizardConfig>) => void;
  stepIndex: number;
  stepId: StepId;
  goToStep: (id: StepId) => void;
  next: () => void;
  prev: () => void;
  isFirst: boolean;
  isLast: boolean;
  reset: () => void;
}

export const WizardContext = createContext<WizardState | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
