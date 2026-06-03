// Server-side connection-test helpers used by /api/UIUC-api/projectConnections/test.
//
// SSRF posture:
//   - URLs are parsed and the scheme validated up front.
//   - For S3 we require https unless the host is explicitly localhost
//     (developer escape hatch).
//   - For Qdrant, the URL's scheme is authoritative (matches qdrant-client
//     semantics in both Python and JS). Plain HTTP is allowed because in-VPC
//     Qdrant deployments commonly run on HTTP behind an SG allowlist; we log
//     a visible warning when that path is taken.
//   - Every hostname is DNS-resolved; resolution to RFC1918 / loopback /
//     link-local / cloud-metadata addresses is rejected before any outbound
//     I/O.
//   - For S3 (with custom endpoint) and Postgres, the resolved IP is pinned
//     so the SDK cannot re-resolve to a different (private) address after
//     the vetting check (DNS-rebinding defense). For Qdrant, the underlying
//     undici fetch does not expose an agent hook in 1.9, so we rely on
//     all-address vetting + the short 5-second timeout; the residual TOCTOU
//     window is bounded by the OS DNS cache TTL.
//   - All probes run with a 5-second wall-clock timeout AND a cancellation
//     hook (AbortController for S3, sql.end({timeout:0}) for Postgres,
//     Qdrant's built-in timeout).
//   - Error responses use a fixed taxonomy and never echo upstream bodies.

