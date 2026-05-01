import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CONFIG, STEPS, type StepId, type WizardConfig } from "./types";
import { WizardContext, type WizardState } from "./wizard";

export function WizardProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<WizardConfig>(DEFAULT_CONFIG);
  const [stepIndex, setStepIndex] = useState(0);

  const setConfig = useCallback((patch: Partial<WizardConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
  }, []);

  const goToStep = useCallback((id: StepId) => {
    const idx = STEPS.findIndex((s) => s.id === id);
    if (idx >= 0) setStepIndex(idx);
  }, []);

  const next = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)),
    [],
  );
  const prev = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);

  const reset = useCallback(() => {
    setConfigState(DEFAULT_CONFIG);
    setStepIndex(0);
  }, []);

  const value = useMemo<WizardState>(
    () => ({
      config,
      setConfig,
      stepIndex,
      stepId: STEPS[stepIndex].id,
      goToStep,
      next,
      prev,
      isFirst: stepIndex === 0,
      isLast: stepIndex === STEPS.length - 1,
      reset,
    }),
    [config, setConfig, stepIndex, goToStep, next, prev, reset],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
