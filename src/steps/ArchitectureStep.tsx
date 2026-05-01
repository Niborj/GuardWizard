import { StepFrame } from "../components/StepFrame";
import { Choice } from "../components/Choice";
import { useWizard } from "../wizard";
import type { Architecture } from "../types";

const OPTIONS: { value: Architecture; label: string; description?: string; badge?: string }[] = [
  { value: "direct-sdk", label: "Direct SDK", description: "App calls the LLM SDK directly. Simplest case.", badge: "Most common" },
  { value: "langchain", label: "LangChain", description: "Chains, agents, or runnables wrapping the LLM." },
  { value: "langgraph", label: "LangGraph", description: "Stateful agent graphs with tool nodes." },
  { value: "llamaindex", label: "LlamaIndex", description: "RAG-first agents and query engines." },
  { value: "semantic-kernel", label: "Semantic Kernel", description: "Microsoft's agent + plugin framework." },
  { value: "server-proxy", label: "Server proxy / gateway", description: "An OpenAI-compatible internal proxy in front of the model." },
  { value: "other", label: "Other / custom", description: "We'll generate a generic recipe." },
];

export function ArchitectureStep() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="How does the app talk to the model?"
      subtitle="This determines where guard hooks get inserted - directly around an SDK call, or as middleware inside an agent framework."
    >
      <Choice
        columns={2}
        value={config.architecture}
        onChange={(v) => setConfig({ architecture: v })}
        options={OPTIONS}
      />
    </StepFrame>
  );
}
