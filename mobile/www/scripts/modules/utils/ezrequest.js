import session from "./session.js";

class EZRequest {
    server;

    constructor() {
        this.request = new XMLHttpRequest();
    }

    setUrl(url) {
        this.server = url;
    }

    get(url) {
        return new Promise((resolve, reject) => {
            this.request.open('GET', this.server + url, true);
            if (session.isLogged()) this.request.setRequestHeader('Authorization', 'Bearer ' + session.session);
            this.request.onload = () => {
                if (this.request.status === 200 || this.request.status === 201) {
                    resolve(this.request);
                } else {
                    reject(this.request.responseText);
                }
            };
            this.request.send();
        });
    }

    post(url, data) {
        return new Promise((resolve, reject) => {
            this.request.open('POST', this.server + url, true);
            if (session.isLogged()) this.request.setRequestHeader('Authorization', 'Bearer ' + session.session);
            this.request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            this.request.onload = () => {
                if (this.request.status >= 200 && this.request.status < 400) {
                    resolve(this.request);
                } else {
                    reject(this.request.responseText);
                }
            };
            this.request.send(JSON.stringify(data));
        });
    }

    delete(url, data) {
        return new Promise((resolve, reject) => {
            this.request.open('DELETE', this.server + url, true);
            if (session.isLogged()) this.request.setRequestHeader('Authorization', 'Bearer ' + session.session);
            this.request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            this.request.onload = () => {
                if (this.request.status >= 200 && this.request.status < 400) resolve(this.request); else reject(this.request.responseText);
            };
            this.request.send(JSON.stringify(data));
        });
    }
}

export default new EZRequest();