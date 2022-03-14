---
layout: page
parent: Getting started
nav_order: 9
---

# Component styles

In addition to website-global CSS, CSS styles that only affect the respective HofHtmlElement component are also supported.

They can simple be provided by overriding the `styles` property in the component class.

For example, in the following component, the text in the rendered input field is displayed in blue.

```js
customElements.define("person-data-input", class extends HofHtmlElement {
    value = "";
    label = "";
    change = null;

    constructor() {
        super("label")
    }

    styles = css`
        input { color: blue; }
    `;

    templates = html`
        ${this.label}: <input value="${this.value}" onchange="${this.change}" />
    `
})
```

> **Note**
>
> - Within `styles`, you can reference properties and specify arbitrary javascript expressions, such as `input { color: ${this.someProperty} }`.
> - However, properties and expressions used within `styles` get only evaluated once.
> - If you want to change styling, assign different css classes or styles to elements within `templates` by referencing properties, such as `<input class="${this.someProperty}" />`. This gets automatically observed like any other property referenced within `templates`.