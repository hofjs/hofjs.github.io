---
layout: page
parent: Installation
nav_order: 3
---

# No module build

To support older browsers without JS module support or to realize a small web application without requiring JavaScript modules, the nomodules variant can be used.

## Import statement

```html
<script src="pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/nomodule/hof.js"></script>
```

## Usage sample

Minimal nomodules example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Counter app</title>
    <script src="../lib/nomodule/hof.js"></script>
    <script>    
        // Inline JS - should be outsourced to external file.      
        customElements.define("main-app", class extends HofHtmlElement {
            templates = html`<h1>Hello at ${new Date()}</h1>`
        });
    </script>
</head>
<body>
    <main-app></main-app>
</body>
</html>
```