# Project External Connections — API & Operations

> **Status:** the Next.js frontend is the **sole writer** of the
> `project_external_connections` table. The Python backend
> (`ai-ta-backend`) reads the same rows at runtime via its
> `ConnectionManager` to dispatch S3 / Qdrant / Postgres operations per
> project. There is no longer a backend CRUD surface for this resource.

This document is the reference for the API exposed by the frontend, the
authorization model, the storage shape, and the operational notes a
future super-admin UI will rely on.

---

## 1. Why this lives in the frontend

The previous Flask routes (`/api/project-connections/*`) had no
authentication, mixed read and write concerns inside the backend's
runtime resolver, and forced the UI to round-trip through two services.
Moving CRUD to Next.js:

- gives us a single super-admin authorization boundary;
- lets the backend stay a read-only consumer with a known schema;
- keeps the row format identical (encrypted JSONB), so the backend's
  `ConnectionManager` continues to work without code changes.

---

## 2. Endpoints

All endpoints live under `src/pages/api/UIUC-api/projectConnections*`
and are wrapped with `withSuperAdminOnly` — every request requires a
valid JWT **and** the caller's email must be in the super-admin list
(see §3). The role check runs **inside the handler wrapper**, not via
Next middleware (defense against CVE-2025-29927).

### `GET /api/UIUC-api/projectConnections?project_name=<name>`

Returns the row with secrets masked (`****<last-4-chars>`). Returns
`{ found: false, project_name }` if no row exists.

```json
{
  "found": true,
  "project_name": "demo",
  "is_active": true,
  "created_at": "...",
  "updated_at": "...",
  "s3_config": {
    "aws_access_key_id": "****ABCD",
    "aws_secret_access_key": "****CAFE",
    "bucket_name": "cropwizard-prod",
    "region": "us-east-2"
  },
  "database_config": null,
  "qdrant_config": null,
  "embedding_config": null
}
```

### `POST /api/UIUC-api/projectConnections`

Upsert one connection kind. The handler looks up `project_id` from the
`projects.course_name` column server-side; clients only supply
`project_name`.

```json
{
  "project_name": "demo",
  "kind": "s3" | "database" | "qdrant" | "embedding",
  "config": { ... see §4 ... }
}
```

Successful responses are `200 { success, project_name, project_id, kind }`.
`404` is returned if the project does not exist. Validation failures
return `400` with a Zod-shaped issue list.

### `DELETE /api/UIUC-api/projectConnections?project_name=<name>&kind=<kind>`

If `kind` is omitted, the row is deleted entirely. If `kind` is one of
`s3 | database | qdrant | embedding`, only that column is set to NULL.
Other columns are left intact.

### `PATCH /api/UIUC-api/projectConnections/active`

Toggles the `is_active` flag without losing stored configs. Body:

```json
{ "project_name": "demo", "is_active": false }
```

### `POST /api/UIUC-api/projectConnections/test`

Probes a candidate config **without persisting**. The same shape as
POST minus `project_name`. Returns:

```json
{ "ok": true }
// or
{ "ok": false, "code": "auth", "message": "Authentication rejected" }
```

`code` is one of `network | auth | not_found | tls | timeout | unknown`.
Upstream error bodies are never echoed. The probe enforces:

- TLS-only (`https://` for S3/Qdrant, `postgres://` for the DB URI).
- DNS resolution is checked; hosts that resolve to private,
  loopback, link-local, CGNAT, or cloud-metadata addresses are
  rejected before any outbound I/O.
- 5-second wall-clock timeout per probe.

---

## 3. Authorization model

The super-admin allowlist lives at `src/utils/superAdmins.ts`. The
effective list is the union of:

- the hardcoded entries in `HARDCODED_SUPER_ADMINS`;
- the `SUPER_ADMIN_EMAILS` env var (comma-separated, case-insensitive).

