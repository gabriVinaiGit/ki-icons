import { readFile, writeFile } from 'node:fs/promises'

// catalog.html: a static page of every icon, built from icons.json and
// names.json. Search, family filter, size and canvas controls, and a detail
// panel with copy-ready snippets and SVG / PNG downloads. No dependencies.
const root = new URL('../', import.meta.url)
const set = JSON.parse(await readFile(new URL('icons.json', root), 'utf8'))
const names = JSON.parse(await readFile(new URL('names.json', root), 'utf8'))

const REPO = 'https://github.com/gabriVinaiGit/ki-icons'
const NPM = 'https://www.npmjs.com/package/ki-icons'
const REQUEST = `${REPO}/issues/new?template=icon-request.yml`
const { total, version } = set.info

const FAMILIES = {
  food: { label: 'Food', note: 'The food itself' },
  category: { label: 'Categories', note: 'Food categories' },
  trophy: { label: 'Trophies', note: 'Awards and milestones' },
  currency: { label: 'Currency', note: 'The seed, or what holds them' },
  world: { label: 'Worlds', note: 'Places, each standing on its island' },
  deco: { label: 'Decorations', note: 'Objects, each standing on its base' },
  tree: { label: 'Trees', note: 'Species, each standing on its base' },
}
const family = key => FAMILIES[key] ?? { label: key, note: '' }

function viewBox(name) {
  const icon = set.icons[name]
  return [icon.left ?? 0, icon.top ?? 0, icon.width ?? set.width, icon.height ?? set.height].join(' ')
}
const svg = name => `<svg viewBox="${viewBox(name)}" aria-hidden="true">${set.icons[name].body}</svg>`

// Interface glyphs, drawn on one 24 grid with one stroke.
const ui = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
}
const glyph = (key, cls = '') => `<svg class="glyph ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ui[key]}</svg>`
const github = '<svg class="glyph" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>'

// The project mark (.github/logo.svg), inlined for the top bar and the favicon.
const logo = (await readFile(new URL('.github/logo.svg', root), 'utf8')).trim()
const brand = logo.replace('<svg ', '<svg aria-hidden="true" ')
const favicon = `data:image/svg+xml,${encodeURIComponent(logo)}`

const filterButtons = cls => [
  `<button type="button" class="${cls}" data-filter="all" aria-pressed="true"><span>All icons</span><span class="num">${total}</span></button>`,
  ...Object.entries(names).map(([key, list]) =>
    `<button type="button" class="${cls}" data-filter="${key}" aria-pressed="false"><span>${family(key).label}</span><span class="num">${list.length}</span></button>`),
].join('')

const sections = Object.entries(names).map(([key, list]) => `
<section class="family" data-family="${key}" aria-labelledby="h-${key}">
  <header class="family-head">
    <h2 id="h-${key}">${family(key).label} <span class="family-count">${list.length}</span></h2>
    <p>${family(key).note}</p>
  </header>
  <ul class="grid">${list.map(name => `<li><button type="button" class="tile" data-name="${name}" data-family="${key}" data-label="${family(key).label}" data-search="${name.replace(/-/g, ' ')} ${key} ${family(key).label.toLowerCase()}" title="ki:${name}"><span class="well">${svg(name)}</span><span class="label">${name}</span></button></li>`).join('')}</ul>
</section>`).join('')

