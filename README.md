# Pit-Patch — Spring 2015 Collection

A mobile microsite concept for a **Microsoft UAE** direct-mail campaign marking
the end of support for Windows XP. The conceit: a tongue-in-cheek "luxury
collection" of executive sweat patches — because clinging to unsupported
software is a sweaty business. The final card drops the fashion pretence and
delivers the real message: *call your account executive*.

The experience mimics a high-end product page (à la UGG): a single fixed piece
of "material" with a porthole, through which swatches cross-fade as you swipe.

**Live demo:** https://wr48gh-a11y.github.io/pit-patch/

---

## Running locally

No build step, no dependencies. Serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly works too, though serving over HTTP is closer to
production. Webfonts (Archivo / Archivo Narrow) load from Google Fonts, so a
network connection gives the intended typography.

## The flow

| Screen | What it does |
| ------ | ------------ |
| **Loader** | A needle-and-thread mark stitches in a ring (~3s) while the page settles. |
| **Cover** | The collection title and a *swipe-to-begin* cue. |
| **Browser** | Swipe through the swatches. Each one names the colour and adds to a cart. |
| **Finale** | The last swatch drops the product mask and becomes the Microsoft sign-off. |

## How the swatch mechanic works

Everything you see in the browser screen is built from three stacked layers:

1. **Disc stack** (`z-index: 1`) — every swatch is a circular crop sitting
   behind the frame. Only one is at full opacity at a time; swiping
   cross-fades between them.
2. **Burlap frame** (`z-index: 2`) — one fixed image (`assets/frame.webp`) with a
   transparent porthole punched out of it. The "material" never moves; only the
   disc behind the hole changes. A soft scrim over the lower half keeps the
   text legible against the texture.
3. **UI** (`z-index: 3`) — brand bar, cart, prev/next nav, swatch name, and the
   add-to-cart button (tinted with each swatch's dominant colour).

The cover-to-browser transition opens a circular mask hole out of the cover at
the porthole's position, revealing the collection beneath — a single
"the porthole opens" gesture rather than a hard cut.

## Project structure

```
index.html        Markup for all four screens + the cart drawer
styles.css        All styling. Mobile-first; desktop renders as a phone
                  frame on a gradient (it does not stretch responsively)
app.js            Screen manager, swipe/fade mechanic, cart, touch cursor
assets/
  frame.webp      The burlap "material" with the transparent porthole
  discs/          13 square crops revealed through the hole
                  (12 fabric swatches + the finale illustration)
  needle.svg      Needle-and-thread mark (loader + cover)
  ms-logo.svg     Microsoft logo (finale)
```

## Implementation notes

- **Vanilla only** — no frameworks, bundlers, or libraries.
- **Pointer Events** drive a unified swipe for both touch and mouse, with arrow
  keys as a fallback.
- **Desktop framing** — rather than stretch, the app locks to a `375 / 812`
  aspect ratio and centres as a phone-shaped frame on a gradient backdrop.
- **Touch cursor** — on fine-pointer devices a translucent disc simulates a
  fingertip (presses on click, slides on drag) so the swipe gesture reads on
  desktop.
- **Reduced motion** — `prefers-reduced-motion` disables the loader animation,
  cart transitions, and the porthole-opening reveal.

## Status

This is a **prototype** built for portfolio review. The cart and checkout are
functional UI but not wired to any backend; the finale's "Email now" button is
intentionally decorative.
