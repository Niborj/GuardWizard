import { StepFrame } from "../components/StepFrame";
import { Choice } from "../components/Choice";
import { useWizard } from "../wizard";
import type { Language, Provider } from "../types";

const LANGUAGES: { value: Language; label: string; description?: string; badge?: string }[] = [
  { value: "python", label: "Python", description: "FastAPI / Flask / Django / scripts", badge: "Recommended" },
  { value: "node", label: "Node.js", description: "Express / Fastify / serverless" },
  { value: "typescript", label: "TypeScript", description: "Same code paths as Node - typed" },
  { value: "java", label: "Java", description: "Spring Boot / Quarkus" },
  { value: "csharp", label: "C# / .NET", description: "ASP.NET / minimal APIs" },
  { value: "go", label: "Go", description: "net/http / Gin / Echo" },
  { value: "rust", label: "Rust", description: "Axum / Actix Web / async services" },
  { value: "ruby", label: "Ruby", description: "Rails / Sinatra / background jobs" },
  { value: "php", label: "PHP", description: "Laravel / Symfony / WordPress plugins" },
];

const PROVIDERS: { value: Provider; label: string; description?: string }[] = [
  { value: "openai", label: "OpenAI", description: "GPT-4o / GPT-4 / GPT-3.5 via openai SDK" },
  { value: "anthropic", label: "Anthropic", description: "Claude via @anthropic-ai/sdk or anthropic" },
  { value: "azure-openai", label: "Azure OpenAI", description: "OpenAI models hosted on Azure" },
  { value: "bedrock", label: "AWS Bedrock", description: "Claude / Llama / Titan via Bedrock" },
  { value: "gemini", label: "Google Gemini", description: "Vertex AI / Generative AI SDK" },
  { value: "mistral", label: "Mistral AI", description: "Mistral hosted models and compatible SDKs" },
  { value: "cohere", label: "Cohere", description: "Command models via Cohere SDKs" },
  { value: "ollama", label: "Ollama / local", description: "Local or OpenAI-compatible self-hosted models" },
  { value: "other", label: "Other / generic", description: "Custom or unsupported provider" },
];

export function Stack() {
  const { config, setConfig } = useWizard();
  return (
    <StepFrame
      title="What's the customer's stack?"
      subtitle="Pick the language and LLM provider used by the application that will sit behind the API Guard."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-cato-mist mb-3">Language</h2>
          <Choice
            columns={3}
            value={config.language}
            onChange={(v) => setConfig({ language: v })}
            options={LANGUAGES}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-cato-mist mb-3">LLM provider</h2>
          <Choice
            columns={3}
            value={config.provider}
            onChange={(v) => setConfig({ provider: v })}
            options={PROVIDERS}
          />
        </div>
      </div>
    </StepFrame>
  );
}