import dns from 'node:dns'
import https from 'node:https'
import net from 'node:net'
import {
  S3Client,
  HeadBucketCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { QdrantClient } from '@qdrant/js-client-rest'
import postgres from 'postgres'
import {
  buildQdrantUrl,
  type S3OverrideConfig,
  type DatabaseOverrideConfig,
  type QdrantOverrideConfig,
} from '~/utils/connectionManager'
import {
  EMBEDDING_PROVIDERS,
  type EmbeddingOverrideConfig,
} from '~/utils/projectConnections/validation'

const PROBE_TIMEOUT_MS = 5_000

export type TestErrorCode =
  | 'network'
  | 'auth'
  | 'not_found'
  | 'tls'
  | 'timeout'
  | 'unknown'

export interface TestResult {
  ok: boolean
  code?: TestErrorCode
  message?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isPrivateIpv4(ip: string): boolean {
  // RFC1918 + loopback + link-local + metadata + 0.0.0.0/8 + CGNAT.
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false
  const [a, b] = parts as [number, number, number, number]
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true // link-local + 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  return false
}

// Extract the embedded IPv4 from an IPv4-mapped IPv6 like
// `::ffff:10.0.0.1` or `::ffff:0:10.0.0.1`. Returns null if not mapped.
function extractMappedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase()
  const m = lower.match(/^::ffff:(?:0:)?([0-9.]+)$/)
  const candidate = m?.[1]
  if (candidate && net.isIP(candidate) === 4) return candidate
  return null
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1') return true
  if (lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
  if (lower.startsWith('fe80:')) return true // link-local
  // IPv4-mapped IPv6 — route through the IPv4 check.
  const mapped = extractMappedIpv4(ip)
  if (mapped) return isPrivateIpv4(mapped)
  return false
}

function isPrivateAddress(addr: string, family: number): boolean {
  if (family === 4) return isPrivateIpv4(addr)
  if (family === 6) {
    if (isPrivateIpv6(addr)) return true
    // Some resolvers report `::ffff:10.0.0.1` with family=6; the above
    // already handles that, but be defensive if family is mis-reported.
    const mapped = extractMappedIpv4(addr)
    if (mapped) return isPrivateIpv4(mapped)
  }
  return false
}

async function assertPublicHost(host: string): Promise<dns.LookupAddress[]> {
  if (!host) throw new TestError('network', 'Empty hostname')
  // If the host is already an IP literal, check it directly.
  const ipFamily = net.isIP(host)
  if (ipFamily) {
    if (isPrivateAddress(host, ipFamily)) {
      throw new TestError(
        'network',
        'Refusing to connect to a private / loopback / link-local address.',
      )
    }
    return [{ address: host, family: ipFamily }]
  }
  // Allow localhost only as an explicit dev-mode escape hatch.
  if (host === 'localhost') {
    throw new TestError(
      'network',
      'Refusing to connect to localhost from a server-side probe.',
    )
  }
  let addrs: dns.LookupAddress[]
  try {
    addrs = await dns.promises.lookup(host, { all: true, verbatim: true })
  } catch {
    throw new TestError('network', `DNS lookup failed for host: ${host}`)
  }
  if (addrs.length === 0) {
    throw new TestError('network', `DNS returned no addresses for: ${host}`)
  }
  for (const a of addrs) {
    if (isPrivateAddress(a.address, a.family)) {
      throw new TestError(
        'network',
        `Hostname ${host} resolves to a private / loopback / link-local address.`,
      )
    }
  }
  return addrs
}

class TestError extends Error {
  constructor(public code: TestErrorCode, message: string) {
    super(message)
  }
}

// Build a `lookup` callback compatible with `https.Agent`'s lookup option that
// only returns from the pre-vetted address list. Re-runs the private-IP check
// inside the callback as a belt-and-suspenders defence against unexpected
// hostnames being routed through this Agent.
function makePinnedLookup(
  expectedHost: string,
  vetted: dns.LookupAddress[],
): NonNullable<https.AgentOptions['lookup']> {
  return (hostname, _opts, callback) => {
    if (hostname !== expectedHost) {
      callback(
        new Error(
          `Unexpected DNS lookup for ${hostname} (only ${expectedHost} is allowed)`,
        ) as NodeJS.ErrnoException,
        '',
        0,
      )
      return
    }
    // Prefer the first vetted address; refuse if for some reason it is now
    // private (shouldn't happen — we already vetted — but defensive).
    const a = vetted[0]
    if (!a || isPrivateAddress(a.address, a.family)) {
      callback(
        new Error(
          'No public address available after vetting',
        ) as NodeJS.ErrnoException,
        '',
        0,
      )
      return
    }
    callback(null, a.address, a.family)
  }
}

// Replace the host portion of a URL with a literal IP, leaving everything
// else (scheme, port, path, auth) untouched. Used to pin Postgres URIs.
function substituteHostInUrl(urlStr: string, ip: string, family: number): string {
  const u = new URL(urlStr)
  u.hostname = family === 6 ? `[${ip}]` : ip
  return u.toString()
}

// Race a promise against a timeout, calling `onTimeout` (if supplied) to
// actively cancel the underlying work. The caller MUST hook `onTimeout`
// to a real cancellation primitive (AbortController.abort, sql.end({timeout:0}),
// etc.) — without it, the work continues to run in the background after we
// return.
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      try {
        onTimeout?.()
      } catch {
        // best-effort
      }
      reject(new TestError('timeout', `Probe exceeded ${ms}ms timeout`))
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

function classifyUnknown(e: unknown): TestResult {
  if (e instanceof TestError) {
    // Surface the underlying message server-side so operators can debug
    // without secret leakage (TestError messages are authored here).
    console.warn(
      `[projectConnections/tester] classified error: code=${e.code} message=${e.message}`,
    )
    return { ok: false, code: e.code, message: e.message }
  }
  const rawMsg = e instanceof Error ? e.message : String(e)
  const errName = e instanceof Error ? e.name : 'non-Error'
  const cause = e instanceof Error ? (e as Error & { cause?: unknown }).cause : undefined
  const causeMsg =
    cause instanceof Error
      ? cause.message
      : typeof cause === 'string'
        ? cause
        : ''
  const errno = (e as { code?: string } | undefined)?.code
  // Log the raw upstream error so operators can see what actually failed.
  // The user-facing response keeps a sanitized code/message — secrets in
  // upstream errors (e.g. presigned URLs, connection strings) never leave
  // the server.
  console.warn(
    `[projectConnections/tester] upstream error name=${errName} errno=${errno ?? '(none)'} msg=${rawMsg}${causeMsg ? ` cause=${causeMsg}` : ''}`,
  )
  // Include the Error name in the classification haystack — Qdrant's client
  // throws `QdrantClientTimeoutError` with the bland message "This operation
  // was aborted", which on its own matches none of the patterns below.
  const lower = `${errName} ${rawMsg} ${causeMsg} ${errno ?? ''}`.toLowerCase()
  if (lower.includes('cert') || lower.includes('tls') || lower.includes('ssl')) {
    return { ok: false, code: 'tls', message: 'TLS/certificate error' }
  }
  if (
    lower.includes('forbidden') ||
    lower.includes('unauthorized') ||
    lower.includes('access denied') ||
    lower.includes('invalidaccesskey') ||
    lower.includes('signaturedoesnotmatch') ||
    lower.includes('password authentication failed')
  ) {
    return { ok: false, code: 'auth', message: 'Authentication rejected' }
  }
  if (lower.includes('not found') || lower.includes('nosuchbucket')) {
    return { ok: false, code: 'not_found', message: 'Resource not found' }
  }
  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('aborted') ||
    lower.includes('etimedout')
  ) {
    return { ok: false, code: 'timeout', message: 'Probe timed out' }
  }
  if (
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('eai_again') ||
    lower.includes('epipe') ||
    lower.includes('eproto') ||
    lower.includes('fetch failed') ||
    lower.includes('socket hang up') ||
    lower.includes('network')
  ) {
    return { ok: false, code: 'network', message: 'Network error' }
  }
  // Default — do not echo the upstream message.
  return { ok: false, code: 'unknown', message: 'Probe failed' }
}

// ---------------------------------------------------------------------------
// S3
// ---------------------------------------------------------------------------

export async function testS3(cfg: S3OverrideConfig): Promise<TestResult> {
  const controller = new AbortController()
  try {
    let requestHandler: NodeHttpHandler | undefined
    if (cfg.endpoint_url) {
      const u = new URL(cfg.endpoint_url)
      if (u.protocol !== 'https:') {
        throw new TestError('tls', 'S3 endpoint_url must use https://')
      }
      const vetted = await assertPublicHost(u.hostname)
      // Pin DNS: build an Agent whose `lookup` returns only the vetted IP.
      const httpsAgent = new https.Agent({
        keepAlive: false,
        lookup: makePinnedLookup(u.hostname, vetted),
      })
      requestHandler = new NodeHttpHandler({
        httpsAgent,
        connectionTimeout: PROBE_TIMEOUT_MS,
        requestTimeout: PROBE_TIMEOUT_MS,
      })
    }
    // For AWS-hosted endpoints we don't have a host string to vet (the SDK
    // computes it from region); rely on AWS's public service hostnames.

    const region = cfg.region ?? 'us-east-1'
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: cfg.aws_access_key_id,
        secretAccessKey: cfg.aws_secret_access_key,
      },
      ...(cfg.endpoint_url
        ? { endpoint: cfg.endpoint_url, forcePathStyle: true }
        : {}),
      ...(requestHandler ? { requestHandler } : {}),
      maxAttempts: 1,
    })

    const send = cfg.bucket_name
      ? client.send(new HeadBucketCommand({ Bucket: cfg.bucket_name }), {
          abortSignal: controller.signal,
        })
      : client.send(new ListBucketsCommand({}), {
          abortSignal: controller.signal,
        })
    await withTimeout(send, PROBE_TIMEOUT_MS, () => controller.abort())
    client.destroy()
    return { ok: true }
  } catch (e) {
    controller.abort()
    return classifyUnknown(e)
  }
}

