customElements.define("simple-counter", class extends HofHtmlElement {
    count = 10;

    get doubled() { return this.count * 2; }

    increment() {
        this.count++;
    }

    templates = html`
        <div>Count: ${this.count}</div>
        <div>Inverse count: ${-this.count}</div>
        <div>Doubled count: ${this.doubled}</div>
        
        <button onclick="${this.increment}">++</button>
        <button onclick="${() => this.count--}">--</button>
    `
})