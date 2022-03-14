customElements.define("person-data", class extends HofHtmlElement {
    selected = new Person();
    persons = [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)];

    create() { this.selected = new Person(); }
    edit(person) { this.selected = { ...person }; } // Copy object to avoid live update on text change
    remove(person) { this.persons.splice(this.findIndex(person), 1); this.create(); }
    save() {console.dir(this); 
        if (this.selected.id) // Existing person?
            this.persons.splice(this.findIndex(this.selected), 1, this.selected);
        else
            this.persons.push(new Person(this.selected.name, this.selected.age));

        this.create();
    }
    findIndex(person) { return this.persons.findIndex(p => p.id == person.id);  }
  
    templates = html`
        <fieldset>
            <person-data-input label="Name" value="${this.selected.name}" change="${(event) => this.selected.name = event.target.value}"></person-data-input>
            <person-data-input label="Age" value="${this.selected.age}" change="${(event) => this.selected.age = event.target.value}"></person-data-input>
            <button onclick="${this.save}">Save</button>
        </fieldset>                    
        
        ${this.persons.length} persons in list
        <person-data-list persons="${this.persons}" edititem="${this.edit}" deleteitem="${this.remove}"></person-data-list>
        
        <a href="#" onclick="${this.create}">Create</a>
    `
})