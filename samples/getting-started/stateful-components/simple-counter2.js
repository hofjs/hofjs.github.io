customElements.define("simple-counter", class extends HofHtmlElement {
    count = 20;
    base = 10;

    increment() {
        this.count++;
    }

    toNumberSystem(value, base) {
        return value.toString(parseInt(base));
    }

    templates = html`
        <div>
            Count: ${this.toNumberSystem(this.count, this.base)}
            <select value="${this.base}" onchange="${(event) => this.base = event.target.value}">
                <option value="2">Binary</option>
                <option value="10">Decimal</option>
                <option value="16">Hex</option>
            </select>
        </div>
        <button onclick="${this.increment}">++</button>
        <button onclick="${() => this.count--}">--</button>
    `
})