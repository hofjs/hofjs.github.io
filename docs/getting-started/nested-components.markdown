---
layout: page
parent: Getting started
nav_order: 3
---

# Nested components

Even if you can, **you should not write components that are too large**, because this leads to poorly maintainable code.

Instead, **you should break a large component into several small ones** that are **merged by the formerly large one**. This concept is called **nested components**. If we apply this approach recursively, we can build a whole app by nesting Hof.js components.

To illustrate this idea, lets write a **simple app that performs a live conversion between decimal and hex while the user is typing**:
- The user should be able to enter either a decimal or a hex number and the updated value should appear in the other input field while he is typing.
- If invalid values are entered instead of numbers, an error message should appear.
- The app should look like the following (interactive) illustration.

## Rendered webpage

<iframe src="../../samples/getting-started/nested-components/number-converter-app.html" width="100%" height="250px"></iframe>

To make this work, we are going to **divide the task into multiple components**:
- Component `number-converter-app`: Implements html of whole webpage body. In its own template it contains a heading and a `number-converter` tag.
- Component `number-converter`: Represents ui and logic of number conversion - it is composed of:
  - a `number-input.js` component to display and input a **decimal value**
  - another `number-input.js` component to display and input a **hex value**
  - additional `number-info` component to render an **error message** if the entered value is not valid

First, lets take a look at our webpage markup. This is pretty simple because the whole functionality and rendering html is encapsulated in our number-converter-app component.

## number-converter-app.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Number converter app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="number-converter-app.js"></script>
    <script src="number-converter.js"></script>
    <script src="number-input.js"></script>
    <script src="number-info.js"></script>
</head>
<body>
    <number-converter-app></number-converter-app>
</body>
</html>
```

> **Note**
>
> This **sample webpage contains a script tag for each component** that is used either in the html markup of the webpage or in the template of another component.
>
> **This is not recommended**. In real applications, you should **either bundle all script files** so that only one script tag is needed for all components **or, even better, rely on modular JavaScript**.
>
> **Hof.js** supports this and **includes an ESM version of the framework** in its npm package. When switching to **modular JavaScript**, **only the root component needs to be included** in the HTML web page, since **each component can itself include required other components** via import.

Our root component `number-converter-app` is similarly simple. It outputs a heading for our webpage / app and renders a `number-converter` component.

## number-converter-app.js
        
```js
customElements.define("number-converter-app", class extends HofHtmlElement {
    templates = html`
        <h1>Number converter app</h1>
        <number-converter></number-converter>
    `
})
```

**Component `number-converter`** is a lot more complex. It **contains all state, logic and rendering for our number conversion**:
- Property `value` represents the initial or last number entered by the user.
- Property `scale` represents the number system of the initial or last number entered by the user.
- Method `change` applies new values for properties `value` and `scale`.
- In the template two `number-input` components and one `number-info` component are rendered:
  - The first `number-input` renders a label for decimal input and an input field to accept a decimal value provided by the user.
  - The second `number-input` renders a label for hex input and an input field to accept a hex value provided by the user.
  - The `number-info` component shows a error if a number provided by the user is not valid.

## number-converter.js
        
```js
customElements.define("number-converter", class extends HofHtmlElement {
    value = 16;
    scale = "d";
    
    change(value, scale) {
        this.value = value; this.scale = scale;
    }

    templates = html`
        <div>
            <number-input scale="d" value="${this.scale == 'd' ? this.value : parseInt(this.value, 16)}" change="${this.change}"></number-input>
            <number-input scale="h" value="${this.scale == 'h' ? this.value : parseInt(this.value).toString(16)}" change="${this.change}"></number-input>
            <number-info value="${this.scale == 'd' ? this.value : parseInt(this.value, 16)}"></number-info>
        </div>
    `
})
```

**State is passed down from our `number-converter` component to its child components**:
- To reuse `number-input` for decimal and hex, different values for `scale` and `value` are passed down.
- By checking the `scale` property, the format of the number entered and stored in the `value` property is checked. Then, depending on the input field, the current value is taken or converted to the other format and passed down to the correspondig `number-input`.
- Similarly, the current format stored in `scale` is passed down so that the respective `number-input` can output a suitable label like "decimal" or "hex" in front of the input field to be rendered.
- Please note that our `change` function is passed down. This can then be called from a `number-input` with the new value entered by the user and the number format of the respective `number-input` component.
- Similarly, the decimal representation of the current value is passed down to `number-info` so that it can check the input to see if it is a valid number and output an error message if necessary.

Now lets take a look at component `number-input`.

## number-input.js
        
```js
customElements.define("number-input", class extends HofHtmlElement {
    value = null;
    scale = null;
    change = null;

    _SCALE_NAMES = { d: 'Decimal', h: 'Hex' }

    templates = html`
        <label>
            ${this._SCALE_NAMES[this.scale]}:
            <input value="${this.value}" oninput="${(event) => this.change(event.target.value, this.scale)}"/>
        </label>
    `
})
```

The **`number-input` component renders the current value and a label that shows "Decimal" or "Hex" depending on the `scale` property**:
- This means the first `number-input` in the template of the `number-converter` component is going to render "Decimal" because value "d" was passed down.
- In contrast, the second `number-input` renders the label "Hex" since the value "h" was passed down.
- Finally, the `value` obtained from the parent `number-converter` tag is displayed in an `input` field.

**What happens now when the user types in a new value in an `input` field**?
1. First, the passed down `change` method from the parent `number-converter` is called. The current value provided by the user and number format of the `input` field are passed up to the `number-converter`.
2. As a consequence the parent `number-converter` updates its properties with the new `value` and `scale` received from the child `number-input`.
3. This leads to a rerendering of the parts of the `number-converter` template that depend on these properties. This affects the two `number-input` child components, which receive the new (converted) `value` via their properties and thus re-render the affected parts of their templates on their part. Finally, they show the new (converted) number.

Finally, lets take a look at the component `number-info`.

## number-info.js
        
```js
customElements.define("number-info", class extends HofHtmlElement {
    value = null;

    templates = () => isNaN(this.value, this.scale) ? `<p>No valid number!</p>` : ``
})
```

This component ist pretty simple. It accepts a decimal number and checks if its a valid one. If this is the case it returns an empty string. Otherwise an error message is rendered.

And thats it.

**You have just implemented a simple app that demonstrates nesting of components and unidirectional dataflow!**

> **What we have learned**
> - **State** (including references to event handlers) is **passed down from parent to child** components.
> - **Events from** a **child** component **go up to its parent** component.
> - This leads to the following **unidirectional flow**:
>   1. **Initial state of parent** component is **passed down** and **rendered by the child** components.
>   2. **If a user changes something** by **interacting with a child component**, a **parent component event handler is called with the new value(s) provided by the user**.
>   3. As a result the **parent updates its properties**.
>   4. This **leads to a rerendering of the parts of the parent component template that depend on these properties**. **These are the child components**, which thus **receive new values via their properties** and thus in turn **re-render the parts of their templates** that depend on them.