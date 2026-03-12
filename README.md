# Phosphor Icons in CSS

[![npm version](https://img.shields.io/npm/v/phosphor-icons-css-vars.svg)](https://www.npmjs.com/package/phosphor-icons-css-vars)
[![LICENSE: MIT](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

**A 100% pure CSS icon implementation of [Phosphor Icons](https://phosphoricons.com/) using CSS custom properties and SVG masks**

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
<link rel="stylesheet" href="phosphor-icons-regular.min.css" />
<link rel="stylesheet" href="phosphor-icons-fill.min.css" />
<link rel="stylesheet" href="phosphor-icons-duotone.min.css" />
<link rel="stylesheet" href="phosphor-icons-thin.min.css" />
<link rel="stylesheet" href="phosphor-icons-light.min.css" />
<link rel="stylesheet" href="phosphor-icons-bold.min.css" />
```

Each stylesheet includes CSS variables and ready-made classes so you can use icons like a webfont:

```html
<i class="ph ph-smiley"></i>
```

Use the base class <code>ph</code> plus the icon class <code>ph-&lt;name&gt;</code> (e.g. <code>ph-heart</code>, <code>ph-arrow-right</code>). Icons scale with <code>font-size</code> and inherit text color via <code>currentColor</code>.

For custom styling, use the CSS variables directly:

```css
.my-icon {
  width: 24px;
  height: 24px;
  background-color: currentColor;
  mask-image: var(--ph-icon-heart);
  mask-size: contain;
}
```

Each stylesheet is approx 900 KB (90 KB gzipped) and includes all 1513 icons. **I recommend removing icons you don't need to reduce the file size and improve performance.**

## Browser support

`mask-image` is supported unprefixed in all modern browsers (Chrome 120, Safari 15.4, Firefox 53 — [caniuse](https://caniuse.com/?search=mask-image)). To widen support (e.g. older Safari), use [Autoprefixer](https://github.com/postcss/autoprefixer) to add `-webkit-mask-image` alongside `mask-image`. Because this uses CSS variables, the same variables are referenced from `:root` without increasing filesize. Neat!

## License

[MIT](LICENSE)
