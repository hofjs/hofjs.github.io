class Person {
    constructor(name = "", age = "") {
        this.id = (name && age) ? Person.counter++ : "";
        this.name = name;
        this.age = age;
    }

    static counter = 1;
}