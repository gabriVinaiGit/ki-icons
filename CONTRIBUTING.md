# Contributing to ki-icons

Thanks for helping. There are two ways in:

- **Ask for an icon.** Open an [icon request](https://github.com/gabriVinaiGit/ki-icons/issues/new?template=icon-request.yml).
  Search the [catalog](https://gabrivinaigit.github.io/ki-icons/catalog.html)
  and the open requests first; a 👍 on an existing request helps decide what
  gets drawn next.
- **Draw one.** Read the guidelines below and open a pull request. If it is a
  bigger addition (a whole new family, many icons), open a request first so we
  can agree on names and scope.

## Drawing guidelines

Every icon should look like it belongs next to the others at 24 px.

- **Canvas.** A square `viewBox`: `0 0 24 24` for food, any square for the
  other families. Keep a little breathing room at the edges.
- **Outline.** A dark outline (`#2f3a2c`), round caps and joins, at a weight
  matching icons of the same family.
- **Colour.** Flat, soft fills with their own colours. Never `currentColor`:
  ki icons carry their palette and do not follow text colour.
- **Depth.** Where the family uses one, a soft offset shadow behind the shape,
  as in the existing icons. No gradients, no filters.
- **Grounding.** Worlds stand on their island; deco and trees on their base.
- **Legibility.** Check it at 24 px and 48 px, on light and dark backgrounds.
  The catalog's *Background* switch is made for this.

Open an existing icon of the same family in `svg/` and match it — that is the
best reference.

## Files and names

- Path: `svg/<family>/<kebab-name>.svg`, one `<svg>` root with a numeric `viewBox`.
- The icon name is the file name for food (`ki:banana`) and `<family>-<file name>`
  for everything else (`svg/deco/bench.svg` → `ki:deco-bench`).
- Names are English, singular unless the thing is plural by nature (`peas`).
- Allowed: shapes, paths, groups and their presentation attributes. Rejected by
  the build: `<script>`, `<style>`, `<image>`, `<use>`, `<foreignObject>`,
  `href`, `url(…)` and event handlers.

## Build and check

```sh
npm run build   # regenerates icons.json, names.json, catalog.html, .github/preview.svg
npm test        # the same checks, writes nothing: CI runs this on every push
```

Commit the SVGs together with the regenerated files. No dependencies to
install: plain Node 22.

## Versioning

Apps store icon names in their data, so a name is a promise:

- new icon → minor version
- redrawn icon → patch version
- renamed or removed icon → major version (avoid it)

## License

By contributing you agree that your work is released under the
[MIT License](./LICENSE) of this project.
