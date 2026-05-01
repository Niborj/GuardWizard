import type { WizardConfig } from "../types";
import type { GeneratedFile } from "./index";
import { generateInstrumentationMap, generatePlacementGuide } from "./architecture";

export function generateRunbook(
  c: WizardConfig,
  files: GeneratedFile[],
): string {
  const installCmd = installCommand(c);
  const runCmd = runCommand(c);
  const customer = c.customerName || "the customer";

  return `# ${customer} - Cato API Guard Integration Runbook

This runbook is written for a Sales Engineer who may not know the customer's codebase. Follow it in order. Do not start by editing customer code. First prove the Guard works, then find the right code boundaries, then ask a developer to wire the generated integration into those boundaries.

## What success looks like

By the end of this runbook, you should have:

- Confirmed the Guard key works with a basic curl request.
- Confirmed the customer's policy returns the expected action for a known test prompt.
- Identified where the customer's app sends prompts, receives model responses, and executes tools.
- Given the customer developer a clear implementation map and generated code.
- Verified the finished integration blocks, redacts, or passes according to the policy.

## Integration settings

| Setting | Value |
| --- | --- |
| Customer | ${customer} |
| Language | \`${c.language}\` |
| LLM provider | \`${c.provider}\` |
| Application pattern | \`${c.architecture}\` |
| Inspection points | ${c.inspectionPoints.map((p) => `\`${p}\``).join(", ") || "_None selected_"} |
| On detection | \`${c.actionMode}\` |
| If Guard is unavailable | \`${c.failureMode}\` |
| Cato endpoint | \`${c.apiBaseUrl}\` |
| Guard key env var | \`${c.guardKeyEnvVar}\` |
| Session strategy | \`${c.sessionIdStrategy}\` |

## Files in this kit

| File | What to do with it |
| --- | --- |
${files.map((f) => `| \`${f.path}\` | ${f.description.replace(/\|/g, "\\|")} |`).join("\n")}

