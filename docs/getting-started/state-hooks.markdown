---
layout: page
parent: Getting started
nav_order: 5
---

# State hooks

**Sometimes, when a property changes**, you not only want to update derived properties and the UI, but also **execute additional arbitrary code**:
- For example, a requirement may be to download new data via a REST service on a value change.
- Another example would be checking for allowed values and refusing to accept a value from a component. This could be useful in routing scenarios, for example, where a routing component only performs a forwarding if the user has the appropriate authorization.
- Simple logging of value changes is also a possible requirement.

**Hof.js supports** this with so-called **state hooks**. **Whenever a property is changed, methods** of a component or an externalized store object **that correspond to a certain naming scheme are called**, if defined by the developer. The following **basic hooks** are supported:
- `<propertyName>BeforeChanged(newValue, oldValue)`: This method is called when a property `propertyName` is to be updated. If it returns nothing or true, the new value is accepted, in case of false it is rejected.
- `<propertyName>AfterChanged(newValue, oldValue)`: This method is called after a property `propertyName` has been set to a new value. No return value is expected.

Let's extend our simple counter component from an earlier exercise to support some of these hooks.

## simple-counter-with-hooks.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    count = 10;

    countBeforeChanged(newValue, oldValue) {
        return newValue <= 20;
    }

    countAfterChanged(newValue, oldValue) {
        console.log(`count changed from ${oldValue} -> ${newValue}`);
    }

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

In this example, if the value of `count` reaches `20`, additional clicks on the increment button have no effect because hook `countBeforeChanged` returns `false` in that case. Additionally, `countAfterChanged` is only called if a value change happened. This means after `count` reaches `20`, this hook is no longer called.

> **Note**
> - **Before-Hooks** are not required to return a value. If they don't, this is interpreted as `true`. **If true is returned**, the **new value is applied to the property**. **If they return `false` on a value change, the new value is discared** and not applied to the property.
> - **After-Hooks don't support return values** because they are called after a value changed has occured.

The following webpage can be used to render our updated counter component.

## simple-counter-with-hooks.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple counter with hooks app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="simple-counter-with-hooks.js"></script>
</head>
<body>
    <h1>Simple counter with hooks app</h1>
    <simple-counter></simple-counter>
</body>
</html>
```

If you want to try it out, interact with the following rendered app. Open the Developer Tools of your browser to see the logging output of our After-Hook.

## Rendered webpage

<iframe src="../../samples/getting-started/state-hooks/simple-counter-with-hooks.html" width="100%" height="250px"></iframe>

In addition, the following **advanced hooks** are supported:
- `<propertyName>BeforePropertyChanged(prop, newValue, oldValue)`: This function is called when an arbitrarily deeply nested subproperty of a property named `propertyName` is to be updated. If nothing is returned or true, the value change is accepted, in case of false it is rejected. This method can be used for complex objects or store objects to react to changes in their subproperties.
- `<propertyName>AfterPropertyChanged(prop, newValue, oldValue)`: This function is called after an arbitrarily deeply nested subproperty of a property named `propertyName` has been set to a new value. No return value is expected. This method can be used for complex objects or store objects to react to changes in their subproperties.

Let's extend our store based counter component from an earlier exercise to practice some of these advanced hooks. First, let's customize the store object and extend it with the hooks that we placed directly in the component in the previous example. 

## counter-store-with-hooks.js
        
```js
const counterStoreWithHooks = {
    count: 1,

    countBeforeChanged(newValue, oldValue) {
        return newValue <= 20;
    },

    countAfterChanged(newValue, oldValue) {
        console.log(`count changed from ${oldValue} -> ${newValue}`);
    },

    get doubled() { return this.count * 2; },

    increment() {
        this.count++;
    }
}
```

As you can see, nothing significant has changed in the implementation of the hooks by externalizing them to the store object. Next, let's take a look at the Counter component, which now uses the store with its hooks.

## simple-counter-with-store.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    sharedCounter = counterStoreWithHooks;

    sharedCounterBeforePropertyChanged(newValue, oldValue) {
        return Math.random() < 0.5;
    }

    sharedCounterAfterPropertyChanged(property, newValue, oldValue) {
        console.log(`sharedCounter.${property} changed from ${oldValue} -> ${newValue}`);
    }

    templates = html`
        <div>Count: ${this.sharedCounter.count}</div>
        <div>Inverse count: ${-this.sharedCounter.count}</div>
        <div>Doubled count: ${this.sharedCounter.doubled}</div>
        <button onclick="${this.sharedCounter.increment}">++</button>
        <button onclick="${() => this.sharedCounter.count--}">--</button>
    `
})
```

We now no longer use a component `count` property directly as in a previous exercise, but reference the `count` property of an external object. In addition, we have also defined two hooks here that are triggered when subproperties of the external object are changed. Again, in the before hook, we have the option to reject value changes of a subproperty by returning `false` in the respective case. In our example, value changes are accepted or rejected depending on a random value.

Below you can see the HTML markup for the realized application.

## simple-counter-with-hooks2.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple counter with store and hooks app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="counter-store-with-hooks.js"></script>
    <script src="simple-counter-with-store.js"></script>
</head>
<body>
    <h1>Simple counter with store and hooks app</h1>
    <simple-counter></simple-counter>
    <simple-counter></simple-counter>
</body>
</html>
```

It's best to just try out the app rendered below.

## Rendered webpage

<iframe src="../../samples/getting-started/state-hooks/simple-counter-with-hooks2.html" width="100%" height="250px"></iframe>

If you use one of the buttons, the count value is changed in both components as before because they access the same externalized store object. Also, you will see console output from both the After hook at the store object level and the After property hook at the component level. In addition, both the before hook at the store object level and the before property hook at the component level decide if a new property value is applied:
- If `Math.random < 0.5` evaluates to `true`, the value change is accepted, otherwise rejected. I.e. a value change is not performed for all button clicks.
- When the value 20 is reached, no more value changes are accepted.

**The shown concept is very powerful, because it works in components as well as in objects referenced by components. Also, subproperties nested arbitrarily deep are supported.**

> **Note**
>
> **Hooks are only supported for regular properties**. Value changes of **derived properties cannot be intercepted or rejected** by design.