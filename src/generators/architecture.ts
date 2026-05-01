import type {
  Architecture,
  InspectionPoint,
  Language,
  Provider,
  WizardConfig,
} from "../types";

const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python",
  node: "Node.js",
  typescript: "TypeScript",
  java: "Java",
  csharp: "C# / .NET",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
};

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  "azure-openai": "Azure OpenAI",
  bedrock: "AWS Bedrock",
  gemini: "Google Gemini",
  mistral: "Mistral AI",
  cohere: "Cohere",
  ollama: "Ollama / local LLM",
  other: "Customer LLM provider",
};

const ARCHITECTURE_LABELS: Record<Architecture, string> = {
  "direct-sdk": "Direct SDK call",
  langchain: "LangChain model/tool wrappers",
  langgraph: "LangGraph guard nodes",
  llamaindex: "LlamaIndex query/agent hooks",
  "semantic-kernel": "Semantic Kernel middleware",
  "server-proxy": "Internal LLM proxy/gateway",
  other: "Custom application path",
};

const CATO = {
  black: "#231F20",
  ink: "#101513",
  navy: "#173F36",
  line: "#315A50",
  green: "#158864",
  greenDark: "#0A3529",
  mist: "#F2F7F4",
  mist2: "#C8D7D0",
  white: "#FFFFFF",
  warn: "#E9B44C",
};

interface Hook {
  point: InspectionPoint;
  title: string;
  diagramTitle: string;
  diagramBody: string;
  diagramPlacement: string;
  placement: string;
  find: string;
}

const HOOKS: Hook[] = [
  {
    point: "system_message",
    title: "System message",
    diagramTitle: "System prompt",
    diagramBody: "Inspect system instructions before the first model request.",
    diagramPlacement: "Before the first model request.",
    placement: "Place before the first model request is assembled or sent.",
    find: "prompt templates, default instructions, persona builders, messages with role=system",
  },
  {
    point: "user_input",
    title: "User input",
    diagramTitle: "User input",
    diagramBody: "Inspect each user turn before the model call.",
    diagramPlacement: "After user input, before LLM.",
    placement: "Place after the app receives the user turn and before forwarding it to the LLM.",
    find: "chat route handlers, message array builders, request DTOs, prompt variables",
  },
  {
    point: "tool_call_args",
    title: "Tool call arguments",
    diagramTitle: "Tool call",
    diagramBody: "Inspect tool arguments before the tool executes.",
    diagramPlacement: "After tool proposal, before execution.",
    placement: "Place after the model proposes a tool/function call and before the tool executes.",
    find: "tool_calls, function_call, tool invocation loops, agent action handlers",
  },
  {
    point: "tool_result",
    title: "Tool result",
    diagramTitle: "Tool result",
    diagramBody: "Inspect tool results before model context.",
    diagramPlacement: "After tool returns, before model context.",
    placement: "Place after the tool returns and before its result re-enters model context.",
    find: "ToolMessage, role=tool, observation, function result, returned API payload",
  },
  {
    point: "assistant_output",
    title: "Assistant output",
    diagramTitle: "Assistant output",
    diagramBody: "Inspect model output before user display.",
    diagramPlacement: "After model response, before display.",
    placement: "Place after the model returns and before content is displayed or streamed onward.",
    find: "response handlers, streaming finalizers, assistant messages, completion content",
  },
];

export function generateArchitectureMarkdown(c: WizardConfig): string {
  return `# Cato API Guard Architecture

Generated for **${c.customerName || "the customer"}**.

| Setting | Value |
| --- | --- |
| Language | ${LANGUAGE_LABELS[c.language]} |
| Provider | ${PROVIDER_LABELS[c.provider]} |
| Application pattern | ${ARCHITECTURE_LABELS[c.architecture]} |
| Guard endpoint | \`${c.apiBaseUrl}\` |
| Session strategy | \`${c.sessionIdStrategy}\` |

## Visual Diagram

Open or download \`ARCHITECTURE.svg\` for the Cato-branded instrumentation diagram. It shows the customer application flow, the out-of-band request/response exchange with the Cato AI firewall, and the selected code boundaries to instrument.

![Cato API Guard instrumentation diagram](./ARCHITECTURE.svg)

## Instrumentation Map

${generateInstrumentationMap(c)}

## Placement Guide

${generatePlacementGuide(c)}

## Implementation Notes

${architectureNotes(c)}

## Cato API Call Shape

Each guard hook sends OpenAI-format messages to Cato before the next application hop:

\`\`\`http
POST ${c.apiBaseUrl}
Authorization: Bearer $${c.guardKeyEnvVar}
x-cato-session-id: <stable session id>
Content-Type: application/json

{ "messages": [...] }
\`\`\`

On every hook, apply \`required_action.action_type\` before continuing. A block stops the next hop, a redact action swaps in \`redacted_chat.all_redacted_messages\`, and a pass-through action continues with the original messages.
`;
}

