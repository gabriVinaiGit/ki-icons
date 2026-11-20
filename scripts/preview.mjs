import { mkdir, readFile, writeFile } from 'node:fs/promises'

// .github/preview.svg: a showcase grid of representative icons for the top of
// the README. One standalone SVG (nested <svg> per icon), so GitHub and npm
// render it as an image with every colour intact.
const root = new URL('../', import.meta.url)
const set = JSON.parse(await readFile(new URL('icons.json', root), 'utf8'))

const PICKS = [
  'apple', 'avocado', 'croissant', 'broccoli', 'cheese', 'strawberry', 'pizza', 'coffee', 'carrot', 'sushi',
  'category-fruit', 'trophy-sprout', 'trophy-tree', 'currency-sack', 'world-garden', 'world-farm', 'deco-beehive', 'deco-watering-can', 'deco-gnome-spring', 'tree-oak',
]
const missing = PICKS.filter(name => !set.icons[name])
if (missing.length) {
  console.error(`preview.svg: unknown icons ${missing.join(', ')}`)
  process.exit(1)
}

const COLS = 10
const ICON = 64
const GAP = 32
const PAD = 48
const rows = Math.ceil(PICKS.length / COLS)
const width = PAD * 2 + COLS * ICON + (COLS - 1) * GAP
const height = PAD * 2 + rows * ICON + (rows - 1) * GAP

const icons = PICKS.map((name, i) => {
  const icon = set.icons[name]
  const box = [icon.left ?? 0, icon.top ?? 0, icon.width ?? set.width, icon.height ?? set.height].join(' ')
  const x = PAD + (i % COLS) * (ICON + GAP)
  const y = PAD + Math.floor(i / COLS) * (ICON + GAP)
  return `<svg x="${x}" y="${y}" width="${ICON}" height="${ICON}" viewBox="${box}">${icon.body}</svg>`
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="A selection of ki-icons">`
  + `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="20" fill="#fafaf9" stroke="#e7e6e2"/>${icons}</svg>\n`

await mkdir(new URL('.github/', root), { recursive: true })
await writeFile(new URL('.github/preview.svg', root), svg)
console.info(`.github/preview.svg: ${PICKS.length} icons`)
