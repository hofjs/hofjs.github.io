---
layout: page
parent: Getting started
nav_order: 1
---

# Stateful components

**Stateless components always return the same output if the same input is provided**. Our `my-greeter sample` from the previous section is a good example. It simple renders a welcome message and a date based on the name provided or omitted. This is enough for simple render tasks.

However, often a **more dynamic approach is required**, especially **if user interaction has to be supported**. Lets take a look at these **concept called stateful components** by implementing a small counter app.

First lets create a file called `simple-counter.js` with the following code:

## simple-counter.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    count = 20;

    increment() {
        this.count++;
    }

    templates = html`
        <div>Count: ${this.count}</div>
        <button onclick="${this.increment}">++</button>
        <button onclick="${() => this.count--}">--</button>
    `
})
```

**This defines a new component named `simple-counter`**:
- Within `templates`, we specified a single **render function that returns the value of a `count`** property we defined in our new component.
- In the template we have also defined **two buttons**:
  - The **first button**, when clicked, calls method `increment`, which **increases `count`** by `1`.
  - The **second button decreases** `count`. But here we have specified the method inline. This is possible with simple methods.

Now, **when a user clicks a button**, **`count` is increased or decreased**:
- As a consequence the **parts of the UI that reference this property in the template are automatically updated**.
- In this example, this is the content of the first `div` element.

> **Note**
>
> **Hof.js does not use a virtual dom** and does not compare dom states to calculate changes:
> - It **uses observability to update parts of ui that depend on changed data**.
> - As a consequence, in many cases it **provides O(1) for updates in the worst case**. This is far superior compared with approaches based on virtual dom comparisons.

Now lets use that newly created tag in a simple web page.

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

<iframe src="../../samples/getting-started/stateful-components/simple-counter.html" width="100%" height="250px"></iframe>

And that's it.

**You have just created your first stateful Hof.js component!**

> **Note**
>
> - Html helper function **item() supports an optional lambda parameter `updated`** that **tells if its html output is rendered the first time or updated**. You can use this to conditionally render something, for instance.
> - This **lambda parameter can be named as desired**. You just have to use the same parameter name in the html expression to make it work.
> - Sample:
```js
templates = (updated) => html`
    <div>Count: ${this.count} (${updated})</div>
    <button onclick="${this.increment}">++</button>
    <button onclick="${() => this.count--}">--</button>
`
```



## Multiple state properties

Next we are going to **extend our component** to enable the output of the **counter value** not only in **decimal** but also in **binary and hex**. For this we adapt the component as follows.

```js
customElements.define("simple-counter", class extends HofHtmlElement {
    count = 20;
    base = 10;

    increment() {
        this.count++;
    }

    toNumberSystem(value, base) {
        return value.toString(parseInt(base));
    }

    templates = html`
        <div>
            Count: ${this.toNumberSystem(this.count, this.base)}
            <select value="${this.base}" onchange="${(event) => this.base = event.target.value}">
                <option value="2">Binary</option>
                <option value="10">Decimal</option>
                <option value="16">Hex</option>
            </select>
        </div>
        <button onclick="${this.increment}">++</button>
        <button onclick="${() => this.count--}">--</button>
    `
})
```

**Here we have made the following changes:**
- A new **property `base` represents the selected base** of the number system (2 for binary ...).
- We no longer output `count` directly, but call a **method `toNumberSystem` to output `count` in the chosen format**.
- In the template we added a **dropdown for different number systems**.
  - The current value of `base` is used as initial selection.
  - If the **user selects a dropdown item**, the **`onchange` event is fired**. We provided an inline function that **changes property `base` to the user's selection**.
  - Alternatively, we could have defined a method `change(event)` in our component and then referenced it via `onchange="${this.change}"`. This is recommend for more complex event handlers.
  - Please note here that one gets a reference to the triggering UI element (via `event.target`) or its value (via `event.target.value`) via the automatically provided event handler parameter `event`.

In the html markup, we didn't change a thing.

## Rendered webpage with updated counter component

<iframe src="../../samples/getting-started/stateful-components/simple-counter2.html" width="100%" height="250px"></iframe>

If the **user selects another number system** in the dropdown list, the **`base` property is updated** and thus the part of the template that depends on it is re-rendered, in this case **`${this.toNumberSystem(this.count, this.base)}` is re-rendered** and thus the **value displayed after `Count: ` is updated**. This all happens completely automatically.

> **Note**
>
> The **UI is updated on a property change only** if the component **template references the property**. In our example, we have passed `this.count` and `this.base` to our helper function `toNumberSystem`.
>
> **If we called this function without parameters** from the template and referenced `this.count` and `this.base` only in our function, there would be **no automatic update on property changes** because methods are evaluated only once or when explicitly called. This is by intention.
>
> If you want **automatic updates of computed expressions**, there is a concept called **derived properties** that provides this kind of magic. We will take a look into it in the next step.
