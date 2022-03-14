---
layout: page
parent: Getting started
nav_order: 4
---

# Store objects

**Usually one wants unidirectional data flow**, i.e. parent components pass state to child components and these return changes in the form of events to the parent. The reason for this is,
- parent components can represent a kind of **single source of truth** and the **data flow** can thus be **structured and easily traced top-down** and
- that **code** can be implemented **more robust and less error-prone** than with approaches involving e.g. two-way data binding, since mutual dependencies and cycles of updates can be avoided.

**However, sometimes you need shared state between various components that are placed on different levels of a deep hierarchy of nested components**. This is illustrated in the following figure.

```
Root component
- child component 1
  - grandchild component 1.1
    - great grandchild component 1.1.1
    - great grandchild component 1.1.2
    - ...
  - ...
- ...
- child component N
  - ...
  - grandchild component N.M
    - great grandchild component N.M.1
      - great great grandchild component N.M.1.1
```

**If component 1.1.2 and component N.M.1.1 need access to the same data, it would be necessary to pass the object from the root through umpteen components on the path in between**:
- All components on the path between the root component and the component requiring the data would have to be equipped with additional properties to pass a value downward.
- The same applies to callbacks that the child should invoke to pass new values up to the root.

> **Summing up**
> - Additional properties required and the chain of pass down expressions would significantly complicate the code and make maintenance more difficult.
> - Consequently, this approach is not suitable for sharing data between components at widely separated levels of a deep hierarchy of nested components.

## Store objects coming to the resuce

**Some frameworks offer a concept called stores to solve the problem depicted above**. Usually, this means using an additional library that makes objects  accessible in different components via an non standard mechanism or by using some kind of dependency injection. Often, this does not fit well with the respective framework and developers need to learn an additional paradigm.

**Hof.js does not include a separate store concept, because its deep observability functionality makes concepts like that obsolete.** Simple objects can be used to externalize and share state. In the following, we will take a closer look at this using an example. First, lets create a shared object:

## counter-store.js
        
```js
const counterStore = {
    count: 1,

    get doubled() { return this.count * 2; },

    increment() {
        this.count++;
    }
}
```

As you can see, we simply pulled all the state properties and methods that can change the state out of our component `simple-counter` and externalized them into an object called ´counterStore´. This includes our derived property `doubled`.

> **Important**
> - **Don't use an array as store object** (e.g. `storeArray = []`) because this does not get observed in all situations.
> - Instead, **always define an object and include your array**, e.g. `storeObject = { someArray: [] }`.

Now lets take a look at our updated `simple-counter` component.

## simple-counter-with-store.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    sharedCounter = counterStore;

    templates = html`
        <div>Count: ${this.sharedCounter.count}</div>
        <div>Inverse count: ${-this.sharedCounter.count}</div>
        <div>Doubled count: ${this.sharedCounter.doubled}</div>
        <button onclick="${this.sharedCounter.increment}">++</button>
        <button onclick="${() => this.sharedCounter.count--}">--</button>
      `
})
```

**It's really that simple**:
- We added a property `sharedCounter` that references our externalized object.
- Additionally, we changed all references in the template to include `sharedCounter` as parent object.

If you use this component in a simple webpage and test the app, **everything works as expected - even externalized derived properties**. And the most important part: **If multiple instances of this component** (or other components that use the same store object) are **used, they share the same state**. This means if you click a increment or decrement button of one component all changes are reflected on the other one.

Below you can see a simple web page that contains two counter components. When the value of one of the counters is changed, the new value is immediately reflected in the other one.

## simple-counter-with-store.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple counter with store app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="counter-store.js"></script>
    <script src="simple-counter-with-store.js"></script>
</head>
<body>
    <h1>Simple counter with store app</h1>
    <simple-counter></simple-counter>
    <simple-counter></simple-counter>
</body>
</html>
```

## Rendered webpage

<iframe src="../../samples/getting-started/store-objects/simple-counter-with-store.html" width="100%" height="250px"></iframe>

> **What we have learned**
> - **Usually, you want unidirectional data flow** because it makes for robust and easily traceable code.
> - However, **if you have a complex app with a deep hierarchy of nested components** and the requirement of **shared state between components on different levels** of the hierarchy, it is **better to use a externalized shared object**.
> - **Hof.js supports all features of components in referenced externalized objects, too**. This makes it extremely easy to share state because no new concepts have to be learned and no additional libraries are required.