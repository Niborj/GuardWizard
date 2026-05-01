import type { WizardConfig } from "../types";
import type { GeneratedFile } from "./index";

export function generateGeneric(c: WizardConfig): {
  files: GeneratedFile[];
  primary: string;
} {
  const files: GeneratedFile[] = [];

  files.push({
    path: "INTEGRATION.md",
    language: "markdown",
    description:
      "Language-agnostic integration recipe. Hand this to a developer along with the auto-generated runbook.",
    content: recipe(c),
  });

  files.push({
    path: "request.http",
    language: "http",
    description:
      "Raw HTTP request to /analyze. Use to test from REST clients (curl, Postman, IntelliJ HTTP, VS Code REST Client).",
    content: rawHttp(c),
  });

  files.push({
    path: "curl.sh",
    language: "bash",
    description:
      "curl one-liner for the same request. Easiest way to verify connectivity.",
    content: curlScript(c),
  });

  return { files, primary: "INTEGRATION.md" };
}

function recipe(c: WizardConfig): string {
  const langName = {
    java: "Java",
    csharp: "C# / .NET",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    php: "PHP",
    other: c.language,
  }[c.language as string];
  const hints = languageHints(c);

  const pseudo = `function guardedChat(history, userText, sessionId):
${
  c.inspectionPoints.includes("user_input")
    ? `    decision = POST ${c.apiBaseUrl}
        Authorization: Bearer $${c.guardKeyEnvVar}
        x-cato-session-id: sessionId
        body: { messages: [...history, {role: "user", content: userText}] }
    if decision.required_action.action_type == "block_action": return refusal()
    if redacted_chat.all_redacted_messages: history = redacted_chat.all_redacted_messages
`
    : ""
}
    assistantText = callTheModel(history)

${
  c.inspectionPoints.includes("assistant_output")
    ? `    decision2 = POST ${c.apiBaseUrl}
        body: { messages: [...history, {role: "assistant", content: assistantText}] }
    apply same block/redact logic
`
    : ""
}
    return assistantText
`;

  return `# Cato API Guard - Integration Recipe (${langName})

> Generated for ${c.customerName || "the customer"}.
> Stack: **${c.language} / ${c.provider} / ${c.architecture}**.
> Inspection: ${c.inspectionPoints.join(", ") || "(none)"}.
> Action: **${c.actionMode}** - Failure mode: **${c.failureMode}**.

We don't ship a turnkey SDK for this language combination yet. The integration is a thin HTTP wrapper around \`POST ${c.apiBaseUrl}\`. Use this recipe.

---

## 1. Set the guard key

Configure the customer's secret manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, Kubernetes Secret) to expose:

\`\`\`
${c.guardKeyEnvVar}=<the guard key>
\`\`\`

The application reads it from the environment at startup. Never log it.

## 2. Build a thin HTTP client

Implement a single function with this contract:

\`\`\`
inspect(messages: List<{role, content}>, sessionId?: String) -> Decision
\`\`\`

For **${langName}**, start with: ${hints.httpClient}. Keep the guard wrapper in ${hints.wrapperLocation}.

Steps inside:

1. Build request:
   - URL: \`${c.apiBaseUrl}\`
   - Method: \`POST\`
   - Headers:
     - \`Content-Type: application/json\`
     - \`Authorization: Bearer $${c.guardKeyEnvVar}\`
     - \`x-cato-session-id: <sessionId>\` (optional but recommended)
   - Body: \`{ "messages": [...] }\`
2. Set a 5-second timeout.
3. On non-2xx or network failure: ${c.failureMode === "fail_open" ? "**fail-open** - log a warning and return a pass-through Decision" : "**fail-closed** - raise/return a blocking Decision"}.
4. On success, parse:
   - \`required_action.action_type\` (\`block_action\`, \`redact_action\`, or \`pass\`)
   - \`required_action.policy_name\`
   - \`required_action.detection_message\`
   - \`redacted_chat.all_redacted_messages\` - the full conversation with detected entities replaced by named placeholders.

## 3. Wire inspection into the chat flow

Pseudocode for a guarded turn:

\`\`\`
${pseudo}
\`\`\`

${
  c.inspectionPoints.includes("tool_call_args") ||
  c.inspectionPoints.includes("tool_result")
    ? `For tool calls and results, preserve the OpenAI tool-message shape so Cato can analyze the structured name, arguments, and result:

- **Tool call**: append \`{role: "assistant", content: null, tool_calls: [{id, type: "function", function: {name, arguments: "<json>"}}]}\` and inspect.
- **Tool result**: append \`{role: "tool", tool_call_id: id, content: "<output>"}\` and inspect.

Block the tool call before execution if the pre-tool inspection blocks. Drop or replace the tool message before re-entering the model if the post-tool inspection blocks.
`
    : ""
}

