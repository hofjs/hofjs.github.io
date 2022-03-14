const counterStoreWithHooks = {
    count: 1,

    countBeforeChanged(newValue, oldValue) {
        return newValue <= 20;
    },

    countAfterChanged(newValue, oldValue) {
        console.log(`count changed from ${oldValue} -> ${newValue}`);
    },

    get doubled() { return this.count * 2; },

    increment() {
        this.count++;
    }
}