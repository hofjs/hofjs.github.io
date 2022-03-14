---
layout: page
parent: Getting started
nav_order: 7
---

# List rendering

**Hof.js supports deep observability for arrays**. This means that the addition, update or deletion of an array element is observed and the corresponding parts of the user interface are automatically updated - all without the overhead of a virtual Dom.

To familiarize ourselves with this concept, let's implement a small app that shows a list of persons and supports all CRUD operations. The finished app should look and work like the one shown below.

## Rendered webpage

<iframe src="../../samples/getting-started/list-rendering/person-list-app.html" width="100%" height="250px"></iframe>

First, let's implement a simple class to hold a person's data.

## person.js
        
```js
class Person {
    constructor(name = "", age = "") {
        this.id = (name && age) ? Person.counter++ : "";
        this.name = name;
        this.age = age;
    }

    static counter = 1;
}
```

Next, we implement a component `person-data` to render our app. It contains a component of type `person-list` to render a list of persons and ui elements to perform all CRUD operations on the list elements. The editing area consists of two components of type `person-input` and allows the user to enter data for a new person to be added or to update the data of an already selected person.

## person-data.js

```js
customElements.define("person-data", class extends HofHtmlElement {
    selected = new Person();
    persons = [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)];

    create() { this.selected = new Person(); }
    edit(person) { this.selected = { ...person }; } // Copy object to avoid live update on text change
    remove(person) { this.persons.splice(this.findIndex(person), 1); this.create(); }
    save() {
        if (this.selected.id) // Existing person?
            this.persons.splice(this.findIndex(this.selected), 1, this.selected);
        else
            this.persons.push(new Person(this.selected.name, this.selected.age));

        this.create();
    }
    findIndex(person) { return this.persons.findIndex(p => p.id == person.id);  }
  
    templates = [
        () => html`
            <fieldset>
                <person-data-input label="Name" value="${this.selected.name}" change="${(e) => this.selected.name = e.target.value}"></person-data-input>
                <person-data-input label="Age" value="${this.selected.age}" change="${(e) => this.selected.age = e.target.value}"></person-data-input>
                <button onclick="${this.save}">Save</button>
            </fieldset>                    
            
            ${this.persons.length} persons in list
            <person-data-list persons="${this.persons}" edititem="${this.edit}" deleteitem="${this.remove}"></person-data-list>
            
            <a href="#" onclick="${this.create}">Create</a>
        `
    ]
})
```

The above class contains the `persons` and `selected` properties, which represent the list of all persons to be displayed and the currently selected person. Additionally, the class contains several methods that implement CRUD operations:
- The hyperlink at the end of the template calls the method `create`. Here the `selected` property is set to a new `person` instance. Since `this.selected.name` or `this.selected.age` is passed to the respective `person-data-input` component in the template, a new empty person is rendered in the editing area.
- The `edit` and `remove` methods, on the other hand, are passed down to the `person-data-list` component. If the edit or delete link of a person rendered by the `person-data-list` component is pressed, the mentioned methods are called with the affected person as parameter:
  - In `edit` the `selected` property is set to the person whose edit link was clicked in the list, so that their data is displayed in the edit area.
  - In `remove` via array `splice` the selected person is deleted from `persons`.
- Method `save` adds a new person with data from `selected` to array `persons` or updates an array entry if an existing person was selected earlier. Finally `create()` empties the editing area and enables the entry of a new person.
- The `findIndex` method is a helper method to find a person in the array by its ID and return its index.

Now lets take a look at the component `person-list`.

## person-list.js

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

This **component uses an function within the template named `list`** with the following syntax: `list(listProperty, (listItem, insertIndex, updated) => htmlExpr, parentEl, renderParentOnEmptyList)`:
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

Next, lets take a look at the implementation of our `person-input` component.

## person-input.js

```js
customElements.define("person-data-input", class extends HofHtmlElement {
    value = "";
    label = "";
    change = null;

    constructor() {
        super("label")
    }

    templates = html`${this.label}: <input value="${this.value}" onchange="${this.change}" />`
})
```

This component is pretty simple. It renders an `input` element enclosed in a label. It displays the value provided from the parent and calls the `change` callback of the parent if the rendered value was changed by the user. This component is used two times by the parent `person-data` component:

```js
<person-data-input label="Name" value="${this.selected.name}" change="${(event) => this.selected.name = event.target.value}"></person-data-input>
<person-data-input label="Age" value="${this.selected.age}" change="${(event) => this.selected.age = event.target.value}"></person-data-input>
```

As a consequence, this component display the name or age of the person in `selected` and updates the property `selected` with input provided by the user. This means, property `selected` is synched with data displayed and updated by the user.

Finally, lets take a look at the webpage.

## person-list-app.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hello world app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script src="person.js"></script>
    <script src="person-input.js"></script>
    <script src="person-list.js"></script>
    <script src="person-data.js"></script>
</head>
<body>
    <person-data></person-data>
</body>
</html>
```

**And that's it. You successfully created your first app that renders a list!**

> **Note**
>
> You might think: **Why do i have to use `list` if i can just use `Array.map`** to generate output based on an array? The answer is runtime complexity:
> - Method `Array.map` re-renders everything - even if only one item was added, updated or deleted.
> - **Html method `list` provides O(1) in case of regular list properties and O(N) for derived properties in the worst case**. This is far superior compared with approaches based on virtual dom comparisons.