// Runs in the page. Serialised with toString(), so it is plain browser code.
function client() {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const html = document.documentElement
  const store = {
    get(k) { try { return localStorage.getItem(k) } catch { return null } },
    set(k, v) { try { localStorage.setItem(k, v) } catch {} },
  }

  // Theme
  const themeBtn = $('#theme')
  const syncTheme = () => themeBtn.setAttribute('aria-label', html.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
  themeBtn.addEventListener('click', () => {
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark'
    store.set('ki-theme', html.dataset.theme)
    syncTheme()
  })
  syncTheme()

  // Size
  const size = $('#size')
  const setSize = v => {
    html.style.setProperty('--icon', `${v}px`)
    $('#size-value').textContent = `${v}px`
    size.value = v
  }
  size.addEventListener('input', () => { setSize(size.value); store.set('ki-size', size.value) })
  setSize(store.get('ki-size') || 48)

  // Canvas behind the icons
  const setCanvas = c => {
    html.dataset.canvas = c
    $$('[data-canvas]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.canvas === c)))
  }
  $$('[data-canvas]').forEach(b => b.addEventListener('click', () => { setCanvas(b.dataset.canvas); store.set('ki-canvas', b.dataset.canvas) }))
  setCanvas(store.get('ki-canvas') || 'auto')

  // Search and family filter
  const search = $('#search')
  const tiles = $$('.tile')
  const sections = $$('.family')
  let active = 'all'

  function filter() {
    const query = search.value.trim()
    const tokens = query.toLowerCase().replace(/^ki:/, '').split(/[\s\-_:]+/).filter(Boolean)
    let shown = 0
    for (const section of sections) {
      const inFamily = active === 'all' || section.dataset.family === active
      let n = 0
      for (const tile of section.querySelectorAll('.tile')) {
        const ok = inFamily && tokens.every(t => tile.dataset.search.includes(t))
        tile.parentElement.hidden = !ok
        if (ok) { n++ }
      }
      section.hidden = n === 0
      section.querySelector('.family-count').textContent = n
      shown += n
    }
    $('#count').textContent = shown === 1 ? '1 icon' : `${shown} icons`
    $('#empty').hidden = shown > 0
    $('#empty-query').textContent = query
    $('#empty-request').href = `${$('#empty-request').dataset.base}&title=${encodeURIComponent(`Icon request: ${query}`)}`

    const params = new URLSearchParams()
    if (query) { params.set('q', query) }
    if (active !== 'all') { params.set('family', active) }
    history.replaceState(null, '', `${String(params) ? `?${params}` : location.pathname}${location.hash}`)
  }

  function setFamily(key) {
    active = key
    $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === key)))
    filter()
  }

  search.addEventListener('input', filter)
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => setFamily(b.dataset.filter)))
  $('#empty-clear').addEventListener('click', () => { search.value = ''; setFamily('all'); search.focus() })

  // Clipboard, with a visible confirmation on the button that was pressed
  async function copy(text, button) {
    try { await navigator.clipboard.writeText(text) } catch {
      const area = Object.assign(document.createElement('textarea'), { value: text })
      document.body.append(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    if (button) {
      button.classList.add('is-copied')
      clearTimeout(button.copiedTimer)
      button.copiedTimer = setTimeout(() => button.classList.remove('is-copied'), 1400)
    }
    $('#status').textContent = 'Copied to clipboard'
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy, b)))

  // Install command for the visitor's package manager
  const installs = { npm: 'npm i ki-icons', pnpm: 'pnpm add ki-icons', yarn: 'yarn add ki-icons', bun: 'bun add ki-icons' }
  const setPm = pm => {
    $('#install-cmd').textContent = installs[pm]
    $('#install-copy').dataset.copy = installs[pm]
    $$('[data-pm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pm === pm)))
  }
  $$('[data-pm]').forEach(b => b.addEventListener('click', () => { setPm(b.dataset.pm); store.set('ki-pm', b.dataset.pm) }))
  setPm(installs[store.get('ki-pm')] ? store.get('ki-pm') : 'npm')

  // Detail panel
  const panel = $('#panel')
  let current = null
  let tab = store.get('ki-tab') || 'nuxt'

  const markup = (name, px) => {
    const tile = tiles.find(t => t.dataset.name === name)
    const icon = tile.querySelector('svg')
    const [, , w, h] = icon.getAttribute('viewBox').split(' ')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.getAttribute('viewBox')}" width="${px ?? w}" height="${px ?? h}">${icon.innerHTML}</svg>`
  }

  const snippets = {
    nuxt: n => `<Icon name="ki:${n}" size="48" />`,
    vuetify: n => `<v-icon icon="ki:${n}" size="x-large" />`,
    vue: n => `<Icon icon="ki:${n}" width="48" />`,
    react: n => `<Icon icon="ki:${n}" width={48} />`,
    svg: n => markup(n),
  }

  function renderSnippet() {
    $$('[data-tab]').forEach(b => {
      const on = b.dataset.tab === tab
      b.setAttribute('aria-selected', String(on))
      b.tabIndex = on ? 0 : -1
    })
    const code = snippets[tab](current)
    $('#snippet').textContent = code
    $('#snippet-copy').dataset.copy = code
  }

  $$('[data-tab]').forEach(b => {
    b.addEventListener('click', () => { tab = b.dataset.tab; store.set('ki-tab', tab); renderSnippet() })
    b.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return }
      const all = $$('[data-tab]')
      const next = all[(all.indexOf(b) + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]
      next.focus()
      next.click()
    })
  })
  $('#snippet-copy').addEventListener('click', e => copy(e.currentTarget.dataset.copy, e.currentTarget))

  function open(name, { scroll = false } = {}) {
    const tile = tiles.find(t => t.dataset.name === name)
    if (!tile) { return }
    current = name
    tiles.forEach(t => t.toggleAttribute('aria-current', t === tile))
    const icon = tile.querySelector('svg').outerHTML
    $('#panel-icon').innerHTML = icon
    $$('.panel-size').forEach(s => { s.querySelector('.panel-size-icon').innerHTML = icon })
    $('#panel-name').textContent = `ki:${name}`
    $('#panel-family').textContent = tile.dataset.label
    $('#panel-copy-name').dataset.copy = `ki:${name}`
    renderSnippet()
    panel.inert = false
    panel.classList.add('is-open')
    document.body.classList.add('has-panel')
    history.replaceState(null, '', `${location.search || location.pathname}#${name}`)
    if (scroll) { tile.scrollIntoView({ block: 'center' }) }
  }

  function close() {
    if (!current) { return }
    const tile = tiles.find(t => t.dataset.name === current)
    current = null
    panel.classList.remove('is-open')
    panel.inert = true
    document.body.classList.remove('has-panel')
    tiles.forEach(t => t.removeAttribute('aria-current'))
    history.replaceState(null, '', location.search || location.pathname)
    tile?.focus({ preventScroll: true })
  }

  $('#catalog').addEventListener('click', e => {
    const tile = e.target.closest('.tile')
    if (tile) { open(tile.dataset.name) }
  })
  $('#panel-close').addEventListener('click', close)
  $('#panel-copy-name').addEventListener('click', e => copy(e.currentTarget.dataset.copy, e.currentTarget))

  function download(blob, file) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file })
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  $('#download-svg').addEventListener('click', () => download(new Blob([markup(current)], { type: 'image/svg+xml' }), `${current}.svg`))
  $('#download-png').addEventListener('click', async () => {
    const px = 512
    const img = new Image()
    img.src = URL.createObjectURL(new Blob([markup(current, px)], { type: 'image/svg+xml' }))
    await img.decode()
    const canvas = Object.assign(document.createElement('canvas'), { width: px, height: px })
    canvas.getContext('2d').drawImage(img, 0, 0, px, px)
    URL.revokeObjectURL(img.src)
    const name = current
    canvas.toBlob(blob => download(blob, `${name}.png`), 'image/png')
  })

  // Keyboard: "/" or Ctrl/Cmd+K to search, Escape to step back
  document.addEventListener('keydown', e => {
    const typing = e.target.closest('input, textarea, select')
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault()
      search.focus()
      search.select()
    } else if (e.key === 'Escape') {
      if (current) { close() } else if (e.target === search && search.value) { search.value = ''; filter() }
    }
  })

  // Restore state from the URL
  const params = new URLSearchParams(location.search)
  search.value = params.get('q') ?? ''
  const fam = params.get('family')
  setFamily(fam && $(`[data-filter="${CSS.escape(fam)}"]`) ? fam : 'all')
  const hash = decodeURIComponent(location.hash.slice(1))
  if (hash) { open(hash, { scroll: true }) }
}