`isSuperAdmin(email)` is exported for both server and client use. The
server-side guard is `withSuperAdminOnly` in `src/utils/superAdminGuard.ts`.

When adding an admin in production:

1. Update `SUPER_ADMIN_EMAILS` on the deployment (no code change).
2. Restart the Next process so the new list is picked up.

The frontend never assumes a course-owner relationship — these
endpoints are intentionally **separate** from the existing
`withCourseOwnerOrAdminAccess()` middleware.

---

## 4. Storage shape

### Table — `project_external_connections`

| column             | type        | notes                                                                |
| ------------------ | ----------- | -------------------------------------------------------------------- |
| `id`               | bigserial   | PK                                                                   |
| `project_id`       | bigint      | FK → `projects(id)` ON DELETE CASCADE, unique                        |
| `project_name`     | text        | unique                                                               |
| `created_at`       | timestamptz | defaultNow()                                                         |
| `updated_at`       | timestamptz | bumped on every write                                                |
| `s3_config`        | jsonb       | encrypted envelope or NULL                                           |
| `database_config`  | jsonb       | encrypted envelope or NULL                                           |
| `qdrant_config`    | jsonb       | encrypted envelope or NULL — when present, embeddings live in Qdrant |
| `embedding_config` | jsonb       | encrypted envelope or NULL — per-project embedding-model override    |
| `is_active`        | boolean     | when false, the backend ignores overrides and falls back to defaults |

### Vector / docs routing precedence

Routing decisions, in order:

1. `qdrant_config` present (active) → vector lives in external Qdrant.
2. Else → vector lives in pgvector. `database_config` present (active) means
   the **same external Postgres** stores both documents AND embeddings.
3. No overrides → host Postgres (with pgvector) for both.

There is no `VECTOR_ENGINE` environment switch — the row alone decides.

### Migration journal — hand-written SQL vs. generated snapshots

**Every migration IS tracked in `meta/_journal.json`** — currently `0000`
through `0010`, with no gaps. (An earlier version of this document claimed
`0001`/`0006`/`0007`/`0009` were untracked and that "the journal stops at
`0008`". That was wrong, and it led to an applied migration being hand-edited.
Corrected 2026-07-17.)

The real distinction is **snapshots**, not the journal. Three migrations are
hand-written SQL added to the journal without a generated snapshot file:

| Migration                 | Journal | Snapshot | Contents                                   |
| ------------------------- | ------- | -------- | ------------------------------------------ |
| `0001_custom_functions`   | ✅      | ❌       | plpgsql functions                          |
| `0006_pgvector_extension` | ✅      | ❌       | `CREATE EXTENSION vector`                  |
| `0007_embeddings_table`   | ✅      | ❌       | `embeddings` table + its btree/gin indexes |

The snapshot chain resumes at `0008`, and because `embeddings` is declared in
`src/db/schema.ts`, it **is** captured in the `0008`/`0009`/`0010` snapshots.

**Consequences — read before changing the schema:**

- For anything declared in `schema.ts` (including `embeddings`), change
  `schema.ts` and run `npx drizzle-kit generate --name <desc>`. It diffs against
  the newest snapshot and emits the migration, snapshot, and journal entry
  together. `0010_embeddings_hnsw_index` was produced this way.
- **Never hand-edit an already-applied migration.** Drizzle records applied
  migrations by file hash, so an edit is silently skipped on any database that
  already ran it — the change never lands, and history stops describing reality.
  Add a new migration instead.
- Objects that exist in the database but not in `schema.ts` — the plpgsql
  functions, triggers, the `vector` extension, and the btree/gin indexes on
  `embeddings` — are invisible to `generate` (it diffs against the snapshot, not
  the live database, so it will never try to drop them). But if you later declare
  one of them in `schema.ts`, `generate` will emit a `CREATE` for an object that
  already exists; add `IF NOT EXISTS` to that generated statement before applying.
