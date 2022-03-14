customElements.define("person-data-input", class extends HofHtmlElement {
    value = "";
    label = "";
    change = null;

    constructor() {
        super("label")
    }

    templates = html`
        ${this.label}: <input value="${this.value}" onchange="${this.change}" />
    `
})