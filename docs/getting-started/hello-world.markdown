---
layout: page
parent: Getting started
nav_order: 0
---

# Hello world

For starters, a small component is to be written that greets a user and tells him the current date.

First lets create a file called `my-greeter.js` with the following code:

## my-greeter.js
        
```js
customElements.define("my-greeter", class extends HofHtmlElement {
    name = "world"

    templates = html`
        <h1>Hello ${this.name}!</h1>
        <p>It's ${new Date()}.</p>
    `
})
```

This defines a new component named `my-greeter`:
- **Within `templates`, we can specify a html fragment that includes arbitrary javascript expressions.**
- In this component **we defined a property called `name`** and provided the **default value `"world"`**. It is important to understand that all **public properties get exposed as attributes and properties** of the component. This means they **can be provided from html markup** and **set by javascript code**.

> **Important**
>
> - The `templates` property accepts a simple html string with arbitrary JS expressions as well as calls to render functions like `item()` or `list()`.
> - These will be covered in detail in a later section of this guide.

Now lets use that newly created tag in a simple web page.

## hello-world.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hello world app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="my-greeter.js"></script>
</head>
<body>
    <my-greeter></my-greeter>
    <my-greeter name="Alex"></my-greeter>
</body>
</html>
```
In this example, we use our component two times:
- The **first time**, we specify it **without its attribute `name`**. This means the **default `world` is used** for rendering.
- The **second time**, we **provide the value `"Alex"`** for the attribute `name`. As a consequence, **`Alex` is outputted**.

> **Note**
>
> **Hof.js components are** are W3C standard based **custom elements**. As a consequence their **tag names must contain a dash**. In other words, tag names have to begin with a prefix such as `app-` or `my-`. You **cannot define** new components with a **one-word tag name** such as `greeter`!

If we open our web page in a browser, we should get the following rendering output:

## Rendered webpage

<iframe src="../../samples/getting-started/hello-world/hello-world.html" width="100%" height="250px"></iframe>

And that's it.

**You have just created your first Hof.js component that can be used in any webpage and with any other web framework!**

> **Note**
>
> We **don't need to provide any hook elements** like other frameworks do **to render our component** because Hof.js components are W3C standard based custom elements.
>
> **Each Hof.js component can directly be used by its tag name in any web page** (or in templates of other HofHtmlElement components).