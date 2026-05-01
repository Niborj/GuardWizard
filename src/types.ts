export type Language =
  | "python"
  | "node"
  | "typescript"
  | "java"
  | "csharp"
  | "go"
  | "rust"
  | "ruby"
  | "php";

export type Provider =
  | "openai"
  | "anthropic"
  | "azure-openai"
  | "bedrock"
  | "gemini"
  | "mistral"
  | "cohere"
  | "ollama"
  | "other";

export type Architecture =
  | "direct-sdk"
  | "langchain"
  | "langgraph"
  | "llamaindex"
  | "semantic-kernel"
  | "server-proxy"
  | "other";

export type InspectionPoint =
  | "system_message"
  | "user_input"
  | "assistant_output"
  | "tool_call_args"
  | "tool_result";

export type ActionMode = "block" | "redact" | "log_only" | "policy_driven";

export type FailureMode = "fail_open" | "fail_closed";

export interface WizardConfig {
  customerName: string;
  language: Language;
  provider: Provider;
  architecture: Architecture;
  inspectionPoints: InspectionPoint[];
  actionMode: ActionMode;
  failureMode: FailureMode;
  guardKeyEnvVar: string;
  sessionIdStrategy: "per_user" | "per_conversation" | "per_request";
  apiBaseUrl: string;
}

export const DEFAULT_CONFIG: WizardConfig = {
  customerName: "",
  language: "python",
  provider: "openai",
  architecture: "direct-sdk",
  inspectionPoints: ["user_input", "assistant_output"],
  actionMode: "policy_driven",
  failureMode: "fail_open",
  guardKeyEnvVar: "CATO_GUARD_KEY",
  sessionIdStrategy: "per_conversation",
  apiBaseUrl: "https://api.aisec.catonetworks.com/fw/v1/analyze",
};

export const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "customer", title: "Customer" },
  { id: "stack", title: "Stack" },
  { id: "architecture", title: "Architecture" },
  { id: "inspection", title: "Inspection points" },
  { id: "action", title: "Action policy" },
  { id: "config", title: "Configuration" },
  { id: "test", title: "Live test" },
  { id: "output", title: "Generated kit" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export interface AnalyzeRequestMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface AnalyzeResponse {
  analysis_result?: {
    analysis_time_ms?: number;
    policy_drill_down?: Record<string, unknown>;
    last_message_entities?: Array<{
      type: string;
      content: string;
      name?: string;
    }>;
  };
  required_action?: {
    action_type: string;
    policy_name?: string;
    detection_message?: string;
  };
  redacted_chat?: {
    all_redacted_messages?: Array<{
      content: string;
      role: string;
      entities?: unknown[];
    }>;
    redacted_new_message?: {
      content: string;
      role: string;
      entities?: unknown[];
    };
  };
}