## 4. Session IDs

Generate session IDs using the **${c.sessionIdStrategy.replace("_", "-")}** strategy. Same session ID = grouped in Cato analytics.

## 5. Test

See \`request.http\` and \`curl.sh\` for ready-to-run test requests. Both expect:

- \`${c.guardKeyEnvVar}\` in the environment
- \`CATO_TEST_INPUT\` set to a value your policy is configured to detect

A successful integration returns \`required_action.action_type = "block_action"\` (or \`"redact_action"\`) when given a sensitive test value.

---

## Frequently asked

**Where does the guard sit?**
Out of band. The application calls Cato; Cato never sits inline with the LLM provider. If Cato is unavailable, your app continues operating per the **${c.failureMode}** policy.

**Latency budget?**
Plan for ~50–150 ms per inspection in the customer's region. With multi-stage inspection enabled here, you'll add ${c.inspectionPoints.length} round-trip(s) per turn. Consider running pre/post inspections in parallel where the model call permits it.

**Streaming responses?**
Inspect the assistant message *after* the stream completes (i.e. not on each chunk). For long streams where you want to fail fast, send periodic snapshots and act on the first block decision.
`;
}

function languageHints(c: WizardConfig): {
  httpClient: string;
  wrapperLocation: string;
} {
  switch (c.language) {
    case "java":
      return {
        httpClient: "`java.net.http.HttpClient`, OkHttp, or Spring `WebClient`",
        wrapperLocation: "the service class that calls the model SDK",
      };
    case "csharp":
      return {
        httpClient: "`HttpClient` injected through `IHttpClientFactory`",
        wrapperLocation: "the application service or minimal API handler that builds chat messages",
      };
    case "go":
      return {
        httpClient: "`http.Client` with `context.Context` timeouts",
        wrapperLocation: "the package that owns the LLM request struct",
      };
    case "rust":
      return {
        httpClient: "`reqwest::Client` with `serde_json` request/response structs",
        wrapperLocation: "the async service layer before the Axum/Actix handler calls the model",
      };
    case "ruby":
      return {
        httpClient: "`Net::HTTP`, Faraday, or HTTParty",
        wrapperLocation: "the Rails service object, job, or controller helper that calls the LLM",
      };
    case "php":
      return {
        httpClient: "Guzzle, Symfony HTTP Client, or cURL",
        wrapperLocation: "the Laravel service, Symfony service, or controller action that calls the LLM",
      };
    default:
      return {
        httpClient: "the customer's standard HTTP client",
        wrapperLocation: "the narrowest shared helper around LLM calls",
      };
  }
}

function rawHttp(c: WizardConfig): string {
  return `### Cato API Guard - analyze request
POST ${c.apiBaseUrl}
Content-Type: application/json
Authorization: Bearer {{${c.guardKeyEnvVar}}}
x-cato-session-id: {{$uuid}}

{
  "messages": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hi, how can I help you?" },
    { "role": "user", "content": "Please look up: {{CATO_TEST_INPUT}}" }
  ]
}
`;
}

function curlScript(c: WizardConfig): string {
  return `#!/usr/bin/env bash
# Cato API Guard smoke test
# Requires: ${c.guardKeyEnvVar}, CATO_TEST_INPUT
set -euo pipefail

: "\${${c.guardKeyEnvVar}:?Set ${c.guardKeyEnvVar} to your guard key}"
: "\${CATO_TEST_INPUT:?Set CATO_TEST_INPUT to a value your policy detects}"

curl -sS -X POST '${c.apiBaseUrl}' \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $${c.guardKeyEnvVar}" \\
  -H "x-cato-session-id: $(uuidgen)" \\
  -d @- <<JSON | jq .
{
  "messages": [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hi, how can I help you?"},
    {"role": "user", "content": "Please look up: $CATO_TEST_INPUT"}
  ]
}
JSON
`;
}