export function generateArchitectureSvg(c: WizardConfig): string {
  const selected = selectedHooks(c);
  const customer = c.customerName || "Customer application";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="980" viewBox="0 0 1600 980" role="img" aria-label="Cato API Guard instrumentation architecture diagram">
  <title>${escapeXml(customer)} Cato API Guard instrumentation diagram</title>
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${CATO.green}"/>
    </marker>
    <marker id="arrowLight" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${CATO.mist2}"/>
    </marker>
  </defs>

  <rect width="1600" height="980" fill="${CATO.ink}"/>

  <text x="56" y="58" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="${CATO.white}">Cato API Guard instrumentation</text>
  <text x="56" y="89" font-family="Inter, Arial, sans-serif" font-size="15" fill="${CATO.mist2}">${escapeXml(customer)} · ${escapeXml(LANGUAGE_LABELS[c.language])} · ${escapeXml(PROVIDER_LABELS[c.provider])} · ${escapeXml(ARCHITECTURE_LABELS[c.architecture])}</text>
  <text x="56" y="116" font-family="Inter, Arial, sans-serif" font-size="13" fill="${CATO.green}">The customer app keeps its normal LLM path. Each selected hook makes an out-of-band request to the Cato AI firewall and waits for a decision response.</text>

  ${runtimePanel(c, selected)}
  ${exchangePanel(c)}
  ${placementPanel(c)}
</svg>
`;
}

export function generateInstrumentationMap(c: WizardConfig): string {
  const selected = selectedHooks(c);
  if (!selected.length) return "_No inspection points selected._";

  return selected
    .map((hook) => {
      return `- **${hook.title}**: ${hook.placement} ${codePointer(c, hook.point)}`;
    })
    .join("\n");
}

export function generatePlacementGuide(c: WizardConfig): string {
  const selected = selectedHooks(c);
  const selectedGuide = selected.length
    ? selected
        .map((hook) => {
          return `- **${hook.title}**\n  - Look for: ${hook.find}.\n  - Add the guard: ${hook.placement} ${codePointer(c, hook.point)}`;
        })
        .join("\n")
    : "- No inspection points were selected in the wizard.";

  return `### Fast Method For An Unknown Codebase

1. Find the code path that sends requests to the LLM provider.
2. Find where the app builds the \`messages\`, prompt, tool list, or agent state.
3. Add the selected Cato guard calls at the boundaries below, keeping the same \`x-cato-session-id\` for the conversation.
4. Apply Cato's decision before continuing to the next hop: block stops execution, redact replaces messages, pass continues.

### Useful Search Terms

\`\`\`text
${searchTerms(c).join("\n")}
\`\`\`

### Selected Guard Boundaries

${selectedGuide}

### Questions To Ask The Customer Developer

- Which file receives the user's chat/API request?
- Which helper or service actually calls the LLM provider?
- Where is the conversation/session/user ID available?
- Where are tools or function calls registered and executed?
- Is the response streamed token-by-token or assembled before being returned?

### Architecture-Specific Hint

${architectureNotes(c)}
`;
}

function selectedHooks(c: WizardConfig): Hook[] {
  return HOOKS.filter((hook) => c.inspectionPoints.includes(hook.point));
}

