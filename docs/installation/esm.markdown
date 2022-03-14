---
layout: page
parent: Installation
nav_order: 0
---

# ESM build

ESM (ECMAScript modules / es modules) is the standard for client-side JS projects.

## Import statement

```js
import { HofHtmlElement, html } from "pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/esm/hof";
```

## Usage sample

Minimal esm example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Minimal demo</title>
    <script type="module">
        // Inline JS - should be outsourced to external file.      
        import { HofHtmlElement, html } from "../lib/esm/hof.js";

        customElements.define("main-app", class extends HofHtmlElement {
            templates = html`<h1>Hello at ${new Date()}</h1>`
        });
    </script>
</head>
<body>
    <p>This must be running on a web server to work, for example the vscode live server.</p>

    <main-app></main-app>
</body>
</html>
```