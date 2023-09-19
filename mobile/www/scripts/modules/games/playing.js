class Playing {
    constructor(type) {
        if(this.constructor === Playing) throw new Error("Abstract classes can't be instantiated.");
        this.type = type;
    }

    disable() {
        throw new Error("Method not implemented.");
    }

    enable() {
        throw new Error("Method not implemented.");
    }

    reset() {
        throw new Error("Method not implemented.");
    }

    save() {
        throw new Error("Method not implemented.");
    }
}

export default Playing