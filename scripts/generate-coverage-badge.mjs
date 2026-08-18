/**
 * Generates a shields.io-style SVG coverage badge from Jest's
 * coverage/coverage-summary.json (produced by the json-summary reporter).
 *
 * Usage: node scripts/generate-coverage-badge.mjs [output-dir]
 *
 * Writes <output-dir>/coverage-badge.svg (default output dir: coverage-badge).
 * The badge is published to the orphan `badges` branch by the
 * .github/workflows/coverage-badge.yml workflow and referenced from the README.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const SUMMARY_PATH = 'coverage/coverage-summary.json'
const OUTPUT_DIR = process.argv[2] ?? 'coverage-badge'

function color(pct) {
    if (pct >= 90) return '#4c1' // brightgreen
    if (pct >= 80) return '#97ca00' // green
    if (pct >= 70) return '#a4a61d' // yellowgreen
    if (pct >= 60) return '#dfb317' // yellow
    if (pct >= 50) return '#fe7d37' // orange
    return '#e05d44' // red
}

// Approximate Verdana 11px text width, good enough for a short badge label
function textWidth(text) {
    return Math.round([...text].reduce((width, char) => width + (/[%.]/.test(char) ? 6.5 : 7.5), 0))
}

function renderBadge(label, value, valueColor) {
    const labelWidth = textWidth(label) + 10
    const valueWidth = textWidth(value) + 10
    const width = labelWidth + valueWidth

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueColor}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">
    <text x="${labelWidth * 5}" y="150" transform="scale(.1)" fill="#010101" fill-opacity=".3" textLength="${(labelWidth - 10) * 10}">${label}</text>
    <text x="${labelWidth * 5}" y="140" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
    <text x="${(labelWidth + valueWidth / 2) * 10}" y="150" transform="scale(.1)" fill="#010101" fill-opacity=".3" textLength="${(valueWidth - 10) * 10}">${value}</text>
    <text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${value}</text>
  </g>
</svg>
`
}

let value = 'unknown'
let valueColor = '#9f9f9f' // lightgrey

if (existsSync(SUMMARY_PATH)) {
    const {total} = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'))

    if (total.lines.total > 0) {
        const pct = total.lines.pct
        value = `${Math.round(pct * 10) / 10}%`
        valueColor = color(pct)
    }
}

mkdirSync(OUTPUT_DIR, {recursive: true})
writeFileSync(join(OUTPUT_DIR, 'coverage-badge.svg'), renderBadge('coverage', value, valueColor))

console.log(`Total line coverage: ${value}`)

if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, `**Total line coverage:** ${value}\n`, {flag: 'a'})
}