function codePointer(c: WizardConfig, point: InspectionPoint): string {
  if (c.language === "python") {
    const map: Record<InspectionPoint, string> = {
      system_message: "Use `guard.inspect_system_messages(...)`.",
      user_input: "Use `guard.inspect_user_input(...)`.",
      assistant_output: "Use `guard.inspect_assistant_output(...)`.",
      tool_call_args: "Use `guard.inspect_tool_call(...)` with structured tool arguments.",
      tool_result: "Use `guard.inspect_tool_result(...)` with the returned tool message.",
    };
    return map[point];
  }

  if (c.language === "node" || c.language === "typescript") {
    const map: Record<InspectionPoint, string> = {
      system_message: "Use `guard.inspectSystemMessages(...)`.",
      user_input: "Use `guard.inspectUserInput(...)`.",
      assistant_output: "Use `guard.inspectAssistantOutput(...)`.",
      tool_call_args: "Use `guard.inspectToolCall(...)` with structured `tool_calls`.",
      tool_result: "Use `guard.inspectToolResult(...)` with the returned tool message.",
    };
    return map[point];
  }

  return "Call the shared HTTP `inspect(messages, sessionId)` wrapper at this boundary.";
}

function architectureNotes(c: WizardConfig): string {
  switch (c.architecture) {
    case "direct-sdk":
      return "Wrap the existing model call in the generated direct SDK example. The pre-model hooks run before `client.chat.completions.create(...)` or the provider equivalent; the post-model hook runs immediately after the model response is assembled.";
    case "langchain":
      return "Wrap the chat model with the generated guarded Runnable and wrap sensitive tools with the generated tool wrapper. Keep the same `cato_session_id` in Runnable metadata for the full conversation.";
    case "langgraph":
      return "Insert the generated guard nodes between the agent node and tool node. Route blocked decisions to the halt path before tool execution or response delivery.";
    case "server-proxy":
      return "Put the guard hooks in proxy middleware around the upstream model request. Inspect the incoming OpenAI-compatible request body before forwarding, then inspect the upstream response before returning it.";
    case "llamaindex":
      return "Install the guard wrapper around the query engine or agent runner. Inspect user turns before retrieval/model calls and inspect tool/RAG results before they re-enter context.";
    case "semantic-kernel":
      return "Install the guard as invocation middleware around prompt rendering, function calls, and function results. Keep one Cato session id on the kernel context.";
    default:
      return "Use the diagram boundaries as the integration contract. Add the HTTP guard wrapper at each selected boundary before the next hop executes.";
  }
}

function searchTerms(c: WizardConfig): string[] {
  const terms = new Set<string>([
    "messages",
    "role: \"system\"",
    "role: \"user\"",
    "role: \"assistant\"",
    "tool_calls",
    "function_call",
    "role: \"tool\"",
    "stream",
    "session_id",
    "conversation_id",
  ]);

  for (const term of providerTerms(c.provider)) terms.add(term);
  for (const term of architectureTerms(c.architecture)) terms.add(term);
  for (const term of languageTerms(c.language)) terms.add(term);

  return Array.from(terms);
}

function providerTerms(provider: Provider): string[] {
  switch (provider) {
    case "openai":
      return ["chat.completions.create", "responses.create", "OpenAI("];
    case "azure-openai":
      return ["AzureOpenAI", "chat.completions.create", "deployment"];
    case "anthropic":
      return ["messages.create", "Anthropic(", "Claude"];
    case "bedrock":
      return ["invoke_model", "converse", "BedrockRuntime"];
    case "gemini":
      return ["generateContent", "GoogleGenerativeAI", "VertexAI"];
    case "mistral":
      return ["Mistral", "mistral.chat.complete", "chat.complete", "MISTRAL_API_KEY"];
    case "cohere":
      return ["CohereClient", "co.chat", "cohere.chat", "COHERE_API_KEY"];
    case "ollama":
      return ["ollama", "OLLAMA_HOST", "/api/chat", "base_url", "localhost:11434"];
    default:
      return ["complete", "chat", "generate"];
  }
}

function architectureTerms(architecture: Architecture): string[] {
  switch (architecture) {
    case "langchain":
      return ["Runnable", "invoke", "ainvoke", "@tool", "BaseChatModel", "ToolMessage"];
    case "langgraph":
      return ["StateGraph", "add_node", "ToolNode", "MessagesState", "should_continue"];
    case "llamaindex":
      return ["query_engine", "chat_engine", "AgentRunner", "FunctionTool"];
    case "semantic-kernel":
      return ["Kernel", "IChatCompletionService", "FunctionInvocationFilter", "PromptExecutionSettings"];
    case "server-proxy":
      return ["proxy", "middleware", "/chat/completions", "/v1/messages", "upstream"];
    case "direct-sdk":
      return ["client", "model", "temperature", "max_tokens"];
    default:
      return ["agent", "tool", "llm", "prompt"];
  }
}

