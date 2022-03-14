customElements.define("my-greeter", class extends HofHtmlElement {
    name = "world"

    templates = html`
        <h1>Hello ${this.name}!</h1>
        <p>It's ${new Date()}.</p>
    `
})