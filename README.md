# Phosphor Icons in CSS

A 100% pure CSS icon implementation of [Phosphor Icons](https://phosphoricons.com/) using CSS custom properties and SVG masks

- No JavaScript, dependencies, SVGs or webfonts needed!
- 100% accessible, fast and easy-to-use
- Includes all 1513 icons in thin, light, fill, bold, regular and duotone sets
- Icons can be colored any color by setting a `background-color:`
- Icon can be sized any size by setting height and width of the div (the icon scales to fit using mask-size: contain;)

By using CSS custom properties the icons can also be used as background-images instead of masks if needed.

## Advantages of using CSS variables

- **Theme-aware** — Use a single stylesheet and change icon color via `color` or CSS variables; no need for separate icon assets per theme.
- **One request** — All icons live in one CSS file instead of hundreds of SVGs or a webfont, reducing HTTP requests.
- **Override locally** — Set `--ph-icon-*` or `background-color` on any element (or a parent) to style icons without extra classes.
- **Smaller payload** — Icons are defined once as data URIs in variables; repeated use doesn’t duplicate the SVG data in the DOM.
- **No JS** — No runtime, no icon components, no tree-shaking step; works with plain HTML/CSS and any framework.
- **Cascade-friendly** — Icons inherit `currentColor` and variables from the cascade, so they fit naturally into your design system.

## Usage

```html
<link rel="stylesheet" href="phosphor-icons-regular.css" />
<link rel="stylesheet" href="phosphor-icons-fill.css" />
<link rel="stylesheet" href="phosphor-icons-duotone.css" />
<link rel="stylesheet" href="phosphor-icons-thin.css" />
<link rel="stylesheet" href="phosphor-icons-light.css" />
<link rel="stylesheet" href="phosphor-icons-bold.css" />
```

```css
.my-icon {
  width: 24px;
  height: 24px;
  background-color: currentColor;
  mask-image: var(--ph-icon-heart);
  mask-size: contain;
}
```

Each stylesheet is approx 800KB (80KB gzipped) and includes all 1513 icons. I recommend removing icons you don't need to reduce the file size and improve performance.

## License

[MIT](LICENSE)