Start with \`BASIC_CURL_TEST.md\`. Use \`RUNBOOK.md\` as the overall checklist. Give the generated source file and \`ARCHITECTURE.svg\` to the customer developer.

## Before you start

You need these items:

- A Guard key from the Cato console.
- The customer's expected test policy behavior, such as "SSNs should block" or "secrets should redact".
- A safe test value that the policy should detect. The sample in this kit uses SSN \`078-05-1120\`.
- The name of the application or service that calls the LLM.
- A customer developer who can answer where the LLM call, tool calls, and streaming response code live.

Guard key formats can vary:

- Token key format: \`cato-4837-...\`
- Regional key format: \`R=<region>|K=<guard-key>\`

Use the key exactly as displayed in Cato. Do not add \`R=\` or \`K=\` to a \`cato-...\` key, and do not remove those fields if Cato provided a regional key.

Keep the Guard key safe:

- Do not commit it to source control.
- Do not paste it into tickets or chat.
- Do not leave it in shell history on shared machines.
- Rotate it if it is exposed.

## Phase 1 - Prove the Guard works with curl

This phase does not use the customer's application. It only checks the Guard endpoint and policy.

### Option A: copy-paste curl

Open \`BASIC_CURL_TEST.md\` and replace \`<guard-key>\` with the real Guard key. Paste the key exactly as Cato shows it. Run the curl command shown there.

### Option B: environment-variable script

This is safer because the key is not typed directly into the command:

\`\`\`bash
export ${c.guardKeyEnvVar}='<guard-key-from-cato>'
export CATO_TEST_INPUT='Can you please provide me with a due diligence check for SSN 078-05-1120?'
bash basic-curl-test.sh
\`\`\`

### How to read the curl result

Look for this field:

\`\`\`json
"required_action": {
  "action_type": "block_action"
}
\`\`\`

Possible outcomes:

- \`block_action\`: The Guard blocked the prompt. This is usually expected for the SSN sample if PII blocking is configured.
- \`redact_action\`: The Guard allowed the flow but returned redacted messages. The integration must use \`redacted_chat.all_redacted_messages\`.
- \`pass\`: The Guard allowed the prompt. This may be correct, but if you expected a block or redact, check the policy.
- \`401 Unauthorized\`: The key is wrong, expired, missing \`Bearer \`, or belongs to another Guard.
- Network or DNS failure: Check VPN, proxy, outbound HTTPS, and whether the endpoint is reachable.

Do not continue to code integration until this basic test works or the customer confirms that \`pass\` is the expected policy result.

## Phase 2 - Understand what will be instrumented

Cato API Guard works out of band. It does not sit between the app and the LLM provider. The customer app calls Cato before or after selected AI events, waits for a decision, then decides whether to continue.

For this kit, the selected inspection points are:

${integrationSummary(c)}

Use \`ARCHITECTURE.svg\` in the implementation conversation. It shows:

- The normal customer app flow.
- The request from the app to the Cato AI firewall.
- The response from Cato back to the app.
- The exact hook boundaries selected in the wizard.

## Phase 3 - Find the right code locations

Do not ask the customer developer to "install the guard everywhere". Ask for these specific places:

- The route, controller, handler, or job that receives the user's prompt.
- The helper or service that builds the final LLM message list.
- The exact line where the app calls the LLM provider.
- The place where the app receives the assistant response.
- The tool or function call loop, if the app uses agents or tools.
- The session, user, or conversation ID source.

Code-level hook map:

${generateInstrumentationMap(c)}

Placement guide for unfamiliar codebases:

${generatePlacementGuide(c)}

## Phase 4 - Give the developer the implementation task

Send the customer developer these files:

- \`${primaryFile(c)}\`
- \`ARCHITECTURE.svg\`
- \`ARCHITECTURE.md\`
- \`BASIC_CURL_TEST.md\`
- \`RUNBOOK.md\`

Ask them to implement this task:

1. Add the reusable Cato Guard client from \`${primaryFile(c)}\` to the application.
2. Load \`${c.guardKeyEnvVar}\` from the customer's secret manager.
3. Reuse one stable \`x-cato-session-id\` per **${c.sessionIdStrategy.replace("_", " ")}**.
4. Add the selected guard calls at the boundaries listed in \`ARCHITECTURE.svg\`.
5. Apply \`required_action.action_type\` before allowing the next hop.
6. If Cato returns redacted messages, pass the redacted messages forward instead of the originals.
7. Log \`policy_name\` and \`detection_message\`, but do not log raw sensitive values.
8. Run the verification steps in this runbook.

### Where the generated client belongs

${languagePlacementAdvice(c)}

### How to handle Cato decisions

${decisionAdvice(c)}

### How to handle Guard availability

${failureAdvice(c)}

## Phase 5 - Configure the customer environment

In local development, the developer can set:

\`\`\`bash
export ${c.guardKeyEnvVar}=<paste-the-guard-key-here>
export CATO_API_URL='${c.apiBaseUrl}'
\`\`\`

In production, use the customer's normal secret manager:

- AWS Secrets Manager
- Azure Key Vault
- GCP Secret Manager
- HashiCorp Vault
- Kubernetes Secret
- The customer's existing CI/CD secret injection

The Guard key must be available to the runtime that calls Cato. If the application is split across frontend and backend, the key belongs on the backend only.

## Phase 6 - Install dependencies

Run this in the customer application repository:

\`\`\`bash
${installCmd}
\`\`\`

If this command does not match the customer's package manager, ask the developer to install the equivalent HTTP client and environment variable loader.

## Phase 7 - Run the generated smoke test

After the client is in place and the environment variable is set, run:

\`\`\`bash
export CATO_TEST_INPUT='Can you please provide me with a due diligence check for SSN 078-05-1120?'
${runCmd}
\`\`\`

Expected behavior:

- The command reaches \`${c.apiBaseUrl}\`.
- It prints or returns the Cato action.
- The action matches the customer's policy expectation.

If the basic curl test passes but this generated smoke test fails, the issue is usually local dependency installation, environment variable loading, or how the generated client was copied into the project.

## Phase 8 - Validate inside the real app

Run these checks with the customer developer:

- Send a harmless prompt such as "Hello". Expected result: normal assistant response.
- Send the known test prompt. Expected result: \`block_action\`, \`redact_action\`, or \`pass\` according to policy.
- Confirm the app does not show blocked content to the user.
- If redaction is expected, confirm the model receives the redacted text, not the original sensitive value.
- If tools are enabled, confirm blocked tool calls do not execute.
- If tool results are inspected, confirm blocked or redacted tool results do not re-enter model context.
- Confirm detections appear in the Cato console.
- Confirm related turns share the same \`x-cato-session-id\`.

## Phase 9 - Production readiness checklist

- [ ] Basic curl test has been run successfully.
- [ ] Generated smoke test has been run successfully.
- [ ] The Guard key is stored in a secret manager.
- [ ] The Guard key is not present in source control, logs, tickets, or screenshots.
- [ ] All selected inspection points are wired:
${c.inspectionPoints.map((p) => `  - [ ] \`${p}\``).join("\n")}
- [ ] Failure mode is confirmed as \`${c.failureMode}\`.
- [ ] Detection behavior is confirmed as \`${c.actionMode}\`.
- [ ] Redacted messages replace original messages when Cato returns redactions.
- [ ] Blocks stop the next hop before model calls, tool calls, or user display.
- [ ] Logging records policy metadata without sensitive content.
- [ ] Session IDs are stable per \`${c.sessionIdStrategy}\`.
- [ ] Latency has been measured with realistic traffic.
- [ ] The customer developer has reviewed the final code.

## Troubleshooting guide

| Symptom | What it usually means | What to do |
| --- | --- | --- |
| \`401 Unauthorized\` | Bad, expired, copied incorrectly, changed into the wrong format, or mismatched Guard key | Re-copy the key from Cato exactly as shown, keep the \`Bearer \` prefix, and confirm it belongs to this Guard |
| \`404 Not Found\` | Wrong endpoint or path | Confirm the endpoint is \`${c.apiBaseUrl}\` |
| \`Action: pass\` when you expected block | Policy does not detect the sample | Test with a value the policy is configured to catch, or update the policy |
| Curl works but app fails | App env var, dependency, or copy issue | Check \`${c.guardKeyEnvVar}\`, install dependencies, and confirm the generated client is imported correctly |
| Redaction appears in Cato but model receives original text | Integration ignored redacted messages | Pass \`redacted_chat.all_redacted_messages\` forward after \`redact_action\` |
| Tool still executes after a block | Pre-tool guard is in the wrong place | Move the tool-call guard before the function/API execution |
| Detections are split across many sessions | Session ID changes too often | Reuse the same \`x-cato-session-id\` for the selected strategy |
| Latency is too high | Too many serial guard calls or distant endpoint | Measure each hook, confirm regional endpoint, and review whether all selected hooks are needed |

## What to send back to Cato or your internal team

Capture these details after the customer test:

- Customer application name.
- Language and LLM provider.
- Which inspection points were implemented.
- The observed Cato action for the test prompt.
- Whether redaction was used.
- Where the session ID came from.
- Any error messages or unexpected pass results.
- Screenshots of Cato detections with sensitive values hidden.

## Quick SE script for the customer call

"We are going to test the Guard before changing your app. First we run a curl request directly to Cato. Then we find the exact place your app calls the model. The Guard is out of band, so your app will call Cato, receive a block/redact/pass decision, and then continue or stop. We will not put the Guard key in the frontend or commit it to source control."
`;
}

