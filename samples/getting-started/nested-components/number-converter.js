customElements.define("number-converter", class extends HofHtmlElement {
    value = 16;
    scale = "d";
    
    change(value, scale) {
        this.value = value;
        this.scale = scale;
    }

    templates = html`
        <div>
            <number-input scale="d" value="${this.scale == 'd' ? this.value : parseInt(this.value, 16)}" change="${this.change}"></number-input>
            <number-input scale="h" value="${this.scale == 'h' ? this.value : parseInt(this.value).toString(16)}" change="${this.change}"></number-input>
            <number-info value="${this.scale == 'd' ? this.value : parseInt(this.value, 16)}"></number-info>
        </div>
    `
})