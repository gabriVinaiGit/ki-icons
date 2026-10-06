import { readFileSync } from 'node:fs'

// Read rather than imported: a JSON import needs an attribute that not every
// loader of nuxt.config agrees on, and this file must load anywhere.
const collection = JSON.parse(readFileSync(new URL('./icons.json', import.meta.url), 'utf8'))

/**
 * Nuxt module: `modules: ['ki-icons']` and `ki:banana` works wherever
 * `mdi:home` does — `<Icon>`, and `<v-icon>` when Vuetify renders through it.
 *
 * Written as a plain module function instead of `defineNuxtModule` so the
 * package has no dependencies at all: it only hands its collection to
 * @nuxt/icon, which does the rendering.
 */
export default function kiIcons() {}

kiIcons.getMeta = async () => ({
  name: 'ki-icons',
  configKey: 'kiIcons',
  compatibility: { nuxt: '>=4.1.0' },
})

kiIcons.getModuleDependencies = () => ({
  '@nuxt/icon': {
    version: '>=1.0.0',
    // Defaults, not overrides: the app's own `icon` config still wins, and
    // its `customCollections` are kept alongside this one.
    defaults: {
      customCollections: [collection],
      clientBundle: {
        // Names like these are often picked at runtime (from data), where the
        // bundle scan cannot see them — and a static or mobile build has no
        // server to fetch them from. The set is small enough to always ship.
        includeCustomCollections: true,
      },
    },
  },
})
