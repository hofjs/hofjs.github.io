---
layout: page
parent: Getting started
nav_order: 6
---

# Component lifecycle

**Each Hof.js component has a lifecycle that corresponds to that of regular custom elements**. Via special methods, you can hook in here and have your own code executed when a component enters the respective state. **Particularly important are the following lifecycle methods**:
- `init()`: Called when a HofHtmlElement is attached to the DOM of the web page. Useful for initializations and to register DOM event handlers.
- `dispose()`: Called when a HofHtmlElement is unhooked from the DOM of the web page. Useful to clean up DOM event handlers.

Let's look at this concept with an example where our counter from the first examples is automatically incremented by 1 every second. This could be extended to a stopwatch for instance.

## simple-counter.js
        
```js
customElements.define("simple-counter", class extends HofHtmlElement {
    count = 10;

    #timerId = 0;

    init() {
        this.#timerId = setInterval(() => this.count++, 1000);
    }

    dispose() {
        clearInterval(this.#timerId);
    }

    templates = [
        () => html`<div>Count: ${this.count}</div>`
    ];
})
```

> **Note**
>
> - **Private variables (variables with leading #) can be used in lifecycle hooks, but are not currently supported within templates**.
> - If you want to express a variable as private, but **need to refer to it within a template, use _variableName instead**. This won't give you true private variables, but you express the intent that no one should change them directly for consistency.

The following webpage can be used to render our updated counter component.

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

If we open our web page in a browser, we should get the following rendering output:

## Rendered webpage

<iframe src="../../samples/getting-started/component-lifecycle/simple-counter4.html" width="100%" height="250px"></iframe>

Another example shows the use of `init()` to asynchronously download data from a JSON service via fetch API. This involves updating a component property in the callback and subsequently re-rendering the dependent part of the UI.

## todo-list.js
        
```js
customElements.define("todo-list", class extends HofHtmlElement {
    todos = [];

    constructor() {
        super("ul");
    }

    async init() {
        this.todos = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
            .then(response => response.json());             
    }

    templates = () => this.todos.map(todo => html`
        <li>${todo.title} (${todo.completed ? "completed" : "not completed"})</li>`
    ).join("")
})
```

> **Note**
>
> **As an alternative to `init` you could call `fetch` from a constructor of your component**:
> - This could improve performance, because it happens earlier than `init()`. However, constructors cannot be marked as `async`.
> - This means that you cannot use `await` and must use code like the one shown below:
```js
constructor() {
    super("ul");    
    fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
        .then(response => response.json()).then(todos => this.todos = todos);             
}
```

The following webpage can be used to render our todo list component.

## todo-list.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Todo list app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="todo-list.js"></script>
</head>
<body>
    <h1>Todo list app</h1>
    <todo-list></todo-list>
</body>
</html>
```

If we open our web page in a browser, we should get the following rendering output:

## Rendered webpage

<iframe src="../../samples/getting-started/component-lifecycle/todo-list.html" width="100%" height="250px"></iframe>

And that's it. You have just asynchronously downloaded data from a json service and rendered it in html.

> **Important**
>
> - The **call to `map` to render a list should only be used to render output that is not going to be updated!** This means it should not depend on properties that are going to change. This is due to the fact that map does a complete rendering.
> - Instead, the **render function `list()` should be used as default**, which **supports an observability for array elements**, whereby only the exact parts of the UI are re-rendered that are affected by an array change, e.g. the part of the UI that visualizes the newly added, edited or deleted element of an array.
> - This render function is going to be discussed in another part of this guide.