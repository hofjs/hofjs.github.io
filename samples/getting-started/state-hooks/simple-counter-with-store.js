customElements.define("simple-counter", class extends HofHtmlElement {
    sharedCounter = counterStoreWithHooks;

    sharedCounterBeforePropertyChanged(newValue, oldValue) {
        return Math.random() < 0.5;
    }

    sharedCounterAfterPropertyChanged(property, newValue, oldValue) {
        console.log(`sharedCounter.${property} changed from ${oldValue} -> ${newValue}`);
    }

    templates = html`
        <div>Count: ${this.sharedCounter.count}</div>
        <div>Inverse count: ${-this.sharedCounter.count}</div>
        <div>Doubled count: ${this.sharedCounter.doubled}</div>
        <button onclick="${this.sharedCounter.increment}">++</button>
        <button onclick="${() => this.sharedCounter.count--}">--</button>
    `
})