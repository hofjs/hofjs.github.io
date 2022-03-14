const counterStore = {
    count: 1,

    get doubled() { return this.count * 2; },

    increment() {
        this.count++;
    }
}