class Route {
    route
    method

    constructor(route, method) {
        this.route = route;
        this.method = method;
    }
}

class Routes {
    routes = new Map();

    constructor() {
        console.log("Routes initialized");
    }

    add(route, method, callback) {
        console.log("Route added: " + route + " " + method)
        this.routes.set(new Route(route, method), callback);
    }

    get(url, method) {
        for (let key of this.routes.keys()) if (key.route === url && key.method === method) return this.routes.get(key);
        return undefined;
    }

    isRoute(url, method) {
        for (let key of this.routes.keys()) if (key.route === url.split('?')[0] && key.method === method) return true;
        return false;
    }

    execute(req, res) {
        let url = req.url;
        let callback = this.get(url.split('?')[0], req.method);
        if (callback !== undefined) {
            let getParameters = {};
            // check if contains get parameters
            if (url.includes('?')) {
                url.split('?')[1].split('&').forEach((p) => getParameters[p.split('=')[0]] = p.split('=')[1])
                req.url = url.split('?')[0];
            }
            req['body'] = ""
            req.on('data', (chunk) => req['body'] += chunk)
            req.on('end', () => {
                if (req['body'] !== "") req['body'] = JSON.parse(req['body']); else req['body'] = {};
                if (Object.keys(getParameters).length !== 0) {
                    for (let parametersKey in getParameters) {
                        req['body'][parametersKey] = getParameters[parametersKey]
                    }
                }
                if (callback !== undefined) callback(req, res);
            })
        } else {
            res.end("404");
        }
    }
}

module.exports = new Routes();