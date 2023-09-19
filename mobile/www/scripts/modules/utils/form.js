import ezrequest from "./ezrequest.js";
import session from "./session.js";
import modaliser from "./modaliser.js";

export default class Form {
    constructor(element) {
        this.form = element;
        this.action = this.form.getAttribute('action');
        this.method = this.form.getAttribute('method');
        this.form.addEventListener('submit', this.submit.bind(this));
    }

    submit(e) {
        e.preventDefault();
        let data = {};
        for (let input of this.form.querySelectorAll('input')) {
            // check if it has attr data-match
            if (input.hasAttribute('data-match')) {
                let match = this.form.querySelector(`input[name="${input.getAttribute('data-match')}"]`);
                if (input.value !== match.value) return;
            }
            data[input.name] = input.value;
        }

        function giveFeedback(feedback) {
            document.querySelector('#feedback').innerHTML = feedback;
        }

        ezrequest.post(this.action, data).then(r => {
            if (this.action === "/api/login") {
                if(r.status !== 200) return;
                let response = JSON.parse(r.response);
                session.set(response.session);
                modaliser.open("play")
            } else if (this.action === "/api/signup") {
                if(r.status !== 201) return;
                modaliser.open("login")
            }
        }).catch((err) => {
            console.log("on doit donner du feedback")
            giveFeedback(err)
        });

    }
}