---
layout: page
parent: Getting started
nav_order: 8
---

# Render functions

In the previous chapters we learned about **two render functions that can be used inside `templates`**. These **functions are important** because Hof.js does not use a virtual dom. It tracks data changes - including array modifications and deep object property changes - and does not take snapshots of ui to calculate ui changes. This means **there is no virtual dom**!

As a consequence **Hof.js offers runtime complexity of O(1) for scalar property updates and for list property updates** (it **falls back to O(N) for mapped properties**, however the factor is very small because it compares data changes and not ui changes in this case).

You still can use arbitrary JavaScript expressions inside a html returning render function including `Array.map`. However it is **recommended to use `list` if you render lists** because there are **significant performance benefits** as mentioned above.

**If you need to render lists within other elements** you should **create separate HofHtmlElement based components** because **`list` can only be used as top level function within `templates`**. This is by intention because good modularity should be encouraged. You should prefer a lot of small Hof.js components over one huge html generating component.

However **sometimes you want to create a list component that also renders regular non list html**. This **is supported by providing multiple render functions within templates** and discussed further below.

## Function item

**This function can be used to efficently render a single html fragment** and has the following syntax: `item((updated) => htmlExpr)` or `(updated) => htmlExpr` (short form):
- Lambda parameter `updated` tells if its html output is rendered the first time or updated.
- You can use this to conditionally render something, for instance.
- Because this function is so important, you can omit its name and just provide the arrow function.

> **Note**
>
> - **Lambda parameter `updated` can be named as desired**.
> - **It is optional**. If you are not interesed in this parameter, create an arrow function with empty parameters, e.g. `() => ""`.

**Sample component**
        
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

## Function list

**This function can be used to efficiently render list properties** and has the following syntax: `list(listProperty, (listItem, insertIndex, updated) => htmlExpr, parentEl, renderParentOnEmptyList)`:
- The first parameter "listProperty" can be any regular or derived property to be rendered.
- The second parameter is an arrow function that is called for each element of the array:
  - Lambda parameter `listItem` references the current array element to be rendered.
  - Lambda Parameter `insertIndex` references the index of the current array element at insertion time.
  - Lambda Parameter `updated` tells if current element is rendered the first time or updated.
- The `htmlExpr` to the right of the arrow of the lambda expression **must return a html string** and is **used as html template for each element in the array**. It transforms an array element into html.
- Optional parameter `parentEl` allows to specify a parent element for the list, e.g. `ul` (default is `div`).
- Optional parameter `renderParentOnEmptyList` causes the parent element of the list not to be rendered if the list should be empty. This is important for valid HTML, e.g. to avoid `ul` without `li` elements.

> **Note**
>
> - **All lambda parameters of list can be named as desired**.
> - **Parameters `insertIndex` and `updated` are optional**. If you are interested in `updated`, but non on `insertIndex` use _ as parameter name.

**Sample component**
        
```js
customElements.define("person-data-list", class extends HofHtmlElement {
     // Property
     persons = [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)];

     // Helper Function
     getBirthday(person) {
         let birthday = new Date();
         birthday.setFullYear(birthday.getFullYear() - person.age);
         return birthday.toLocaleDateString();
     }

     edititem = null; // Callback from parent

     deleteitem = null; // Callback from parent

     templates = list(this.persons, (person, initialInsertIndex, updated) => html`
        <li>
            [${initialInsertIndex}] ${person.name} - ${person.age} years (birthday: ${this.getBirthday(person)})
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
            ${updated ? "(update)" : ""}
        </li>`, "ul"
    )
})
```

## More html render functions

**Currently there is no support for more render functions**. The **render functions provided are the basic constructs because they support scalar and list properties**.

**Conditional render functions etc. are currently not supported** because they **can easily be replaced with the following approaches**:
- Conditional element rendering can be easily achieved by using ternary operator:
```js
() => this.count <= 20 ? "Regular render expression" : ""
```

- Conditional list rendering can be easily achieved by writing a derived list property with a condition to filter out some or all elements in certain cases:
```js
customElements.define("person-data-list", class extends HofHtmlElement {
    persons = [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)];

    get _filteredPersons() { return this.persons.filter(p => p.age > 20) } 

    templates = list(this._filteredPersons, (person) => html`
        <li>
            ${person.name} - ${person.age} years
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
        </li>`, "ul"
    )
})
```

## Multiple render functions

As mentioned above, **sometimes you want to create a list component that also renders regular non list html**. This **is supported by providing multiple render functions within the templates array**.

**Sample**

```js
templates = [
    () => html`<h2>Filtered list</h2>`,
    list(this._filteredPersons, (person, index, updated) => html`
        <li>
            [${index+1}] ${person.name} - ${person.age} years (updated: ${updated})
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
        </li>`, "ul"
    ),
    () => html`<h2>Full list</h2>`,
    list(this.persons, (person, index, updated) => html`
        <li>
            ${person.name} - ${person.age} years (birthday: ${this.getBirthday(person)})
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
            ${updated ? "(update)" : ""}
        </li>`, "ul"
    )
]
```
