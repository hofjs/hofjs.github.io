customElements.define("simple-counter", class extends HofHtmlElement {
    count = 10;

    #timerId = 0;

    init() {
        this.#timerId = setInterval(() => this.count++, 1000);
    }

    dispose() {
        clearInterval(this.#timerId);
    }

    templates = html`<div>Count: ${this.count}</div>`
})