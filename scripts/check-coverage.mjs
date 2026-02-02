import fs from 'node:fs'

/**
 * @typedef {{ file: string; lf: number; lh: number }} LcovFile
 */

/**
 * @param {string} text
 * @returns {LcovFile[]}
 */
function parseLcov(text) {
  const records = text.split('end_of_record\n').filter(Boolean)
  /** @type {LcovFile[]} */
  const perFile = []

  for (const rec of records) {
    const lines = rec.trim().split('\n')
    const sf = lines.find((l) => l.startsWith('SF:'))?.slice(3)
    if (!sf) continue
    let lf = 0
    let lh = 0
    for (const l of lines) {
      if (l.startsWith('LF:')) lf = Number(l.slice(3))
      if (l.startsWith('LH:')) lh = Number(l.slice(3))
    }
    perFile.push({ file: sf, lf, lh })
  }
  return perFile
}

/**
 * @param {LcovFile[]} perFile
 * @param {string} prefix
 * @returns {{ lh: number; lf: number; pct: number }}
 */
function sumPrefix(perFile, prefix) {
  let lf = 0
  let lh = 0
  for (const f of perFile) {
    if (!f.file.startsWith(prefix)) continue
    lf += f.lf
    lh += f.lh
  }
  const pct = lf === 0 ? 100 : (lh / lf) * 100
  return { lh, lf, pct }
}

/**
 * @param {number} p
 */
function formatPct(p) {
  return `${p.toFixed(2)}%`
}

const lcovPath = 'coverage/lcov.info'
if (!fs.existsSync(lcovPath)) {
  console.error(`Missing ${lcovPath}. Run \`npm run test:coverage\` first.`)
  process.exit(2)
}

const perFile = parseLcov(fs.readFileSync(lcovPath, 'utf8'))

const buckets = [
  { name: 'src/utils', prefix: 'src/utils/', minLinesPct: 100 },
  { name: 'src/hooks', prefix: 'src/hooks/', minLinesPct: 95 },
  { name: 'src/pages/api', prefix: 'src/pages/api/', minLinesPct: 90 },
  { name: 'src/app/api', prefix: 'src/app/api/', minLinesPct: 90 },
]

const optional = [{ name: 'src/components', prefix: 'src/components/', targetLinesPct: 90 }]

let failed = false
for (const b of buckets) {
  const { lh, lf, pct } = sumPrefix(perFile, b.prefix)
  const ok = pct + 1e-9 >= b.minLinesPct
  if (!ok) failed = true
  // eslint-disable-next-line no-console
  console.log(
    `${b.name.padEnd(14)} lines ${formatPct(pct).padStart(8)}  (${lh}/${lf})  min ${b.minLinesPct}%  ${ok ? 'OK' : 'FAIL'}`,
  )
}

for (const b of optional) {
  const { lh, lf, pct } = sumPrefix(perFile, b.prefix)
  const ok = pct + 1e-9 >= b.targetLinesPct
  // eslint-disable-next-line no-console
  console.log(
    `${b.name.padEnd(14)} lines ${formatPct(pct).padStart(8)}  (${lh}/${lf})  target ${b.targetLinesPct}%  ${ok ? 'OK' : 'BELOW TARGET'}`,
  )
}

process.exit(failed ? 1 : 0)