function languageTerms(language: Language): string[] {
  switch (language) {
    case "python":
      return ["async def", "requests.post", "httpx", "FastAPI", "Flask"];
    case "node":
    case "typescript":
      return ["fetch(", "axios", "express", "NextRequest", "ReadableStream"];
    case "java":
      return ["WebClient", "OkHttpClient", "CompletableFuture", "Controller"];
    case "csharp":
      return ["HttpClient", "IHostedService", "Controller", "Minimal API"];
    case "go":
      return ["http.Client", "context.Context", "HandlerFunc", "json.Marshal"];
    case "rust":
      return ["reqwest::Client", "serde_json", "axum", "actix_web", "tokio"];
    case "ruby":
      return ["Net::HTTP", "Faraday", "HTTParty", "Rails", "Sinatra"];
    case "php":
      return ["GuzzleHttp", "curl_init", "Laravel", "Symfony", "json_encode"];
  }
}

function runtimePanel(c: WizardConfig, selected: Hook[]): string {
  const hookIndex = new Map(selected.map((hook, index) => [hook.point, index + 1]));
  const beforeModel = selected.filter((hook) =>
    hook.point === "system_message" || hook.point === "user_input"
  );
  const toolHooks = selected.filter((hook) =>
    hook.point === "tool_call_args" || hook.point === "tool_result"
  );
  const afterModel = selected.filter((hook) => hook.point === "assistant_output");

  return `<g>
    <rect x="48" y="145" width="880" height="795" rx="8" fill="${CATO.navy}" stroke="${CATO.line}"/>
    <text x="82" y="183" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" fill="${CATO.mist}">1. Customer application flow</text>
    <text x="82" y="209" font-family="Inter, Arial, sans-serif" font-size="12" fill="${CATO.mist2}">The AI app stays in control. Cato is called out-of-band from selected code boundaries.</text>

    ${flowNode(82, 242, 130, 78, "Caller", "User, API client, bot")}
    ${flowNode(242, 242, 160, 78, "App entrypoint", `${LANGUAGE_LABELS[c.language]} request handler`)}
    ${flowNode(432, 242, 172, 78, "Guarded wrapper", "Add selected Cato hooks here")}
    ${flowNode(634, 242, 150, 78, "LLM provider", PROVIDER_LABELS[c.provider])}
    ${flowNode(814, 242, 82, 78, "Return", "User")}
    ${arrow(212, 281, 242, 281, false, CATO.mist2, "arrowLight")}
    ${arrow(402, 281, 432, 281, false, CATO.mist2, "arrowLight")}
    ${arrow(604, 281, 634, 281, false, CATO.mist2, "arrowLight")}
    ${arrow(784, 281, 814, 281, false, CATO.mist2, "arrowLight")}

    <rect x="82" y="356" width="814" height="382" rx="8" fill="${CATO.ink}" opacity="0.62" stroke="${CATO.line}"/>
    <text x="110" y="392" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" fill="${CATO.white}">Selected guard boundaries in customer code</text>
    <text x="110" y="417" font-family="Inter, Arial, sans-serif" font-size="11" fill="${CATO.mist2}">Every green boundary pauses the next hop, sends messages to Cato, then applies the response.</text>

    ${phaseColumn("Before model request", "System and user prompt checks", 110, 452, beforeModel, hookIndex)}
    ${phaseColumn("Around tool execution", "Tool arguments and tool results", 372, 452, toolHooks, hookIndex)}
    ${phaseColumn("Before user sees output", "Assistant response checks", 634, 452, afterModel, hookIndex)}

    <rect x="82" y="768" width="814" height="120" rx="8" fill="${CATO.black}" stroke="${CATO.line}"/>
    <text x="110" y="804" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" fill="${CATO.white}">Important: Cato is not inline between the app and model</text>
    ${textBlock("At each selected hook, the customer app makes a separate HTTP request to Cato API Guard. The app then gates the next step with Cato's response: block, redact, or pass.", 110, 832, 116, 17, {
      fill: CATO.mist2,
      size: 12,
    })}
  </g>`;
}

