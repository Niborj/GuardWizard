import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

function isAllowedCatoEndpoint(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname === "/fw/v1/analyze" &&
      (url.hostname === "api.aisec.catonetworks.com" ||
        url.hostname.endsWith(".aisec.catonetworks.com"))
    );
  } catch {
    return false;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function buildUpstreamHint(status) {
  if (status === 404) {
    return "Cato returned 404 for the configured endpoint. Confirm the endpoint on the Guard details page. API Guards normally use https://api.aisec.catonetworks.com/fw/v1/analyze unless Cato shows a regional endpoint.";
  }
  return "Cato returned a non-JSON response. Confirm the endpoint, Guard type, and network path.";
}

async function readJsonBody(req, maxBytes = 1_000_000) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBytes) {
      throw new Error("Request body is too large.");
    }
  }
  return JSON.parse(body || "{}");
}

async function handleCatoAnalyze(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { detail: "Method not allowed." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { detail: error instanceof Error ? error.message : "Invalid JSON." });
    return;
  }

  const endpoint = String(body.endpoint || "");
  const guardKey = String(body.guardKey || "");
  const sessionId = String(body.sessionId || "");
  const messages = body.messages;

  if (!isAllowedCatoEndpoint(endpoint)) {
    sendJson(res, 400, { detail: "Endpoint must be a Cato API Guard analyze endpoint." });
    return;
  }
  if (!guardKey) {
    sendJson(res, 400, { detail: "Guard key is required." });
    return;
  }
  if (!Array.isArray(messages)) {
    sendJson(res, 400, { detail: "Messages must be an array." });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guardKey}`,
        ...(sessionId ? { "x-cato-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.toLowerCase().includes("json")) {
      res.writeHead(upstream.status, {
        "Content-Type": contentType || "application/json; charset=utf-8",
      });
      res.end(text);
      return;
    }
    sendJson(res, upstream.status, {
      detail: `Cato returned a non-JSON response (${upstream.status}).`,
      hint: buildUpstreamHint(upstream.status),
      upstreamStatus: upstream.status,
      upstreamContentType: contentType || "unknown",
      bodyPreview: text.replace(/\s+/g, " ").slice(0, 300),
    });
  } catch (error) {
    sendJson(res, 502, {
      detail: error instanceof Error ? error.message : "Unable to reach Cato API Guard.",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(distDir, `.${requestedPath}`);

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { detail: "Forbidden." });
    return;
  }

  const fallbackPath = path.join(distDir, "index.html");
  const pathToRead = existsSync(filePath) ? filePath : fallbackPath;
  const ext = path.extname(pathToRead);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const data = await readFile(pathToRead);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    if (requestUrl.pathname === "/api/cato/analyze") {
      await handleCatoAnalyze(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, {
      detail: error instanceof Error ? error.message : "Internal server error.",
    });
  }
});

server.listen(port, () => {
  console.log(`Cato API Guard Wizard listening on http://localhost:${port}`);
});
