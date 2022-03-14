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