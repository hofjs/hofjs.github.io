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