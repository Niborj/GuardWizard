import type { WizardConfig } from "../types";
import { generatePython } from "./python";
import { generateNode } from "./node";
import { generateGeneric } from "./generic";
import { generateRunbook } from "./runbook";
import { generateArchitectureMarkdown, generateArchitectureSvg } from "./architecture";
import { generateBasicCurlMarkdown, generateBasicCurlScript } from "./basicTest";

export interface GeneratedFile {
  path: string;
  language: string;
  content: string;
  description: string;
}

export interface GeneratedKit {
  files: GeneratedFile[];
  runbook: string;
  primaryFile: string;
}

export function generateKit(config: WizardConfig): GeneratedKit {
  let files: GeneratedFile[];
  let primaryFile: string;

  if (config.language === "python") {
    const out = generatePython(config);
    files = out.files;
    primaryFile = out.primary;
  } else if (config.language === "node" || config.language === "typescript") {
    const out = generateNode(config);
    files = out.files;
    primaryFile = out.primary;
  } else {
    const out = generateGeneric(config);
    files = out.files;
    primaryFile = out.primary;
  }

  files.push(
    {
      path: "BASIC_CURL_TEST.md",
      language: "markdown",
      content: generateBasicCurlMarkdown(config),
      description:
        "Copy-paste curl test for validating the Guard key, endpoint, and policy before touching customer code.",
    },
    {
      path: "basic-curl-test.sh",
      language: "bash",
      content: generateBasicCurlScript(config),
      description:
        "Runnable curl smoke test that reads the Guard key from the configured environment variable.",
    },
    {
      path: "ARCHITECTURE.svg",
      language: "svg",
      content: generateArchitectureSvg(config),
      description:
        "Downloadable Cato-branded visual diagram showing hook placement and the Cato AI firewall request/response exchange.",
    },
    {
      path: "ARCHITECTURE.md",
      language: "markdown",
      content: generateArchitectureMarkdown(config),
      description:
        "Architecture handoff notes, instrumentation map, and placement guide for unfamiliar customer codebases.",
    },
  );

  const runbook = generateRunbook(config, files);
  files.push({
    path: "RUNBOOK.md",
    language: "markdown",
    content: runbook,
    description: "Step-by-step instructions for installing and verifying the integration. Hand this to the customer alongside the code.",
  });

  return { files, runbook, primaryFile };
}
