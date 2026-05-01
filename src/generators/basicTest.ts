import type { WizardConfig } from "../types";

const SAMPLE_INPUT = "Can you please provide me with a due diligence check for SSN 078-05-1120?";

export function generateBasicCurlMarkdown(c: WizardConfig): string {
  return `# Basic Cato API Guard Curl Test

Use this file before touching any customer code. It proves three things:

- The guard key is valid.
- Your network can reach the Cato API Guard endpoint.
- The Guard policy responds to a known test prompt.

## Copy-paste test

Replace \`<guard-key>\` with the Guard key from the Cato console, then run:

Guard key formats can vary. You may see a token key like \`cato-4837-...\` or a regional key like \`R=<region>|K=<guard-key>\`. Paste the key exactly as Cato shows it. Do not add \`R=\` or \`K=\` unless those fields are already part of the key.

\`\`\`bash
curl '${c.apiBaseUrl}' -X POST \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer <guard-key>' \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hi"
      },
      {
        "role": "assistant",
        "content": "Hi, how can I help you?"
      },
      {
        "role": "user",
        "content": "${SAMPLE_INPUT}"
      }
    ]
  }'
\`\`\`

## Safer environment-variable version

This avoids putting the Guard key in shell history:

\`\`\`bash
export ${c.guardKeyEnvVar}='<guard-key-from-cato>'
export CATO_TEST_INPUT='${SAMPLE_INPUT}'
bash basic-curl-test.sh
\`\`\`

## Expected result

Look for \`required_action.action_type\` in the JSON response.

- \`block_action\`: The Guard blocked the prompt. This is usually the expected result for this SSN sample if the policy includes PII detection.
- \`redact_action\`: The Guard redacted the sensitive value. Check \`redacted_chat.all_redacted_messages\`.
- \`pass\` or no action: The Guard allowed the prompt. Either the policy is not configured for this sample, or the Guard is intentionally permissive.

## Common problems

- \`401 Unauthorized\`: The key is wrong, expired, copied with extra spaces, changed into the wrong format, missing the \`Bearer \` prefix, or belongs to a different Guard.
- \`404 Not Found\`: Confirm the endpoint matches the Cato Guard details page. API Guards normally use \`https://api.aisec.catonetworks.com/fw/v1/analyze\` unless Cato shows a regional endpoint.
- \`Action: pass\`: Use a test value that the customer's policy is configured to detect.
- No response: Check VPN, proxy, firewall, DNS, and outbound HTTPS access.
`;
}

export function generateBasicCurlScript(c: WizardConfig): string {
  return `#!/usr/bin/env bash
# Basic Cato API Guard connectivity and policy test.
set -euo pipefail

: "\${${c.guardKeyEnvVar}:?Set ${c.guardKeyEnvVar} to your Guard key}"

TEST_INPUT="\${CATO_TEST_INPUT:-${SAMPLE_INPUT}}"
SESSION_ID="\${CATO_SESSION_ID:-cato-basic-test-$(date +%s)}"

curl -sS '${c.apiBaseUrl}' -X POST \\
  --header 'Content-Type: application/json' \\
  --header "Authorization: Bearer $${c.guardKeyEnvVar}" \\
  --header "x-cato-session-id: $SESSION_ID" \\
  -d @- <<JSON
{
  "messages": [
    {
      "role": "user",
      "content": "Hi"
    },
    {
      "role": "assistant",
      "content": "Hi, how can I help you?"
    },
    {
      "role": "user",
      "content": "$TEST_INPUT"
    }
  ]
}
JSON
`;
}