// ---------------------------------------------------------------------------
// Qdrant
// ---------------------------------------------------------------------------

export async function testQdrant(
  cfg: QdrantOverrideConfig,
): Promise<TestResult> {
  try {
    // The URL's scheme is the source of truth — see `buildQdrantUrl` for
    // the rationale. We previously rejected `http://` unless an `https:
    // false` escape hatch was set; that field is gone and so is the
    // pre-check. SSRF protection (assertPublicHost) and the 5s timeout
    // still apply.
    const effectiveUrl = buildQdrantUrl(cfg)
    const u = new URL(effectiveUrl)
    await assertPublicHost(u.hostname)
    if (u.protocol === 'http:') {
      // Visible warning so operators don't store a plaintext config without
      // realizing the api-key will cross any intermediate network in the
      // clear. Not blocking — production has historically used plain HTTP
      // for in-VPC Qdrant deployments.
      console.warn(
        `[projectConnections/tester] qdrant probe target is plain HTTP — api-key crosses the network in cleartext. host=${u.hostname}`,
      )
    }

    // QdrantClient (JS, ≥ 1.9) takes `timeout` in MILLISECONDS — verified in
    // node_modules/@qdrant/js-client-rest/.../api-client.js:30, where the
    // value is passed directly to `setTimeout`. This contradicts the Python
    // client (which uses seconds) and the README, but the source is the
    // source. Pass PROBE_TIMEOUT_MS as-is; `withTimeout` is kept as defence
    // in depth in case future versions silently change units again.
    const client = new QdrantClient({
      url: effectiveUrl,
      apiKey: cfg.api_key,
      timeout: PROBE_TIMEOUT_MS,
    })
    await withTimeout(client.getCollections(), PROBE_TIMEOUT_MS)
    return { ok: true }
  } catch (e) {
    return classifyUnknown(e)
  }
}

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------

