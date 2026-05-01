import { StepFrame } from "../components/StepFrame";

export function Welcome() {
  return (
    <StepFrame
      title="Generate a turnkey API Guard integration"
      subtitle="Answer a few questions about your customer's AI application and this wizard will produce copy-paste integration code, a plain-English runbook, and an optional live test against the Cato API Guard."
      nextLabel="Get started"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          step="1"
          title="Describe the stack"
          body="Language, LLM provider, and architecture - direct SDK call or an agent framework like LangChain or LangGraph."
        />
        <Card
          step="2"
          title="Pick inspection points"
          body="System message, user input, assistant output, tool-call arguments, and tool results. Multi-stage by default."
        />
        <Card
          step="3"
          title="Get a kit"
          body="Drop-in code for the customer's stack, a runbook a non-developer can follow, and a working test against your guard."
        />
      </div>
      <div className="mt-6 rounded-lg border border-cato-cyan/30 bg-cato-cyan/5 p-4 text-sm text-cato-mist-2">
        <span className="font-semibold text-cato-cyan">Note:</span> the
        generated code is a template. Always have a developer review and test
        before deploying to production.
      </div>
    </StepFrame>
  );
}

function Card({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-cato-line bg-cato-navy/40 p-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cato-orange/10 text-cato-orange text-xs font-bold">
        {step}
      </div>
      <h3 className="mt-3 font-semibold text-cato-mist">{title}</h3>
      <p className="mt-1 text-sm text-cato-mist-2 leading-relaxed">{body}</p>
    </div>
  );
}
