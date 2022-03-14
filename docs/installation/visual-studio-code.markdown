---
layout: page
parent: Installation
nav_order: 4
---

# Visual Studio Code

**Hof.js supports autocomplete for your HofHtmlElement components including templates and styles within Visual Studio Code**.

To enable support, you need to do the following:
1. Install Visual Studio Code extension `lit-plugin`.
2. Modify workspace settings for lit-plugin to enable `strict mode` and disable `complex property warning` (because Hof.js supports this without performance problems in contrast to other frameworks).
3. Optionally, disable `missing input rule` of lit-plugin if you use the nomodule build of Hof.js.

Additionally, to support attribute detection, you have to add jsdoc to your HofHtmlElement class. This allows `lit-plugin` to provide autocomplete for valid attributes of your HofHtmlElement component. This is described later in this tutorial.


## 1. Installation of lit-plugin extension

![lit-plugin installation](lit-plugin-install.png)

## 2. General configuration of lit-plugin extension

![lit-plugin enable strictmode setting](lit-plugin-strictmode.png)

![lit-plugin disable complexproperties warning](lit-plugin-complexproperties.png)

## 3. Optional configuration of lit-plugin extension

This step is only required if you use the nomodule build of Hof.js. If you do use the esm build of Hof.js and use js modules (recommended for modern apps) don't change this setting to `off` because it checks for missing import statements regarding HofHtmlElement components.

![lit-plugin disable missing imports check](lit-plugin-missingimport.png)

## 4. Create modern apps with modular Hof.js

To get you started with modular Hof.js app development, choose "Modern development" in the side navigation.