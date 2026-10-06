import { readFile, writeFile } from 'node:fs/promises'

// A static page of every icon, built from icons.json: search, size, light/dark.
const root = new URL('../', import.meta.url)
const set = JSON.parse(await readFile(new URL('icons.json', root), 'utf8'))
const names = JSON.parse(await readFile(new URL('names.json', root), 'utf8'))

function svg(name) {
  const icon = set.icons[name]
  const box = [icon.left ?? 0, icon.top ?? 0, icon.width ?? set.width, icon.height ?? set.height].join(' ')
  return `<svg viewBox="${box}" aria-hidden="true">${icon.body}</svg>`
}

const sections = Object.entries(names).map(([family, list]) => `
<h2>${family} <small>${list.length}</small></h2>
<ul>${list.map(name => `<li data-name="${name}">${svg(name)}<code>ki:${name}</code></li>`).join('')}</ul>`).join('')

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ki-icons</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:32px;font:16px system-ui;background:#fbfaf5;color:#173322}
body.dark{background:#0e2923;color:#f4f1df}
h1{margin-top:0}h2{text-transform:capitalize;margin-top:32px}small{opacity:.55;font-weight:400}
label{display:inline-flex;gap:10px;align-items:center;margin:0 20px 20px 0}
input,select,button{font:inherit;padding:8px 12px;border:1px solid #789580;border-radius:8px;background:transparent;color:inherit}
ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:24px 12px;padding:0;list-style:none}
li{display:flex;flex-direction:column;align-items:center;gap:12px}li[hidden]{display:none}
svg{width:var(--size,48px);height:var(--size,48px)}code{font-size:12px}
@media(max-width:480px){body{padding:20px}ul{grid-template-columns:repeat(2,1fr)}}
</style>
<h1>ki-icons</h1>
<p>${set.info.total} coloured illustrations · v${set.info.version} · <code>&lt;v-icon icon="ki:banana" size="large" /&gt;</code></p>
<label>Search <input id="search" type="search" placeholder="banana, category, trophy…"></label>
<label>Size <select id="size"><option>24</option><option selected>48</option><option>72</option></select></label>
<button id="theme" type="button">Dark</button>
${sections}
<script>
document.querySelector('#search').oninput = e => document.querySelectorAll('li').forEach(li => { li.hidden = !li.dataset.name.includes(e.target.value.toLowerCase().trim()) })
document.querySelector('#size').onchange = e => document.body.style.setProperty('--size', e.target.value + 'px')
document.querySelector('#theme').onclick = e => { e.target.textContent = document.body.classList.toggle('dark') ? 'Light' : 'Dark' }
</script>
</html>
`

await writeFile(new URL('catalog.html', root), html)
console.info(`catalog.html: ${set.info.total} icons`)
