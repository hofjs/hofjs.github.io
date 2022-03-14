customElements.define("number-info", class extends HofHtmlElement {
    value = null;

    templates = () => isNaN(this.value, this.scale) ? html`<p>No valid number!</p>` : ``
})