- The same applies when an index was built out-of-band (e.g. `CREATE INDEX
CONCURRENTLY` on a large table, or via the external provisioning script).
  `0010` carries a hand-added `IF NOT EXISTS` for exactly this reason.

When provisioning a new database (host OR per-project external pg),
apply ALL `*.sql` files under `src/db/migrations/` in numeric order
manually, not via `drizzle-kit migrate`.

### Encrypted envelope

Each `*_config` JSONB column stores:

```json
{ "encrypted": "v1.<base64-ciphertext+tag>.<base64-iv>" }
```

- Algorithm: AES-256-GCM.
- Key derivation: SHA-256 of `ENCRYPTION_MASTER_KEY`.
- Web Crypto and Python `cryptography` produce a compatible
  `ciphertext || tag` layout; both languages can read either side's
  output. See `src/utils/crypto.ts` and
  `ai_ta_backend/utils/crypto.py`.

### Plaintext shapes (post-decrypt)

```ts
type S3OverrideConfig = {
  aws_access_key_id: string
  aws_secret_access_key: string
  bucket_name?: string
  endpoint_url?: string
  region?: string
}

type DatabaseOverrideConfig = {
  connection_uri: string
}

type QdrantOverrideConfig = {
  url: string
  api_key: string
  port: number
  https?: boolean
  default_collection: string
  // Optional read-side fan-out. Each entry is an object — the backend
  // consumes `name`, `top_n?`, `use_filter?`, `processor?`. See
  // ai_ta_backend/database/vector.py `_multi_collection_search`.
  collections?: Array
  parallel?: boolean
}
```

Zod validators are in `src/utils/projectConnections/validation.ts`.

---

## 5. Audit log

Every mutation writes a row to `project_connection_audit_log`:

| field            | meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `occurred_at`    | timestamptz, defaults to `now()`                                                       |
| `actor_email`    | from the verified JWT                                                                  |
| `action`         | `upsert` \| `delete` \| `set_active` \| `test`                                         |
| `project_name`   | target project, or NULL for `/test` probes (which happen before a project is selected) |
| `kind`           | `s3` \| `database` \| `qdrant` \| NULL                                                 |
| `outcome`        | `success` \| `failure`                                                                 |
| `failure_reason` | short reason code; never an upstream error body                                        |
| `changed_fields` | **field NAMES only** — never values. Helpful for "who rotated what when?"              |
| `source_ip`      | `X-Forwarded-For` first hop, else socket peer                                          |
| `user_agent`     | request header                                                                         |
| `request_id`     | `X-Request-Id` or `X-Correlation-Id` if present                                        |

Operational rule: **do not grant `UPDATE` or `DELETE` to the application
role on this table.** Treat it as append-only.

---

## 6. Cache invalidation

Every mutating endpoint calls `connectionManager.invalidate(projectName)`
after a successful write. That drops in-process client caches and the
Redis config cache on the frontend.

The **backend's** `ConnectionManager` has its own 5-minute TTL cache
that is not invalidated cross-service. Two consequences:

- During the window, the backend may still serve responses using stale
  config.
- A cross-service Redis pub/sub channel is the intended follow-up (see
  the plan; out of scope for this PR).

If a faster cutover is needed during ops, restart the backend pod.

---

## 7. How the backend reads this

Backend reads use SQLAlchemy ORM on the `ProjectExternalConnection` model
mirrored in `ai_ta_backend/rabbitmq/models.py`. The reads decrypt each
JSONB column with the same `ENCRYPTION_MASTER_KEY`. See:

- `ai_ta_backend/database/sql.py:getExternalConnection`
- `ai_ta_backend/rabbitmq/rmsql.py:getExternalConnection`
- `ai_ta_backend/database/connection_manager.py`
- `ai_ta_backend/rabbitmq/connection_resolver.py`

The backend never writes to this table after the migration documented in
this file. Do not re-add CRUD endpoints there.
