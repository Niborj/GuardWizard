import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cato-api-guard-proxy',
      configureServer(server) {
        server.middlewares.use('/api/cato/analyze', async (req, res) => {
          await handleCatoAnalyze(req, res)
        })
      },
    },
  ],
})

function isAllowedCatoEndpoint(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.pathname === '/fw/v1/analyze' &&
      (url.hostname === 'api.aisec.catonetworks.com' ||
        url.hostname.endsWith('.aisec.catonetworks.com'))
    )
  } catch {
    return false
  }
}

async function readJsonBody(req: IncomingMessage, maxBytes = 1_000_000) {
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (Buffer.byteLength(body) > maxBytes) {
      throw new Error('Request body is too large.')
    }
  }
  return JSON.parse(body || '{}') as {
    endpoint?: unknown
    guardKey?: unknown
    sessionId?: unknown
    messages?: unknown
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function handleCatoAnalyze(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { detail: 'Method not allowed.' })
    return
  }

  let body: Awaited<ReturnType<typeof readJsonBody>>
  try {
    body = await readJsonBody(req)
  } catch (error) {
    sendJson(res, 400, {
      detail: error instanceof Error ? error.message : 'Invalid JSON.',
    })
    return
  }

  const endpoint = String(body.endpoint || '')
  const guardKey = String(body.guardKey || '')
  const sessionId = String(body.sessionId || '')

  if (!isAllowedCatoEndpoint(endpoint)) {
    sendJson(res, 400, { detail: 'Endpoint must be a Cato API Guard analyze endpoint.' })
    return
  }
  if (!guardKey) {
    sendJson(res, 400, { detail: 'Guard key is required.' })
    return
  }
  if (!Array.isArray(body.messages)) {
    sendJson(res, 400, { detail: 'Messages must be an array.' })
    return
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guardKey}`,
        ...(sessionId ? { 'x-cato-session-id': sessionId } : {}),
      },
      body: JSON.stringify({ messages: body.messages }),
      signal: controller.signal,
    })
    const text = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    })
    res.end(text)
  } catch (error) {
    sendJson(res, 502, {
      detail: error instanceof Error ? error.message : 'Unable to reach Cato API Guard.',
    })
  } finally {
    clearTimeout(timer)
  }
}
