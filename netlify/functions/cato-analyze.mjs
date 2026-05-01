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

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function buildUpstreamHint(status) {
  if (status === 404) {
    return "Cato returned 404 for the configured endpoint. Confirm the endpoint on the Guard details page. API Guards normally use https://api.aisec.catonetworks.com/fw/v1/analyze unless Cato shows a regional endpoint.";
  }
  return "Cato returned a non-JSON response. Confirm the endpoint, Guard type, and network path.";
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { detail: "Method not allowed." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { detail: "Invalid JSON." });
  }

  const endpoint = String(body.endpoint || "");
  const guardKey = String(body.guardKey || "");
  const sessionId = String(body.sessionId || "");
  const messages = body.messages;

  if (!isAllowedCatoEndpoint(endpoint)) {
    return jsonResponse(400, {
      detail: "Endpoint must be a Cato API Guard analyze endpoint.",
    });
  }
  if (!guardKey) {
    return jsonResponse(400, { detail: "Guard key is required." });
  }
  if (!Array.isArray(messages)) {
    return jsonResponse(400, { detail: "Messages must be an array." });
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
      return {
        statusCode: upstream.status,
        headers: {
          "Content-Type": contentType || "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
        body: text,
      };
    }
    return jsonResponse(upstream.status, {
      detail: `Cato returned a non-JSON response (${upstream.status}).`,
      hint: buildUpstreamHint(upstream.status),
      upstreamStatus: upstream.status,
      upstreamContentType: contentType || "unknown",
      bodyPreview: text.replace(/\s+/g, " ").slice(0, 300),
    });
  } catch (error) {
    return jsonResponse(502, {
      detail: error instanceof Error ? error.message : "Unable to reach Cato API Guard.",
    });
  } finally {
    clearTimeout(timer);
  }
}
