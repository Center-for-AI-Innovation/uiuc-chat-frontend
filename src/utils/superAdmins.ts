// Hardcoded super admins. Additional addresses may be added at deploy time
// via the SUPER_ADMIN_EMAILS env var (comma-separated). The union of the two
// is what `isSuperAdmin` checks against.
const HARDCODED_SUPER_ADMINS = ['rohan13@illinois.edu'] as const

function envSuperAdmins(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

// Effective super-admin list (hardcoded ∪ env, lowercased, deduped). Exported
// so the existing course-admin UI in EmailListAccordion keeps working without
// changes.
export const superAdmins: string[] = Array.from(
  new Set([
    ...HARDCODED_SUPER_ADMINS.map((e) => e.toLowerCase()),
    ...envSuperAdmins(),
  ]),
)

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false
  return superAdmins.includes(email.toLowerCase())
}