const css = `
:root{
  --font:'Schibsted Grotesk',ui-sans-serif,system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --bg:#fafaf9;--surface:#fff;--sunken:#f3f3f1;--hover:#efefec;
  --line:#e7e6e2;--line-strong:#d4d3cd;
  --ink:#1b1c1a;--ink-2:#50524c;--ink-3:#6b6d67;
  --invert:#1b1c1a;--invert-ink:#fafaf9;
  --canvas-light:#fff;--canvas-dark:#1d1f1d;
  --shadow:0 1px 2px rgb(20 20 18/.05),0 16px 40px -12px rgb(20 20 18/.18);
  --ease:cubic-bezier(.16,1,.3,1);
  --icon:48px;--top:60px;--side:248px;--panel:368px;
  color-scheme:light;
}
:root[data-theme="dark"]{
  --bg:#111211;--surface:#171817;--sunken:#1c1d1c;--hover:#222422;
  --line:#272927;--line-strong:#383a37;
  --ink:#ededea;--ink-2:#a9aba5;--ink-3:#8d8f89;
  --invert:#ededea;--invert-ink:#111211;
  --shadow:0 1px 2px rgb(0 0 0/.3),0 20px 48px -12px rgb(0 0 0/.6);
  color-scheme:dark;
}
:root{--well:var(--surface)}
:root[data-canvas="light"]{--well:var(--canvas-light)}
:root[data-canvas="dark"]{--well:var(--canvas-dark)}
:root[data-theme="dark"][data-canvas="light"] .well{border-color:transparent}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:calc(var(--top) + 80px)}
body{margin:0;background:var(--bg);color:var(--ink);font:400 14px/1.5 var(--font);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit}
button{font:inherit;color:inherit}
code,kbd,pre{font-family:var(--mono)}
[hidden]{display:none!important}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px;border-radius:6px}
.glyph{width:18px;height:18px;flex:none}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* Top bar */
.topbar{position:sticky;top:0;z-index:30;height:var(--top);display:flex;align-items:center;gap:16px;padding:0 20px;background:var(--bg);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:600;font-size:16px;letter-spacing:-.01em}
.brand svg{width:28px;height:28px}
.version{font:500 11px/1 var(--mono);color:var(--ink-3);padding:4px 7px;border:1px solid var(--line);border-radius:999px;letter-spacing:0}
.topnav{margin-left:auto;display:flex;align-items:center;gap:4px}
.navlink{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 12px;border-radius:8px;text-decoration:none;color:var(--ink-2);font-weight:500;background:none;border:0;cursor:pointer;transition:background .15s,color .15s}
.navlink:hover{background:var(--hover);color:var(--ink)}
.iconbtn{width:36px;padding:0;justify-content:center}
.iconbtn .moon{display:none}
:root[data-theme="dark"] .iconbtn .sun{display:none}
:root[data-theme="dark"] .iconbtn .moon{display:block}

/* Layout */
.layout{display:grid;grid-template-columns:var(--side) minmax(0,1fr);min-height:calc(100vh - var(--top))}
.sidebar{position:sticky;top:var(--top);height:calc(100vh - var(--top));overflow:auto;padding:28px 16px 24px;display:flex;flex-direction:column;gap:32px}
.side-title{margin:0 0 8px;padding:0 10px;font-size:12px;font-weight:500;color:var(--ink-3)}
.side-list{display:flex;flex-direction:column;gap:1px}
.side-item{display:flex;align-items:center;justify-content:space-between;height:34px;padding:0 10px;border:0;border-radius:8px;background:none;color:var(--ink-2);cursor:pointer;text-align:left;transition:background .15s,color .15s}
.side-item:hover{background:var(--hover);color:var(--ink)}
.side-item[aria-pressed="true"]{background:var(--sunken);color:var(--ink);font-weight:500;box-shadow:inset 0 0 0 1px var(--line)}
.num{font:400 12px var(--mono);color:var(--ink-3)}
.control{padding:0 10px;display:flex;flex-direction:column;gap:10px}
.control+.control{margin-top:20px}
.control-row{display:flex;justify-content:space-between;align-items:baseline;font-weight:500}
.control-row output{font:400 12px var(--mono);color:var(--ink-3)}
input[type="range"]{width:100%;margin:0;accent-color:var(--ink);height:20px}
.segmented{display:grid;grid-template-columns:repeat(3,1fr);padding:3px;gap:2px;background:var(--sunken);border:1px solid var(--line);border-radius:9px}
.segmented button{height:28px;border:0;border-radius:6px;background:none;color:var(--ink-2);font-size:13px;cursor:pointer;transition:background .15s,color .15s}
.segmented button:hover{color:var(--ink)}
.segmented button[aria-pressed="true"]{background:var(--surface);color:var(--ink);font-weight:500;box-shadow:0 1px 2px rgb(0 0 0/.08),0 0 0 1px var(--line)}
.side-note{margin-top:auto;padding:16px 10px 0;border-top:1px solid var(--line);color:var(--ink-3);font-size:13px}
.side-note a{color:var(--ink-2);text-underline-offset:3px}
.side-note a:hover{color:var(--ink)}

/* Main */
main{min-width:0;min-height:calc(100vh - var(--top));border-left:1px solid var(--line);padding:0 40px 64px}
.intro{padding:48px 0 32px;max-width:720px}
.intro h1{margin:0;font-size:clamp(28px,3.4vw,40px);line-height:1.1;font-weight:600;letter-spacing:-.035em;text-wrap:balance}
.intro p{margin:14px 0 0;max-width:62ch;font-size:16px;line-height:1.6;color:var(--ink-2);text-wrap:pretty}
.intro p code{font-size:.9em;padding:1px 5px;border-radius:5px;background:var(--sunken);border:1px solid var(--line);color:var(--ink)}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.install{display:inline-flex;white-space:nowrap;align-items:center;gap:4px;height:40px;padding:0 4px 0 14px;border-radius:10px;background:var(--invert);color:var(--invert-ink);font:400 13px var(--mono)}
.cta{align-items:flex-end}
.install-wrap{display:flex;flex-direction:column;gap:6px}
.pm{display:flex;gap:2px}
.pm button{height:24px;padding:0 8px;border:0;border-radius:6px;background:none;color:var(--ink-3);font:400 12px var(--mono);cursor:pointer;transition:background .15s,color .15s}
.pm button:hover{color:var(--ink)}
.pm button[aria-pressed="true"]{background:var(--sunken);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.install .prompt{opacity:.55;margin-right:6px}
.install .copybtn{color:inherit}
.install .copybtn:hover{background:rgb(127 127 127/.22)}
.ghost{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:10px;border:1px solid var(--line-strong);text-decoration:none;font-weight:500;color:var(--ink);transition:background .15s,border-color .15s}
.ghost:hover{background:var(--hover)}
.ghost .glyph{width:16px;height:16px;transition:transform .3s var(--ease)}
.ghost:hover .glyph{transform:translateX(2px)}

.copybtn{position:relative;display:inline-grid;place-items:center;width:32px;height:32px;border:0;border-radius:7px;background:none;color:var(--ink-2);cursor:pointer;transition:background .15s,color .15s}
.copybtn:hover{background:var(--hover);color:var(--ink)}
.copybtn .glyph{width:16px;height:16px;grid-area:1/1;transition:opacity .15s,transform .25s var(--ease)}
.copybtn .check{opacity:0;transform:scale(.6)}
.copybtn.is-copied .copy{opacity:0;transform:scale(.6)}
.copybtn.is-copied .check{opacity:1;transform:none}

/* Toolbar */
.toolbar{position:sticky;top:var(--top);z-index:20;margin:0 -40px;padding:14px 40px;background:var(--bg);border-bottom:1px solid transparent;display:flex;flex-direction:column;gap:12px}
.searchrow{display:flex;align-items:center;gap:16px}
.search{position:relative;flex:1;max-width:560px}
.search .glyph{position:absolute;left:13px;top:50%;translate:0 -50%;color:var(--ink-3);pointer-events:none}
.search input{width:100%;height:42px;padding:0 44px 0 40px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;font-size:15px;outline:none;transition:border-color .15s,box-shadow .15s}
.search input::placeholder{color:var(--ink-3)}
.search input:focus{border-color:var(--ink-3);box-shadow:0 0 0 4px rgb(127 127 120/.14)}
.search input::-webkit-search-cancel-button{-webkit-appearance:none}
.search kbd{position:absolute;right:10px;top:50%;translate:0 -50%;min-width:22px;height:22px;display:grid;place-items:center;padding:0 6px;border:1px solid var(--line);border-bottom-width:2px;border-radius:6px;font-size:11px;color:var(--ink-3);background:var(--bg)}
.search input:focus~kbd{opacity:0}
#count{color:var(--ink-3);font:400 13px var(--mono);white-space:nowrap}
.chips{display:none;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px}
.chips::-webkit-scrollbar{display:none}
.chip{display:inline-flex;align-items:center;gap:6px;flex:none;height:32px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink-2);font-size:13px;cursor:pointer}
.chip[aria-pressed="true"]{background:var(--invert);border-color:var(--invert);color:var(--invert-ink)}
.chip[aria-pressed="true"] .num{color:inherit;opacity:.65}

/* Families and grid */
.family{margin-top:28px}
.family+.family{margin-top:44px}
.family-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
.family-head h2{margin:0;font-size:16px;font-weight:600;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
.family-count{font:400 12px var(--mono);color:var(--ink-3)}
.family-head p{margin:0;color:var(--ink-3);font-size:13px}
.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(max(108px,calc(var(--icon) + 56px)),1fr));gap:20px 12px}
.tile{width:100%;display:flex;flex-direction:column;gap:8px;padding:0;border:0;background:none;cursor:pointer;text-align:center}
.well{display:grid;place-items:center;aspect-ratio:1;border:1px solid var(--line);border-radius:12px;background:var(--well);transition:border-color .2s,box-shadow .2s,background .2s}
.well svg{width:var(--icon);height:var(--icon);transition:transform .35s var(--ease)}
.label{font:400 12px/1.4 var(--mono);color:var(--ink-2);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;overflow-wrap:anywhere;padding:0 2px;transition:color .15s}
.tile:hover .well{border-color:var(--line-strong);box-shadow:0 2px 8px -2px rgb(0 0 0/.08)}
.tile:hover .well svg{transform:scale(1.1)}
.tile:hover .label{color:var(--ink)}
.tile:focus-visible{outline:none}
.tile:focus-visible .well{outline:2px solid var(--ink);outline-offset:2px}
.tile[aria-current] .well{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
.tile[aria-current] .label{color:var(--ink);font-weight:500}

.empty{padding:72px 0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
.empty svg{width:72px;height:72px;margin-bottom:12px}
.empty h2{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em}
.empty p{margin:0;color:var(--ink-2);max-width:42ch}
.empty .cta{margin-top:18px;justify-content:center}
.btn{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px;border-radius:9px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);font-weight:500;cursor:pointer;text-decoration:none;transition:background .15s}
.btn:hover{background:var(--hover)}
.btn-primary{background:var(--invert);color:var(--invert-ink);border-color:var(--invert)}
.btn-primary:hover{background:var(--invert);opacity:.88}
.btn .glyph{width:16px;height:16px}

/* Detail panel */
.panel{position:fixed;z-index:40;top:calc(var(--top) + 12px);right:12px;bottom:12px;width:var(--panel);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:auto;overscroll-behavior:contain;
  visibility:hidden;opacity:0;transform:translateX(24px);transition:transform .45s var(--ease),opacity .25s ease,visibility 0s .45s}
.panel.is-open{visibility:visible;opacity:1;transform:none;transition:transform .45s var(--ease),opacity .25s ease,visibility 0s}
body.has-panel main{padding-right:calc(var(--panel) + 36px)}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 18px 0 20px}
.panel-head h2{margin:0;font:500 15px/1.4 var(--mono);word-break:break-all}
.panel-head p{margin:2px 0 0;color:var(--ink-3);font-size:13px}
.panel-head .copybtn{margin:-4px -6px 0 0}
.panel-stage{margin:16px 20px 0;border:1px solid var(--line);border-radius:14px;background:var(--well);overflow:hidden}
#panel-icon{display:grid;place-items:center;height:200px}
#panel-icon svg{width:128px;height:128px}
.panel-sizes{display:flex;justify-content:space-around;align-items:flex-end;padding:14px 12px 12px;border-top:1px solid var(--line)}
:root[data-theme="dark"][data-canvas="light"] .panel-sizes{border-color:#e7e6e2}
.panel-size{display:flex;flex-direction:column;align-items:center;gap:6px;font:400 11px var(--mono);color:var(--ink-3)}
:root[data-canvas="light"] .panel-size{color:#6b6d67}
:root[data-theme="light"][data-canvas="dark"] .panel-size{color:#a9aba5}
.panel-size-icon{display:grid;place-items:center}
.panel-size svg{width:var(--s);height:var(--s)}
.panel-block{padding:20px 20px 0}
.panel-block h3{margin:0 0 10px;font-size:12px;font-weight:500;color:var(--ink-3)}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--line)}
.tabs button{position:relative;height:34px;padding:0 10px;border:0;background:none;color:var(--ink-3);font-size:13px;cursor:pointer;transition:color .15s}
.tabs button:hover{color:var(--ink)}
.tabs button[aria-selected="true"]{color:var(--ink);font-weight:500}
.tabs button[aria-selected="true"]::after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;border-radius:2px;background:var(--ink)}
.code{position:relative;margin-top:12px;border-radius:10px;background:var(--sunken);border:1px solid var(--line)}
.code pre{margin:0;padding:14px 48px 14px 14px;max-height:180px;overflow:auto;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
.code .copybtn{position:absolute;top:6px;right:6px}
.panel-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:20px}
.panel-actions .btn{justify-content:center}
.panel-foot{margin-top:auto;padding:14px 20px;border-top:1px solid var(--line);color:var(--ink-3);font-size:12px}
.panel-foot a{color:var(--ink-2);text-underline-offset:3px}

/* Footer */
.footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;margin-top:72px;padding-top:24px;border-top:1px solid var(--line);color:var(--ink-3);font-size:13px}
.footer nav{display:flex;gap:20px}
.footer a{color:var(--ink-2);text-decoration:none}
.footer a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:3px}

@media (max-width:1100px){
  :root{--side:216px}
  main{padding:0 28px 56px}
  .toolbar{margin:0 -28px;padding:14px 28px}
  body.has-panel main{padding-right:28px}
}
@media (max-width:860px){
  :root{--top:56px}
  .layout{display:block}
  main{border-left:0}
  .sidebar{display:none}
  .navlink.text{display:none}
  .topbar{padding:0 12px 0 16px}
  main,body.has-panel main{padding:0 16px 48px}
  .toolbar{margin:0 -16px;padding:12px 16px}
  .chips{display:flex;margin:0 -16px;padding:0 16px}
  .intro{padding:32px 0 20px}
  .intro p{font-size:15px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:16px 10px}
  .well svg{width:min(var(--icon),48px);height:min(var(--icon),48px)}
  .panel{top:auto;left:0;right:0;bottom:0;width:auto;max-height:82vh;border-radius:18px 18px 0 0;border-bottom:0;transform:translateY(100%)}
  .panel.is-open{transform:none}
  #panel-icon{height:160px}
  #panel-icon svg{width:104px;height:104px}
  .footer{flex-direction:column}
}
@media (max-width:420px){
  .install-wrap{flex:1 1 100%}
  .install{width:100%}
  .install .copybtn{margin-left:auto}
  .ghost{flex:1;justify-content:center}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}
}
`

