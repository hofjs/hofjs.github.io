---
layout: page
parent: Installation
nav_order: 1
---

# CJS build

CJS (CommonJS) is suitable for server-side JS projects (Node projects).

## Import statement

```js
const { HofHtmlElement, html } = require("pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/cjs/hof");
```

## Usage sample

Minimal cjs example
```js
// window.customElements polyfill must be available to use
// component helper to create component for server-side rendering

const { HofHtmlElement, html } = require("../lib/esm/hof.js");

customElements.define("main-app", class extends HofHtmlElement {
    templates = html`<h1>Hello at ${new Date()}</h1>`
});

...
```