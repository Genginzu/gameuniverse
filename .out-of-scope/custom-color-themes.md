# Custom colour themes

Gamers Universe does not offer user-selectable colour themes (custom palettes,
per-user accent colours, theme marketplace). Light/dark mode stays the only
user-facing appearance choice.

## Why this is out of scope

The public site uses the editorial design system: dark editorial surfaces
exposed as Tailwind tokens (`bg-editorial-bg`, `text-editorial-muted`, …) and a
**dynamic accent** derived from the game being viewed (`useGameAccent`,
`DynamicAccent`, `paletteFromHex`). The accent colour is content-driven: it
changes per game page to reflect the game's artwork.

A user-chosen palette would compete with that mechanism:

- either the user theme overrides the per-game accent, and the editorial pages
  lose their identity,
- or the per-game accent overrides the user theme, and the setting does nothing
  on most pages.

Supporting both would mean a second token layer on every editorial component and
doubled visual QA for each palette, for a cosmetic benefit. Profile
personalisation is handled instead through content (banner, bio, pinned items,
cosmetics from the shop).

## Prior requests

- #170: "Themes de couleur personnalises"