const html = `<!doctype html>
<html lang="en" data-theme="light" data-canvas="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ki-icons · ${total} hand-drawn, full-colour icons</title>
<meta name="description" content="${total} hand-drawn, full-colour illustrations of food, categories, trophies, currency, worlds, decorations and trees, packaged as an Iconify icon set for Nuxt, Vue, React and more.">
<meta property="og:title" content="ki-icons">
<meta property="og:description" content="${total} hand-drawn, full-colour icons. An Iconify set for Nuxt, Vue, React and more.">
<meta name="theme-color" content="#fafaf9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111211" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<script>
(function(){var d=document.documentElement,g=function(k){try{return localStorage.getItem(k)}catch(e){return null}};
d.dataset.theme=g('ki-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
d.dataset.canvas=g('ki-canvas')||'auto';var s=g('ki-size');if(s)d.style.setProperty('--icon',s+'px')})()
</script>
<style>${css.trim()}</style>
</head>
<body>
<header class="topbar">
  <a class="brand" href="./catalog.html">${brand}<span>ki-icons</span><span class="version">v${version}</span></a>
  <nav class="topnav" aria-label="Project">
    <a class="navlink text" href="${REPO}#readme">Documentation</a>
    <a class="navlink text" href="${NPM}">npm</a>
    <button id="theme" class="navlink iconbtn" type="button" aria-label="Switch theme">${glyph('sun', 'sun')}${glyph('moon', 'moon')}</button>
    <a class="navlink iconbtn" href="${REPO}" aria-label="Source on GitHub">${github}</a>
  </nav>
</header>

<div class="layout">
  <aside class="sidebar" aria-label="Filters and display">
    <div>
      <h2 class="side-title">Families</h2>
      <div class="side-list">${filterButtons('side-item')}</div>
    </div>
    <div>
      <h2 class="side-title">Display</h2>
      <div class="control">
        <label class="control-row" for="size">Size <output id="size-value" for="size">48px</output></label>
        <input id="size" type="range" min="24" max="96" step="8" value="48">
      </div>
      <div class="control">
        <span class="control-row" id="canvas-label">Background</span>
        <div class="segmented" role="group" aria-labelledby="canvas-label">
          <button type="button" data-canvas="auto" aria-pressed="true">Auto</button>
          <button type="button" data-canvas="light" aria-pressed="false">Light</button>
          <button type="button" data-canvas="dark" aria-pressed="false">Dark</button>
        </div>
      </div>
    </div>
    <p class="side-note">Missing an icon? <a href="${REQUEST}">Request it on GitHub</a>.</p>
  </aside>

  <main id="catalog">
    <section class="intro">
      <h1>Hand-drawn icons, in full colour.</h1>
      <p>${total} illustrations of food, categories, trophies, currency, worlds, decorations and trees, packaged as an Iconify icon set. Write <code>ki:banana</code> wherever you would write <code>mdi:home</code>, in Nuxt, Vue, React or anything Iconify reads.</p>
      <div class="cta">
        <div class="install-wrap">
          <div class="pm" role="group" aria-label="Package manager">${['npm', 'pnpm', 'yarn', 'bun'].map((pm, i) => `<button type="button" data-pm="${pm}" aria-pressed="${i === 0}">${pm}</button>`).join('')}</div>
          <div class="install"><span class="prompt">$</span><span id="install-cmd">npm i ki-icons</span><button id="install-copy" type="button" class="copybtn" data-copy="npm i ki-icons" aria-label="Copy install command">${glyph('copy', 'copy')}${glyph('check', 'check')}</button></div>
        </div>
        <a class="ghost" href="${REPO}#readme">Get started ${glyph('arrow')}</a>
      </div>
    </section>

    <div class="toolbar">
      <div class="searchrow">
        <label class="search">
          <span class="sr-only">Search icons</span>
          ${glyph('search')}
          <input id="search" type="search" placeholder="Search ${total} icons" autocomplete="off" spellcheck="false">
          <kbd aria-hidden="true">/</kbd>
        </label>
        <span id="count" aria-live="polite">${total} icons</span>
      </div>
      <div class="chips" role="group" aria-label="Families">${filterButtons('chip')}</div>
    </div>
${sections}
    <div id="empty" class="empty" hidden>
      ${svg('deco-scarecrow')}
      <h2>No icons match “<span id="empty-query"></span>”</h2>
      <p>Try a different word, or ask for it to be drawn. New icons ship in minor releases.</p>
      <div class="cta">
        <button id="empty-clear" type="button" class="btn">Clear search</button>
        <a id="empty-request" class="btn btn-primary" data-base="${REQUEST}" href="${REQUEST}">Request this icon</a>
      </div>
    </div>

    <footer class="footer">
      <span>ki-icons v${version} · MIT License · © Gabriele Vinai</span>
      <nav aria-label="Links">
        <a href="${REPO}">GitHub</a>
        <a href="${NPM}">npm</a>
        <a href="${REQUEST}">Request an icon</a>
      </nav>
    </footer>
  </main>
</div>

<aside id="panel" class="panel" aria-labelledby="panel-name" inert>
  <div class="panel-head">
    <div>
      <h2 id="panel-name">ki:</h2>
      <p id="panel-family"></p>
    </div>
    <div>
      <button id="panel-copy-name" type="button" class="copybtn" aria-label="Copy icon name">${glyph('copy', 'copy')}${glyph('check', 'check')}</button>
      <button id="panel-close" type="button" class="copybtn" aria-label="Close details">${glyph('close')}</button>
    </div>
  </div>
  <div class="panel-stage">
    <div id="panel-icon"></div>
    <div class="panel-sizes">${[16, 24, 32, 48].map(s => `<div class="panel-size" style="--s:${s}px"><span class="panel-size-icon"></span>${s}</div>`).join('')}</div>
  </div>
  <div class="panel-block">
    <h3>Usage</h3>
    <div class="tabs" role="tablist" aria-label="Framework">
      <button type="button" role="tab" data-tab="nuxt" aria-selected="true">Nuxt</button>
      <button type="button" role="tab" data-tab="vuetify" aria-selected="false">Vuetify</button>
      <button type="button" role="tab" data-tab="vue" aria-selected="false">Vue</button>
      <button type="button" role="tab" data-tab="react" aria-selected="false">React</button>
      <button type="button" role="tab" data-tab="svg" aria-selected="false">SVG</button>
    </div>
    <div class="code" role="tabpanel">
      <pre><code id="snippet"></code></pre>
      <button id="snippet-copy" type="button" class="copybtn" aria-label="Copy snippet">${glyph('copy', 'copy')}${glyph('check', 'check')}</button>
    </div>
  </div>
  <div class="panel-actions">
    <button id="download-svg" type="button" class="btn">${glyph('download')}SVG</button>
    <button id="download-png" type="button" class="btn">${glyph('download')}PNG 512</button>
  </div>
  <p class="panel-foot">Set up once per app: see the <a href="${REPO}#readme">README</a>.</p>
</aside>

<p id="status" class="sr-only" role="status" aria-live="polite"></p>
<script>(${client.toString()})()</script>
</body>
</html>
`

await writeFile(new URL('catalog.html', root), html)
console.info(`catalog.html: ${total} icons`)