function primaryFile(c: WizardConfig) {
  if (c.language === "python") return "cato_guard.py";
  if (c.language === "node") return "cato-guard.js";
  if (c.language === "typescript") return "cato-guard.ts";
  return "INTEGRATION.md";
}

function installCommand(c: WizardConfig) {
  switch (c.language) {
    case "python":
      return `pip install ${["requests", "python-dotenv", ...pythonProviderPackages(c)].join(" ")}`;
    case "node":
    case "typescript":
      return "npm install";
    case "rust":
      return "cargo add reqwest serde serde_json tokio";
    case "ruby":
      return "bundle add faraday dotenv";
    case "php":
      return "composer require guzzlehttp/guzzle vlucas/phpdotenv";
    default:
      return "(install your HTTP client and dotenv equivalent)";
  }
}

function pythonProviderPackages(c: WizardConfig) {
  const packages: string[] = [];
  if (c.provider === "openai" || c.provider === "azure-openai" || c.provider === "ollama") {
    packages.push("openai");
  }
  if (c.provider === "anthropic") packages.push("anthropic");
  if (c.provider === "bedrock") packages.push("boto3");
  if (c.provider === "gemini") packages.push("google-generativeai");
  if (c.provider === "mistral") packages.push("mistralai");
  if (c.provider === "cohere") packages.push("cohere");
  if (c.architecture === "langchain") packages.push("langchain-core");
  if (c.architecture === "langgraph") packages.push("langgraph", "langchain-core");
  return Array.from(new Set(packages));
}