export async function testDatabase(
  cfg: DatabaseOverrideConfig,
): Promise<TestResult> {
  let sql: ReturnType<typeof postgres> | null = null
  try {
    const u = new URL(cfg.connection_uri)
    if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') {
      throw new TestError('network', 'connection_uri must use postgres://')
    }
    const vetted = await assertPublicHost(u.hostname)
    // Pin DNS by replacing the hostname with the literal vetted IP. The
    // postgres library will pass this string straight to Node's net layer,
    // which will not re-resolve. SNI for TLS will use the IP — acceptable
    // because the typical postgres deployment doesn't rely on hostname
    // verification (sslmode=require validates cert chain but not hostname).
    const first = vetted[0]
    const pinnedUri =
      !first || net.isIP(u.hostname) || u.hostname === 'localhost'
        ? cfg.connection_uri
        : substituteHostInUrl(cfg.connection_uri, first.address, first.family)
    sql = postgres(pinnedUri, {
      max: 1,
      connect_timeout: 5,
      idle_timeout: 1,
      max_lifetime: 5,
      onnotice: () => {},
    })
    // On timeout, slam the pool shut so the pending `select 1` rejects and
    // any open socket is closed immediately rather than draining at idle.
    const queryPromise = sql`select 1` as unknown as Promise<unknown>
    await withTimeout(queryPromise, PROBE_TIMEOUT_MS, () => {
      sql?.end({ timeout: 0 }).catch(() => {})
    })
    return { ok: true }
  } catch (e) {
    return classifyUnknown(e)
  } finally {
    if (sql) {
      try {
        await sql.end({ timeout: 1 })
      } catch {
        // ignore
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

// Live probe for an embedding provider configuration. Same SSRF posture as
// `testQdrant` (assertPublicHost + 5s timeout). Mirrors the backend HTTP
// shapes:
//   - Ollama:  GET ${base_url}/api/tags                 (auth not required)
//   - OpenAI:  GET ${api_base or default}/models        (Bearer api_key)
// We deliberately do NOT issue an actual embedding request here — `/models`
// and `/api/tags` are the cheapest authoritative endpoints to confirm the
// host is reachable and (for OpenAI) that the api_key is valid.
export async function testEmbedding(
  cfg: EmbeddingOverrideConfig,
): Promise<TestResult> {
  if (!(EMBEDDING_PROVIDERS as readonly string[]).includes(cfg.provider)) {
    return {
      ok: false,
      code: 'auth',
      message: `Unsupported embedding provider '${cfg.provider}'. Allowed: ${(EMBEDDING_PROVIDERS as readonly string[]).join(', ')}`,
    }
  }

  const controller = new AbortController()
  try {
    let probeUrl: string
    const headers: Record<string, string> = {}

    if (cfg.provider === 'ollama') {
      if (!cfg.base_url) {
        return {
          ok: false,
          code: 'unknown',
          message: "base_url is required when provider is 'ollama'",
        }
      }
      const u = new URL(cfg.base_url)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new TestError('tls', 'Ollama base_url must use http:// or https://')
      }
      await assertPublicHost(u.hostname)
      probeUrl = new URL('/api/tags', u).toString()
    } else {
      // openai (or any future OpenAI-compatible provider)
      const apiBase =
        cfg.api_base ||
        process.env.EMBEDDING_API_BASE ||
        'https://api.openai.com/v1'
      const apiKey =
        cfg.api_key ||
        process.env.OPENAI_API_KEY ||
        process.env.NCSA_HOSTED_API_KEY
      if (!apiKey) {
        return {
          ok: false,
          code: 'auth',
          message: 'No api_key supplied and OPENAI_API_KEY is not set',
        }
      }
      const u = new URL(apiBase)
      if (u.protocol !== 'https:' && u.hostname !== 'localhost') {
        throw new TestError('tls', 'api_base must use https://')
      }
      if (u.hostname !== 'localhost') await assertPublicHost(u.hostname)
      probeUrl = new URL('models', apiBase.endsWith('/') ? apiBase : apiBase + '/').toString()
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const fetchPromise = fetch(probeUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })
    const res = await withTimeout(fetchPromise, PROBE_TIMEOUT_MS, () =>
      controller.abort(),
    )
    if (res.status === 401 || res.status === 403) {
      return { ok: false, code: 'auth', message: 'Authentication rejected' }
    }
    if (res.status === 404) {
      return { ok: false, code: 'not_found', message: 'Probe endpoint not found' }
    }
    if (!res.ok) {
      return { ok: false, code: 'unknown', message: `Probe returned HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    controller.abort()
    return classifyUnknown(e)
  }
}
