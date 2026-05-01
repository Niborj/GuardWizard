import { STEPS } from "../types";
import { useWizard } from "../wizard";

export function Stepper() {
  const { stepIndex, goToStep } = useWizard();

  return (
    <nav className="flex flex-col gap-1">
      {STEPS.map((s, i) => {
        const state =
          i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => i <= stepIndex && goToStep(s.id)}
            disabled={i > stepIndex}
            className={[
              "group flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
              state === "active" && "bg-cato-mist text-cato-black shadow-sm",
              state === "done" &&
                "text-cato-mist hover:bg-cato-green/20 cursor-pointer",
              state === "pending" && "text-cato-mist-2/50 cursor-not-allowed",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                state === "active" &&
                  "border-cato-green bg-cato-green text-white",
                state === "done" &&
                  "border-cato-mist bg-cato-mist text-cato-green",
                state === "pending" && "border-cato-line text-cato-mist-2/60",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className="font-medium">{s.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
