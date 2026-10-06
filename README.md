# ki-icons

Hand-drawn, full-colour illustrations — food, food categories and trophies —
packaged as an [Iconify](https://iconify.design) icon set with the prefix `ki`.
It works like `@iconify-json/mdi`: install it, add it to your Nuxt modules, and write
`ki:banana` wherever you would write `mdi:home`.

Open [`catalog.html`](./catalog.html) in a browser to browse every icon.

| Family   | Names                                          | Example              |
| -------- | ---------------------------------------------- | -------------------- |
| food     | the food itself, in English                    | `ki:banana`          |
| category | `category-` + the category                     | `ki:category-fruit`  |
| trophy   | `trophy-` + the trophy                         | `ki:trophy-sprout`   |

The full list, grouped by family, is in `names.json`.

## Install

```sh
pnpm add ki-icons
# or: npm install ki-icons
```

## Use with Nuxt

It is a Nuxt module (Nuxt ≥ 4.1). One line:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['ki-icons'],
})
```

The module hands the collection to [`@nuxt/icon`](https://github.com/nuxt/icon)
— installing it too if the app does not list it — and ships the whole set in
the client bundle, so icons chosen at runtime (from data) work without a
server, in static and mobile builds as well. Your own `icon` config still
wins over these defaults; your other custom collections are kept.

```vue
<Icon name="ki:banana" size="48" />
```

With Vuetify, if `v-icon` renders through `<Icon>` (as it does for `mdi:`
icons in a Nuxt + `@nuxt/icon` setup), `ki:` icons follow the same rules —
`size="x-small"` … `"x-large"` and numbers give exactly the sizes an mdi icon
gets:

```vue
<v-icon icon="ki:banana" size="small" />
<v-icon icon="ki:category-fruit" size="x-large" />
<v-icon icon="ki:trophy-tree" :size="64" />
```

## Use anywhere else

`icons.json` is a standard `IconifyJSON` document, so any Iconify tool reads
it: `@iconify/vue`'s `addCollection(kiIcons)`, `@iconify/utils`, UnoCSS
`presetIcons({ collections: { ki: () => kiIcons } })`. The source SVGs are
also shipped in `svg/` for direct use.

## Colours

Every icon carries its own palette — a dark outline and a soft offset shadow —
so it does **not** follow `color` / `currentColor`. Iconify renders such
icons as images rather than masks, which keeps the colours intact. Size is
the only thing the surrounding text controls.

## Adding an icon

1. Draw it on a square `viewBox` (24 × 24 for food, any square for the rest),
   with its own fills and no `currentColor`.
2. Save it as `svg/<family>/<kebab-name>.svg`.
3. Run `npm run build` — it regenerates `icons.json`, `names.json` and
   `catalog.html`, and fails on a malformed or unsafe file (scripts, external
   references, event handlers).
4. Commit the SVG together with the regenerated files: they are what
   installs read, with no build step on the consumer's side.

## License

MIT © Gabriele Vinai