function exchangePanel(c: WizardConfig): string {
  const actionLabel = c.actionMode.replace("_", " ");
  const session = sessionLabel(c);
  return `<g>
    <rect x="960" y="145" width="592" height="390" rx="8" fill="${CATO.black}" stroke="${CATO.line}"/>
    <text x="994" y="183" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" fill="${CATO.mist}">2. Request / response with the Cato AI firewall</text>
    <text x="994" y="209" font-family="Inter, Arial, sans-serif" font-size="12" fill="${CATO.mist2}">This same exchange happens at every selected hook.</text>

    ${exchangeNode(998, 258, 178, 82, "Selected app hook", "Messages are ready; next hop is paused", CATO.mist, CATO.black)}
    ${exchangeNode(1300, 258, 204, 82, "Cato API Guard", "AI firewall · /fw/v1/analyze", CATO.green, CATO.white)}
    ${arrow(1178, 279, 1298, 279)}
    ${arrow(1298, 321, 1178, 321, false, CATO.mist2, "arrowLight")}
    <text x="1210" y="263" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="800" fill="${CATO.green}">1 request</text>
    <text x="1198" y="296" font-family="Inter, Arial, sans-serif" font-size="10" fill="${CATO.mist2}">messages + session id</text>
    <text x="1204" y="348" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="800" fill="${CATO.mist2}">2 response</text>
    <text x="1190" y="365" font-family="Inter, Arial, sans-serif" font-size="10" fill="${CATO.mist2}">required_action + redactions</text>

    ${exchangeNode(998, 408, 214, 78, "Decision gate in app", `Apply ${actionLabel} behavior`, CATO.black, CATO.white)}
    ${exchangeNode(1290, 408, 214, 78, "Next hop", "LLM, tool, user response, or stop", CATO.black, CATO.white)}
    ${arrow(1087, 340, 1087, 408)}
    ${arrow(1214, 447, 1290, 447)}
    <text x="996" y="510" font-family="Inter, Arial, sans-serif" font-size="10" fill="${CATO.green}">Wire response fields: required_action.action_type + redacted_chat.all_redacted_messages</text>
    <text x="996" y="526" font-family="Inter, Arial, sans-serif" font-size="10" fill="${CATO.mist2}">Session grouping: ${escapeXml(session)}</text>
  </g>`;
}

function placementPanel(c: WizardConfig): string {
  const selected = selectedHooks(c);
  const chunks = [
    `<rect x="960" y="565" width="592" height="375" rx="8" fill="${CATO.black}" stroke="${CATO.line}"/>
    <text x="994" y="603" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" fill="${CATO.mist}">3. Exact places to instrument</text>
    <text x="994" y="629" font-family="Inter, Arial, sans-serif" font-size="12" fill="${CATO.mist2}">Use this when the SE does not know the customer's stack. Find these code boundaries first.</text>`,
  ];

  if (!selected.length) {
    chunks.push(
      textBlock("No inspection points selected.", 994, 682, 60, 16, {
        fill: CATO.warn,
        size: 13,
        weight: 800,
      }),
    );
  }

  selected.forEach((hook, index) => {
    const y = 662 + index * 42;
    chunks.push(`<g>
      <circle cx="1010" cy="${y - 5}" r="13" fill="${CATO.green}"/>
      <text x="1010" y="${y}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="900" fill="${CATO.white}">${index + 1}</text>
      ${textBlock(hook.title, 1032, y, 48, 15, {
        fill: CATO.white,
        size: 12,
        weight: 800,
        maxLines: 1,
      })}
      ${textBlock(hook.diagramPlacement, 1032, y + 18, 72, 13, {
        fill: CATO.mist2,
        size: 10,
      })}
    </g>`);
  });

  chunks.push(`<g>
    <line x1="994" y1="884" x2="1518" y2="884" stroke="${CATO.line}"/>
    <text x="994" y="913" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="800" fill="${CATO.green}">Ask for:</text>
    <text x="1050" y="913" font-family="Inter, Arial, sans-serif" font-size="11" fill="${CATO.mist2}">model wrapper · tool registry · stream handler · stable session ID source</text>
  </g>`);

  return chunks.join("\n");
}

function flowNode(
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  body: string,
): string {
  return `<g filter="url(#softShadow)">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${CATO.black}" stroke="${CATO.line}"/>
    ${textBlock(title, x + 14, y + 29, Math.floor((width - 28) / 8), 16, {
      fill: CATO.white,
      size: 13,
      weight: 800,
    })}
    ${textBlock(body, x + 14, y + 53, Math.floor((width - 28) / 7), 13, {
      fill: CATO.mist2,
      size: 10,
    })}
  </g>`;
}

