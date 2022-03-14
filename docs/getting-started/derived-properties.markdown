---
layout: page
parent: Getting started
nav_order: 2
---

# Derived properties

**Derived properties (computed properties) are recalculated whenever one of the dependent properties changes**. They are **specified as a property with only a getter** that **references** one or more other **regular properties.**

To illustrate this concept, let's extend our simple counter component so that the duplicate and inverted values are also displayed and updated whenever the counter is changed.

## simple-counter.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    count = 10;

    get doubled() { return this.count * 2; }

    increment() {
        this.count++;
    }

    templates = html`
        <div>Count: ${this.count}</div>
        <div>Inverse count: ${-this.count}</div>
        <div>Doubled count: ${this.doubled}</div>
        
        <button onclick="${this.increment}">++</button>
        <button onclick="${() => this.count--}">--</button>
    `
})
```

**This includes the following changes compared to our earlier implementation**:
- We extended our component template to **additionally output the inverse value** of the counter **and the doubled value** of the counter.
- As you can see, you can specify arbitrary expressions in the template, e.g. the inversion of the counter. For more complex logic, however, you should put it in a separate property, which we did for `doubled`. This is simply calculated by multiplying the value of the property `count` by    `2`.

Now, **when a user clicks on one of the buttons**, the following actions are triggered:
- The value of the **`count` variable is increased or decreased** as it was in the earlier implementation. As a consequence the **parts of the UI that reference this variable in the template are automatically updated**. In this example, this is the content of the first and second div elements.
- Since the **`doubled` property** is not an independent property but **depends on `count`**, it **is also automatically recalculated** because it is also referenced in the template (otherwise it would not be recalculated for performance reasons). **This in turn automatically re-renders the third div** because it references the `doubled` property.

Now lets use that updated counter in a web page. This is not different to our previous html markup.

## simple-counter.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple counter app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="simple-counter.js"></script>
</head>
<body>
    <h1>Simple counter app</h1>
    <simple-counter></simple-counter>
</body>
</html>
```

This gives us the following rendering output:

## Rendered webpage

<iframe src="../../samples/getting-started/derived-properties/simple-counter3.html" width="100%" height="250px"></iframe>

And that's it.

**You have just created your first Hof.js component that uses derived properties!**

> **Note**
>
> **Derived properties** are a **powerful construct** to automatically update properties that depend on other properties. They are defined by
> writing a **readonly property that has only a getter**.
>
> **If you don't need automatic updates**, but only a simple helper method (such as `toNumberSystem` in the stateful components example from earlier) or an event handler, **don't use derived properties! Write a simple method instead!**