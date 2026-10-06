import { readdir, readFile, writeFile } from 'node:fs/promises'

// svg/<family>/<name>.svg → icon "<name>" for food, "<family>-<name>" otherwise,
// so `ki:banana`, `ki:category-fruit` and `ki:trophy-sprout` never collide.
const FAMILIES = ['food', 'category', 'trophy']
const DEFAULT_SIZE = 24

// Markup that would let an icon do more than draw itself.
const UNSAFE = /<(script|style|image|foreignObject|use|iframe)\b|\son\w+=|\shref=|url\(/i

const root = new URL('../', import.meta.url)
const icons = {}
const names = {}
const errors = []

for (const family of FAMILIES) {
  const files = (await readdir(new URL(`svg/${family}/`, root))).filter(f => f.endsWith('.svg')).sort()
  names[family] = []
  for (const file of files) {
    const base = file.slice(0, -4)
    const name = family === 'food' ? base : `${family}-${base}`
    const where = `svg/${family}/${file}`
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) { errors.push(`${where}: name must be kebab-case`) }

    const svg = (await readFile(new URL(where, root), 'utf8')).trim()
    const open = svg.match(/^<svg\b[^>]*>/)
    const viewBox = open?.[0].match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number)
    if (!open || !svg.endsWith('</svg>') || viewBox?.length !== 4 || viewBox.some(Number.isNaN)) {
      errors.push(`${where}: expected one <svg> root with a numeric viewBox`)
      continue
    }
    const body = svg.slice(open[0].length, -'</svg>'.length).replace(/>\s+</g, '><').trim()
    if (!body) { errors.push(`${where}: empty`) }
    if (UNSAFE.test(body)) { errors.push(`${where}: unsafe markup`) }
    if (body.includes('currentColor')) { errors.push(`${where}: uses currentColor — every ki icon carries its own colours`) }

    const [left, top, width, height] = viewBox
    icons[name] = {
      body,
      ...(left ? { left } : {}),
      ...(top ? { top } : {}),
      ...(width !== DEFAULT_SIZE ? { width } : {}),
      ...(height !== DEFAULT_SIZE ? { height } : {}),
    }
    names[family].push(name)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const iconSet = {
  prefix: 'ki',
  info: {
    name: 'ki-icons',
    total: Object.keys(icons).length,
    version: pkg.version,
    author: { name: 'Gabriele Vinai', url: 'https://github.com/gabriVinaiGit/ki-icons' },
    license: { title: 'MIT', spdx: 'MIT' },
    palette: true,
  },
  width: DEFAULT_SIZE,
  height: DEFAULT_SIZE,
  icons,
}

await writeFile(new URL('icons.json', root), `${JSON.stringify(iconSet)}\n`)
await writeFile(new URL('names.json', root), `${JSON.stringify(names, null, 2)}\n`)
console.info(`icons.json: ${iconSet.info.total} icons (${FAMILIES.map(f => `${names[f].length} ${f}`).join(', ')})`)
