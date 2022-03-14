---
layout: page
has_children: true
nav_order: 1
---

# Installation

**Hof.js can be installed by using npm**.

```
npm install @hofjs/hofjs
```

This **package contains builds in esm, cjs and nomodules formats**. While cjs is suitable for server-side JS projects (Node projects), esm is the standard for client-side JS projects. To support older browsers without JS module support or to realize a small web application without requiring JavaScript modules, the nomodules variant can be used.

The following examples show the **different import alternatives**.

```js
import { HofHtmlElement, html } from "pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/esm/hof";
```

```js
const { HofHtmlElement, html } = require("pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/cjs/hof");
```

```html
<script src="pathToNodeFolderOfApp/node_modules/@hofjs/hofjs/lib/nomodule/hof.js"></script>
```

Usage examples for the different package formats can be found in the links below. There is also a [starter template](https://github.com/hofjs/starter) available for new projects that includes all required packages and supports Hot Module Reloading.


**Hof.js also supports autocomplete for your HofHtmlElement components including templates and styles within Visual Studio Code**. Follow the step by step guide to setup vscode to get the best developer experience.