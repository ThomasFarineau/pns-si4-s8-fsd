const Routes = require("./Routes");

class Route {
    defaultRoute;

    constructor(defaultRoute) {
        this.defaultRoute = defaultRoute;
    }

    correctPath(path) {
        if(path === "") return path
        if(path.charAt(0) !== "/") path = "/" + path
        if(path.charAt(path.length - 1) === "/") path = path.slice(0, -1)
        return '/' + this.defaultRoute + path
    }

    get(path, callback) {
        Routes.add(this.correctPath(path), "GET", callback);
    }

    post(path, callback) {
        Routes.add(this.correctPath(path), "POST", callback);
    }

    put(path, callback) {
        Routes.add(this.correctPath(path), "PUT", callback);
    }

    delete(path, callback) {
        Routes.add(this.correctPath(path), "DELETE", callback);
    }
}

module.exports = Route;