customElements.define("person-data-list", class extends HofHtmlElement {
     // Property
     persons = [new Person("Alex", 21), new Person("Chris", 19), new Person("Mike", 19)];

     // Helper Function
     getBirthday(person) {
         let birthday = new Date();
         birthday.setFullYear(birthday.getFullYear() - person.age);

         return birthday.toLocaleDateString();
     }

     edititem = null;

     deleteitem = null;

     templates = list(this.persons, (person, initialInsertIndex, updated) => html`
        <li>
            [${initialInsertIndex}] ${person.name} - ${person.age} years (birthday: ${this.getBirthday(person)})
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
            ${updated ? "(update)" : ""}
        </li>`, "ul"
    )
})