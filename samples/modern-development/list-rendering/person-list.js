import { HofHtmlElement, item, list, html } from "../../lib/esm/hof.js";

/**
 * Renders a list of persons with links to edit and delete a person
 * @attr persons - List of persons.
 * @attr edititem - Callback that is fired if a link to edit a person is clicked.
 * @attr deleteitem - Callback that is fired if a link to delete a person is clicked.
 */
export class PersonDataList extends HofHtmlElement {
    persons = [];

    edititem = null;

    deleteitem = null;

    templates = list(this.persons, (person) => html`
        <li>
            ${person.name} - ${person.age} years)
            [<a href="#" onclick="${() => this.edititem(person)}">Edit</a>]
            [<a href="#" onclick="${() => this.deleteitem(person)}">Delete</a>]
        </li>`
    )
}

customElements.define("person-data-list", PersonDataList)