function exchangeNode(
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  body: string,
  fill: string,
  textFill: string,
): string {
  const bodyFill = fill === CATO.green ? CATO.white : fill === CATO.mist ? "#43544D" : CATO.mist2;
  return `<g filter="url(#softShadow)">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${fill === CATO.green ? CATO.greenDark : CATO.line}" stroke-width="${fill === CATO.green ? 2 : 1}"/>
    ${textBlock(title, x + 18, y + 31, Math.floor((width - 36) / 8), 16, {
      fill: textFill,
      size: 13,
      weight: 900,
    })}
    ${textBlock(body, x + 18, y + 55, Math.floor((width - 36) / 7), 14, {
      fill: bodyFill,
      size: 10,
    })}
  </g>`;
}

function phaseColumn(
  title: string,
  subtitle: string,
  x: number,
  y: number,
  hooks: Hook[],
  hookIndex: Map<InspectionPoint, number>,
): string {
  const cards = hooks.length
    ? hooks
        .map((hook, index) =>
          hookCard(hook, hookIndex.get(hook.point) ?? index + 1, x, y + 74 + index * 100)
        )
        .join("\n")
    : mutedCard(x, y + 74, "No selected hook in this boundary");

  return `<g>
    <text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="900" fill="${CATO.green}">${escapeXml(title)}</text>
    <text x="${x}" y="${y + 20}" font-family="Inter, Arial, sans-serif" font-size="10" fill="${CATO.mist2}">${escapeXml(subtitle)}</text>
    ${cards}
  </g>`;
}

function hookCard(hook: Hook, index: number, x: number, y: number): string {
  return `<g filter="url(#softShadow)">
    <rect x="${x}" y="${y}" width="226" height="86" rx="8" fill="${CATO.mist}" stroke="${CATO.green}" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="8" height="86" rx="4" fill="${CATO.green}"/>
    <circle cx="${x + 29}" cy="${y + 28}" r="15" fill="${CATO.green}"/>
    <text x="${x + 29}" y="${y + 33}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="900" fill="${CATO.white}">${index}</text>
    ${textBlock(hook.diagramTitle, x + 54, y + 29, 21, 15, {
      fill: CATO.black,
      size: 13,
      weight: 900,
    })}
    ${textBlock(hook.diagramBody, x + 20, y + 56, 31, 13, {
      fill: "#43544D",
      size: 10,
    })}
  </g>`;
}

function mutedCard(x: number, y: number, label: string): string {
  return `<g>
    <rect x="${x}" y="${y}" width="226" height="76" rx="8" fill="${CATO.black}" stroke="${CATO.line}" stroke-dasharray="7 8"/>
    <text x="${x + 113}" y="${y + 43}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="${CATO.mist2}">${escapeXml(label)}</text>
  </g>`;
}

function arrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashed = false,
  stroke = CATO.green,
  marker = "arrow",
): string {
  const dash = dashed ? ' stroke-dasharray="7 8"' : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2"${dash} marker-end="url(#${marker})"/>`;
}

function textBlock(
  text: string,
  x: number,
  y: number,
  maxChars: number,
  lineHeight: number,
  options: {
    fill?: string;
    size?: number;
    weight?: number;
    maxLines?: number;
  } = {},
): string {
  const lines = wrapText(text, maxChars, options.maxLines);
  return linesToText(
    lines,
    x,
    y,
    lineHeight,
    options.fill ?? CATO.mist,
    options.size ?? 12,
    options.weight,
  );
}

function linesToText(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  fill: string,
  size: number,
  weight?: number,
): string {
  const weightAttr = weight ? ` font-weight="${weight}"` : "";
  return lines
    .map((line, index) => {
      return `<text x="${x}" y="${y + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="${size}"${weightAttr} fill="${fill}">${escapeXml(line)}</text>`;
    })
    .join("\n");
}

function wrapText(text: string, maxChars: number, maxLines?: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  if (maxLines && lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  return lines;
}

function sessionLabel(c: WizardConfig): string {
  if (c.sessionIdStrategy === "per_user") return "one id per user";
  if (c.sessionIdStrategy === "per_request") return "new id per request";
  return "one id per conversation";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
