import type { ReactNode } from "react";
import { useWizard } from "../wizard";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  nextLabel?: string;
  nextDisabled?: boolean;
  onNext?: () => void;
  hideNav?: boolean;
}

export function StepFrame({
  title,
  subtitle,
  children,
  nextLabel = "Continue",
  nextDisabled,
  onNext,
  hideNav,
}: Props) {
  const { next, prev, isFirst, isLast } = useWizard();
  return (
    <div className="card p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-cato-mist">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-cato-mist-2 max-w-2xl">
            {subtitle}
          </p>
        )}
      </header>
      <div>{children}</div>
      {!hideNav && (
        <div className="mt-8 flex items-center justify-between border-t border-cato-line/60 pt-5">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="btn-ghost"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => {
              onNext?.();
              if (!isLast) next();
            }}
            disabled={nextDisabled}
            className="btn-primary"
          >
            {nextLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
