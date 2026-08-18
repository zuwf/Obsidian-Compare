# Obsidian Compare

Compare notes side by side, like a spec-comparison table (in the style of 91mobiles' phone comparison tool). Pick two or more notes and get a table of their frontmatter properties, aligned row by row, with differences highlighted.

## Features

- **Comparison view** — opens as a full workspace tab by default, so it has room for many notes side by side and works well on both desktop and mobile (a narrow sidebar panel doesn't scale past a couple of notes). It can also be pinned to the right sidebar instead, via settings.
- **Responsive table** — the property column and header row stay pinned in place while you scroll, so with 5, 10, or more notes you can scroll horizontally and still tell which property and which note you're looking at.
- **Add / remove notes** — pick notes with a fuzzy search modal; remove any column with one click.
- **Highlight differences** — rows where values differ across notes are highlighted so they stand out.
- **Hide identical rows** — optionally collapse the table down to only the properties that differ.
- **Image row** — if your notes have an image/cover property (e.g. product photos, book covers), it's rendered as a picture row at the top of the table.
- **Persistent** — the comparison list is remembered between Obsidian sessions.

## Usage

1. Add frontmatter properties to the notes you want to compare, e.g.:

   ```yaml
   ---
   price: 699
   ram: 8GB
   battery: 5000mAh
   image: "[[phone-a-photo.png]]"
   ---
   ```

2. Open the comparison table via the ribbon icon (columns icon) or the command palette: **Compare: Open comparison table**.
3. Click **+ Add note** and pick the notes to compare.
4. Use **Compare: Add current note to comparison** to quickly add whatever note you're viewing.

## Settings

- **Open location** — open the comparison view as a full tab (default) or in the right sidebar.
- **Highlight differences** — toggle the diff highlighting.
- **Hide identical rows** — only show properties that differ.
- **Image property** — the frontmatter key used for the image row (default: `image`).
- **Ignored properties** — frontmatter keys to always leave out (default: `tags, cssclass, aliases`).

## Development

```bash
npm install
npm run dev    # watch build
npm run build  # production build
```

This is a standard esbuild-based Obsidian plugin. Symlink or copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/obsidian-compare/` to test it in a real vault.
