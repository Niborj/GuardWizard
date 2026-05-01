# Cato Networks API Guard Wizard

A Cato Networks branded wizard for Sales Engineers who need to generate customer-ready API Guard integration kits for homegrown AI applications.

The app walks an SE through the customer's language, model provider, architecture, inspection points, action policy, failure mode, and session strategy. It then generates a zip kit with:

- A reusable Cato API Guard client for Python, Node.js, or TypeScript
- Framework-specific integration examples for direct SDK, LangChain, and LangGraph paths
- Generic HTTP/curl guidance for Java, C#, Go, Rust, Ruby, PHP, and custom stacks
- A downloadable Cato-branded architecture SVG showing where to instrument the customer code
- A non-developer runbook with placement guidance for unfamiliar customer codebases
- A basic curl test for validating the Guard before customer-code changes
- A smoke-test script that calls `POST https://api.aisec.catonetworks.com/fw/v1/analyze`

## Local Development

```bash
npm install
npm run dev
```

The Vite dev server includes a same-origin proxy at `/api/cato/analyze` so the in-app live test can call Cato without browser CORS failures.

## Production Preview

```bash
npm run preview
```

`npm run preview` builds the app and serves `dist/` through `server.mjs`, which also provides the `/api/cato/analyze` proxy used by the live-test step. A static-only host will still render the wizard, but the in-app live test requires this server/proxy path.

## Guard Key Handling

Guard keys are never committed or bundled into generated kits. The live-test step sends the key only to the same-origin wizard proxy, which forwards it to Cato in the `Authorization: Bearer <guard_key>` header and does not store it.

Generated customer code reads the guard key from an environment variable, defaulting to `CATO_GUARD_KEY`, and each generated runbook instructs customers to store the key in their own secret manager.

## Verification

```bash
npm run lint
npm run build
```

## Branding

The UI, app metadata, favicon, and bundled SVG symbols use Cato Networks API Guard branding. The core palette is Cato green `#158864`, near-black `#231F20`, and white/off-white surfaces, matching the official SVG icon bundle from the Cato Learning Center article “Cato Networks Stencils and Icons.”
