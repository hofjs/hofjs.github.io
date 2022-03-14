customElements.define("number-input", class extends HofHtmlElement {
    value = null;
    scale = null;

    change = null;

    _SCALE_NAMES = { d: 'Decimal', h: 'Hex' }

    templates = html`
        <label>
            ${this._SCALE_NAMES[this.scale]}:
            <input value="${this.value}" oninput="${(event) => this.change(event.target.value, this.scale)}"/>
        </label>
    `
})