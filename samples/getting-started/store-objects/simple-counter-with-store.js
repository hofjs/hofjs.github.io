customElements.define("simple-counter", class extends HofHtmlElement {
    sharedCounter = counterStore;

    templates = html`
        <div>Count: ${this.sharedCounter.count}</div>
        <div>Inverse count: ${-this.sharedCounter.count}</div>
        <div>Doubled count: ${this.sharedCounter.doubled}</div>
        <button onclick="${this.sharedCounter.increment}">++</button>
        <button onclick="${() => this.sharedCounter.count--}">--</button>
    `
})