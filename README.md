# A Simple Question

A playful browser interaction built with HTML, CSS, and JavaScript. It asks a question, makes the No button evade interaction, and advances through a reaction dialog when the visitor chooses Yes.

[![Stars](https://img.shields.io/github/stars/ak1458/simple-trivia-app?style=flat-square)](https://github.com/ak1458/simple-trivia-app/stargazers)
[![Watching](https://img.shields.io/github/watchers/ak1458/simple-trivia-app?style=flat-square)](https://github.com/ak1458/simple-trivia-app/watchers)
[![Forks](https://img.shields.io/github/forks/ak1458/simple-trivia-app?style=flat-square)](https://github.com/ak1458/simple-trivia-app/forks)
[![Activity](https://img.shields.io/github/last-commit/ak1458/simple-trivia-app?style=flat-square)](https://github.com/ak1458/simple-trivia-app/activity)

[![License: MIT](https://img.shields.io/badge/License-MIT-64748b?style=flat-square)](LICENSE)

**[Run](#run-locally) · [How it works](#how-it-works) · [Customization](#customization) · [License](#license)**

## Run locally

No Node dependency installation or build is required. Clone the repository and serve the static directory:

```bash
git clone https://github.com/ak1458/simple-trivia-app.git
cd simple-trivia-app
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Alternatively, open `index.html` directly. Remote fonts and Tenor sticker embeds need internet access; their availability is separate from the local JavaScript.

## How it works

The current app is an interactive joke page, despite the repository’s older trivia name. It has no question bank, trivia score engine, or backend. The dialog can be closed and the interaction repeated.

The interaction uses DOM events and bounded positioning within the playground. The code tracks how many times the button has escaped and adjusts the interface as interaction continues. It includes reduced-motion handling; test keyboard and touch behavior as well as a mouse before changing the animation logic.

## Project structure

| File | Responsibility |
| --- | --- |
| [index.html](index.html) | Semantic page, Yes/No buttons, dialog, and external embed markup. |
| [style.css](style.css) | Layout, themes, button and dialog appearance, responsive styles. |
| [script.js](script.js) | Event handlers, dodge positioning, state, and dialog behavior. |

## Customization

Update question/dialog copy in the HTML and JavaScript together. Keep the DOM IDs aligned with the selectors in `script.js`. Review all external sticker/font URLs and any final navigation action before publishing a modified page. The MIT license applies to project code; external media retains its original terms.

## Verification

This repository has no package-defined test suite. Manually check initial render, Yes activation, the No interaction, dialog dismissal/progression, a narrow mobile viewport, keyboard focus, and reduced-motion preference. A screenshot is presentation evidence, not a substitute for those interaction checks.

## Versions and activity

No version tag or published release was recorded in this snapshot. The source runs directly as a static page and is not distributed as a GitHub Packages library. Live badges link to the repository’s actual counts and activity; they do not add stars, watchers, or forks.

## License

MIT — see [LICENSE](LICENSE). Preserve the license when reusing project code and review the terms of external assets separately.
