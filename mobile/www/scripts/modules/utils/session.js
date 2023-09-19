import ezrequest from "./ezrequest.js";

class Session {
    session;
    dispatcher = new EventTarget()

    constructor() {
        this.session = localStorage.getItem('session');
    }

    isLogged() {
        return localStorage.getItem('session') !== null;
    }

    check() {
        return new Promise((resolve, reject) => {
            if (this.session) {
                ezrequest.get('/api/user/check', this.session).then(r => {
                    if(r.status === 200) resolve()
                    else {
                        this.logout()
                        reject()
                    }
                }).catch(() => {
                    this.logout()
                    reject()
                })
            } else reject();
        })
    }

    set(session) {
        localStorage.setItem('session', session);
        this.session = session;
        // add event
        this.dispatcher.dispatchEvent(new CustomEvent("login", {detail: {session: this.session}}))
    }

    logout() {
        localStorage.removeItem('session');
        this.session = null;
    }
}

export default new Session()