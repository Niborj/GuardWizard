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

  return `# ${customer} — Cato API Guard Integration Runbook

This runbook walks a non-developer through installing and verifying the
Cato API Guard integration generated for **${customer}**.

If you get stuck, the integration kit was generated with these settings:

| Setting | Value |
| --- | --- |
| Language | \`${c.language}\` |
| LLM provider | \`${c.provider}\` |
| Architecture | \`${c.architecture}\` |
| Inspection points | ${c.inspectionPoints.map((p) => `\`${p}\``).join(", ") || "_(none)_"} |
| On detection | \`${c.actionMode}\` |
| If guard fails | \`${c.failureMode}\` |
| Endpoint | \`${c.apiBaseUrl}\` |
| Guard key env var | \`${c.guardKeyEnvVar}\` |

---

## What you got

| File | What it is |
| --- | --- |
${files.map((f) => `| \`${f.path}\` | ${f.description.replace(/\|/g, "\\|")} |`).join("\n")}

---

## Step 1 — Get a guard key

In the Cato Networks console, create an API Guard for the customer's
application and copy its **guard key**. Use it exactly as provided by
Cato, for example \`R=<region>|K=<guard-key>\`.

> Treat the key like a password. Do not commit it to git, do not paste
> it into chat, and rotate it if you suspect exposure.

## Step 2 — Drop the files into the project

Copy every file listed above into the customer's repository. The
\`${primaryFile(c)}\` file is the reusable client — everything else
references it.

The integration is **out-of-band**. The customer's application keeps
making LLM calls the same way; we just add a call to Cato before and/or
after each model interaction.

## Step 3 — Configure the guard key

Set the environment variable on the runtime that hosts the application:

\`\`\`bash
export ${c.guardKeyEnvVar}=<paste-the-guard-key-here>
\`\`\`

For the customer's actual deployment, store the key in their secret
manager (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager,
HashiCorp Vault, Kubernetes Secret) and inject it at process start.

## Step 4 — Install dependencies

\`\`\`bash
${installCmd}
\`\`\`

## Step 5 — Smoke test against the live endpoint

Pick any value your policy is configured to flag (PII, secret, internal
identifier — your security team will know what your policy detects).
Set it as \`CATO_TEST_INPUT\`:

\`\`\`bash
export CATO_TEST_INPUT='<a value your policy detects>'
${runCmd}
\`\`\`

Expected output: the response prints
\`Action: block_action\` (or \`redact_action\`) along with the policy
name and detection message. If you see \`Action: pass\`, the guard
either is configured to allow that pattern, or the test value isn't
covered by your policy.

## Step 6 — Wire the guard into the application

The generated kit includes \`ARCHITECTURE.svg\`, a downloadable visual
diagram that shows where the selected guard hooks sit in the customer's
application flow. Use it as the handoff picture for the implementation
ticket or customer workshop.

Instrumentation map:

${integrationSummary(c)}

Code-level hook map:

${generateInstrumentationMap(c)}

Placement guide for unfamiliar codebases:

${generatePlacementGuide(c)}

Have a developer port these calls into the equivalent locations in the
customer's actual application code. If they are not sure where the LLM
call lives, start with the search terms above and ask for the model
wrapper, tool registry, response handler, and session ID source.

## Step 7 — Production checks before go-live

- [ ] Guard key is loaded from a secret manager, not committed to source.
- [ ] All ${c.inspectionPoints.length} inspection point(s) are wired up:
${c.inspectionPoints.map((p) => `      - [ ] \`${p}\``).join("\n")}
- [ ] Failure mode is **${c.failureMode}**, matching the customer's risk tolerance.
- [ ] Latency budget verified — ${c.inspectionPoints.length} extra round-trip(s) per turn fit the customer's SLO.
- [ ] Logging captures \`policy_name\` and \`detection_message\` on every block, but redacts the original sensitive value.
- [ ] Session IDs are stable per **${c.sessionIdStrategy.replace("_", " ")}** so detections group correctly in the Cato console.
- [ ] Customer has run the smoke test in their own environment with their own test value.
- [ ] A developer has reviewed the generated code.

## Step 8 — Tell the customer how to monitor

- All detections show up in the Cato console under the API Guard's
  detections feed.
- Group by \`x-cato-session-id\` to see whole conversations.
- Set up a Slack/PagerDuty/email alert on detection volume — sudden
  spikes can indicate a new attack pattern or a customer use case the
  policy hasn't been tuned for.

---

## Troubleshooting

**\`401 Unauthorized\`** — \`${c.guardKeyEnvVar}\` is wrong, expired, or revoked.
Re-issue the guard key in the console.

**\`429 Too Many Requests\`** — request rate is above the API Guard's
plan limit. Either upgrade or batch fewer turns per second.

**\`Action: pass\` on a value you expected to fail** — the policy isn't
configured to detect that pattern. Open the policy in the Cato console
and add the appropriate detector.

**Latency spike** — verify the request is going to the regional endpoint
closest to the customer. Override \`CATO_API_URL\` if needed.

**Application errors when guard is unreachable** — the failure mode is
**${c.failureMode}**. ${
    c.failureMode === "fail_closed"
      ? "Fail-closed is by design — switch to fail-open in the wizard if availability matters more than safety for this customer."
      : "Fail-open is by design — switch to fail-closed in the wizard if the customer can't tolerate any sensitive data slipping through during a Cato outage."
  }
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
      return "bash curl.sh";
  }
}

function integrationSummary(c: WizardConfig) {
  const points = c.inspectionPoints.map((p) => {
    switch (p) {
      case "system_message":
        return "- **System message**: inspect once at conversation start, before the first model call.";
      case "user_input":
        return "- **User input** (pre-LLM): inspect every user turn *before* sending to the model.";
      case "assistant_output":
        return "- **Assistant output** (post-LLM): inspect each model response *before* showing it to the user.";
      case "tool_call_args":
        return "- **Tool call args** (pre-tool): inspect tool / function call arguments *before* the tool executes.";
      case "tool_result":
        return "- **Tool result** (post-tool): inspect tool return values *before* they re-enter the model context.";
    }
  });
  return points.join("\n");
}
