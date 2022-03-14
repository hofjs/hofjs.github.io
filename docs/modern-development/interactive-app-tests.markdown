---
layout: page
parent: Modern development
nav_order: 2
---

# Interactive app tests

Since Hof.js, unlike other frameworks, does not compare UI snapshots, but the data itself is reactive, it is possible to modify JavaScript (store) objects used in Hof.js components directly from the browser and observe the corresponding UI updates. This includes both simple property assignments, array operations such as push and also array indexer accesses.

To demonstrate this, the code of an app that uses complex derived properties will be shown below. Afterwards, it will be shown how to test changes in the data in the browser.

// debugging aktivieren

**Lets update our person list app from earlier to use modular js.**

## person-list-app.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Personlist app</title>
    <script src="../../lib/nomodule/hof.js"></script>
    <script>
        class Person {
            constructor(name = "", age = "") {
                this.id = (name && age) ? Person.counter++ : "";
                this.name = name;
                this.age = age;
            }

            static counter = 1;
        }
    </script>
    <script>
        const personStore = {
            selected: new Person(),
            persons: [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)],

            changeName(value) { this.selected.name = value; },
            changeAge(event) { this.selected.age = event.target.value; },

            create() { this.selected = new Person(); },
            edit(person) { this.selected = { ...person }; },
            remove(person) { this.persons.splice(this.findIndex(person), 1); this.create(); },
            save() {
                if (this.persons.some(p => p.id == this.selected.id)) // Existing person?
                    this.persons.splice(this.findIndex(this.selected), 1, this.selected);
                else
                    this.persons.push(new Person(this.selected.name, this.selected.age));

                this.create();
            },
            findIndex(person) { return this.persons.findIndex(p => p.id == person.id);  },
        }

        class PersonDataInput extends HofHtmlElement {
            value = "";
            label = "";
            change = null;

            constructor() {
                super("label");
            }

            templates = html`
                ${this.label}: <input value="${this.value}" onchange="${this.change}" />
            `
        }

        customElements.define("person-data-input", PersonDataInput)

        class PersonDataList extends HofHtmlElement {
            persons = [];

            get _filteredPersons() { return this.persons.filter(p => p.age > 20) } 

            edititem = null;

            deleteitem = null;

            templates = [
                item(() => html`<h2>Full list</h2>`),
                list(this.persons, (person, index, updated) => html`
                    <li>
                        ${person.name} - ${person.age} years
                        [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
                        [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
                        ${updated ? "(update)" : ""}
                    </li>`, "ul"
                ),
                item(() => html`<h2>Filtered list</h2>`),
                list(this._filteredPersons, (person, index, updated) => html`
                    <li>
                        [${index+1}] ${person.name} - ${person.age} years (updated: ${updated})
                        [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
                        [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
                    </li>`, "ul"
                )
            ];
        }

        customElements.define("person-data-list", PersonDataList)

        class PersonData extends HofHtmlElement {
            personStore = personStore;

            constructor() {
                super();
                fetch('https://jsonplaceholder.typicode.com/todos?_limit=10')
                    .then(response => response.json()).then(list => list.map(todo => new Person(todo.title, todo.id))).then(x => this.personStore.persons = x);             
            }
            
            templates = html`
                <fieldset>
                    <person-data-input label="Name" value="${this.personStore.selected.name}" change="${(event) => this.personStore.changeName(event.target.value)}"></person-data-input>
                    <person-data-input label="Age" value="${this.personStore.selected.age}" change="${(event) => this.personStore.changeAge(event)}"></person-data-input>
                    <button onclick="${this.personStore.save}">Save</button>
                </fieldset>                    

                ${this.personStore.persons.length} persons in list
                <person-data-list persons="${this.personStore.persons}" edititem="${this.personStore.edit}" deleteitem="${this.personStore.remove}"></person-data-list>
                <person-data-list persons="${this.personStore.persons.filter(x => x.name.includes('de'))}" edititem="${this.personStore.edit}" deleteitem="${this.personStore.remove}"></person-data-list>

                <a href="#" onclick="${this.personStore.create}">Create</a>
            `
        }

        customElements.define("person-data", PersonData)
    </script>
</head>
<body>
    <h1>Personlist app</h1>
    <person-data></person-data>
</body>
</html>
```

Next, lets open Chrome developer tools by pressing F12. Type the depicted statements and watch the changes in the UI.

## Initial rendering
![initial rendering](initial-rendering.png)

## Rendering after array push
![array push rendering](array-push-rendering.png)

## Rendering after array element change
![array index rendering](array-index-rendering.png)

## Rendering after object property update
![object update rendering](object-update-rendering.png)

## Rendering after simple property update
![property update rendering](property-update-rendering.png)

## Rendering after simple property update 2
![property update rendering 2](property-update-rendering2.png)

## Rendering after call to store method
![store update rendering](store-update-rendering.png)


## Rendered webpage

<iframe src="../../samples/modern-development/app-tests/person-list-app.html" width="100%" height="300px"></iframe>