function runCommand(c: WizardConfig) {
  switch (c.language) {
    case "python":
      return "python test_guard.py";
    case "node":
      return "node test-guard.js";
    case "typescript":
      return "npx tsx test-guard.ts";
    default:
      return "bash basic-curl-test.sh";
  }
}

function integrationSummary(c: WizardConfig) {
  const points = c.inspectionPoints.map((p) => {
    switch (p) {
      case "system_message":
        return "- **System message**: Inspect the system or developer prompt before the first model request.";
      case "user_input":
        return "- **User input**: Inspect every user turn before it is sent to the model.";
      case "assistant_output":
        return "- **Assistant output**: Inspect each model response before showing it to the user or caller.";
      case "tool_call_args":
        return "- **Tool call arguments**: Inspect tool or function arguments before the tool executes.";
      case "tool_result":
        return "- **Tool result**: Inspect tool return values before they re-enter model context.";
    }
  });
  return points.join("\n");
}

function languagePlacementAdvice(c: WizardConfig) {
  switch (c.language) {
    case "python":
      return "Place `cato_guard.py` beside the service/module that calls the LLM. For FastAPI, Flask, or Django, this is usually not the route file itself, but the service helper used by the route.";
    case "node":
    case "typescript":
      return "Place the Cato Guard module beside the backend service that calls the LLM. In Express, Fastify, Next.js API routes, or serverless functions, keep it on the server side only.";
    case "java":
      return "Create a small service around the Cato HTTP call, then inject it into the Spring, Quarkus, or application service that owns the LLM request.";
    case "csharp":
      return "Register a typed `HttpClient` or service for Cato, then call it from the ASP.NET controller, minimal API handler, or application service that owns the LLM request.";
    case "go":
      return "Put the Guard wrapper in the package that owns the LLM request structs. Pass `context.Context` into the Guard call so timeouts and cancellation work correctly.";
    case "rust":
      return "Create a small async Guard client using `reqwest` and `serde`. Call it from the service layer before the Axum or Actix handler returns data to the model or user.";
    case "ruby":
      return "Use a Rails service object or shared helper for the Cato HTTP call. Avoid putting the Guard key or HTTP code directly in views or frontend assets.";
    case "php":
      return "Use a Laravel or Symfony service for the Cato HTTP call. Keep the Guard key in server-side configuration and call the service before model/tool/user hops.";
  }
}

function decisionAdvice(c: WizardConfig) {
  switch (c.actionMode) {
    case "policy_driven":
      return "Policy-driven mode means the integration should follow Cato's returned `required_action.action_type`. Do not convert redactions into blocks unless the customer explicitly wants that behavior.";
    case "block":
      return "Block mode means any Cato detection should stop the next hop. Use this only when the customer wants the strictest behavior.";
    case "redact":
      return "Redact mode means the integration should continue with Cato's redacted messages whenever redactions are returned.";
    case "log_only":
      return "Log-only mode means detections should be recorded but should not stop or modify the application flow.";
  }
}

function failureAdvice(c: WizardConfig) {
  if (c.failureMode === "fail_closed") {
    return "Fail-closed means the app should stop the guarded flow if Cato cannot be reached. Use this for high-risk data flows where safety is more important than availability.";
  }
  return "Fail-open means the app can continue if Cato has a transient network or 5xx failure. Authentication errors and invalid payloads should still be loud because they indicate integration or configuration problems.";
}
