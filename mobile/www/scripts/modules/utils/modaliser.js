import generator from "./generator.js";
import Form from "./form.js";
import session from "./session.js";
import ezrequest from "./ezrequest.js";

/**
 * La classe modaliser permet de créer des modales à partir de fichiers json
 * @class Modaliser
 * @property {Map} modals - Map contenant les modales
 * @method saveFromJson - Permet de sauvegarder un modal à partir d'un fichier json
 * @method create - Permet de créer un modal à partir d'un objet json
 * @method open - Permet d'ouvrir un modal et de parser son contenu pour le rendre dynamique
 * @method close - Permet de fermer un modal
 */
class Modaliser {
    dispatcher = new EventTarget()
    modals = new Map()

    constructor() {
        this.saveFromJson("play", "play")
        this.saveFromJson("login", "login")
        this.saveFromJson("register", "register")
        this.saveFromJson("account", "account")
        this.saveFromJson("leaderboard", "leaderboard")
        this.saveFromJson("waiting", "waiting")
        this.saveFromJson("friendRequests","friendRequests")
        this.saveFromJson("friends", "friends")
        this.saveFromJson("duelRequests", "duelRequests")
        this.saveFromJson("waitingDuel", "waitingDuel")
    }

    saveFromJson(name, jsonName) {
        fetch(`./modals/${jsonName}.json`)
            .then(response => response.json())
            .then(json => this.save(name, json))
            .catch(error => console.error(error))
    }

    save(name, modal) {
        this.modals.set(name, this.create(name, modal))
    }

    open(name, closable = false, fadeIn = false, fadeOut = false, event = true) {
        let modal = this.modals.get(name).cloneNode(true)
        if (modal) {
            document.querySelectorAll("modal-wrapper").forEach(modal => modal.remove())
            if (fadeIn) modal.classList.add("fade-in")
            if (fadeOut) modal.classList.add("fade-out")
            if (closable) {
                // add attribute to close the modal
                modal.setAttribute("closable", "")
                // add event listener to close the modal
                modal.querySelector("close").addEventListener("click", () => this.close(name, fadeOut))
                modal.addEventListener("click", () => this.close(name, fadeOut))
                // prevent the modal to close when clicking inside
                modal.querySelector("modal").addEventListener("click", (event) => event.stopPropagation())
            } else {
                modal.querySelector("close").remove()
            }
            // parsing event and dynamic content
            {
                {
                    // remove all the logged in elements
                    modal.querySelectorAll("[logged]").forEach(element => {
                        let value = element.getAttribute("logged")
                        if (value === "true") {
                            if (!session.isLogged()) element.remove()
                        } else {
                            if (session.isLogged()) element.remove()
                        }
                    })
                }
                {
                    // remove all the closable elements
                    modal.querySelectorAll("[closable]").forEach(element => {
                        let value = element.getAttribute("closable")
                        if (value === "true") {
                            if (!closable) element.remove()
                        } else {
                            if (closable) element.remove()
                        }
                    })
                }
                // add the event to dispatcher
                {
                    modal.querySelectorAll("button[event]").forEach(element => element.addEventListener("click", (e) => this.dispatcher.dispatchEvent(new CustomEvent(element.getAttribute("event"), e))))
                }
                // add the event modal opener on buttons with no request
                {
                    modal.querySelectorAll("button[modal]:not([request])").forEach(element => element.addEventListener("click", () => this.open(element.getAttribute("modal"), element.getAttribute("closable") === "true", element.getAttribute("fadeIn") === "true", element.getAttribute("fadeOut") === "true")))
                }
                // add the request event on buttons
                {
                    modal.querySelectorAll("button[request]").forEach(element => {
                        element.addEventListener("click", () => {
                            let url = element.getAttribute("request")
                            ezrequest.get(url).then(() => {
                                if (url === "/api/logout") session.logout()
                                // check if the element has modal attribute
                                if (element.hasAttribute("modal")) {
                                    this.open(element.getAttribute("modal"), element.getAttribute("closable") === "true", element.getAttribute("fadeIn") === "true", element.getAttribute("fadeOut") === "true")
                                }
                            })
                        })
                    })
                }
                // manage collapser
                {
                    modal.querySelectorAll("collapser").forEach(element => {
                        // get checkbox
                        let checkbox = element.querySelector("input[type=checkbox]")
                        //get fontsize of root
                        let fontSize = getComputedStyle(document.documentElement).fontSize
                        // convert to px
                        fontSize = parseFloat(fontSize)
                        // add event listener
                        checkbox.addEventListener("change", () => {
                            if (checkbox.checked) {
                                let contentHeight = element.querySelector("content").scrollHeight
                                element.querySelector("collapser-content").style.maxHeight = (contentHeight / fontSize) + 0.5 + "rem"
                            } else {
                                element.querySelector("collapser-content").style.maxHeight = "0rem"
                            }
                        })
                    })
                }
            }
            modal.querySelectorAll("form").forEach(element => new Form(element))
            document.body.append(modal)
            if(event) {
                this.dispatcher.dispatchEvent(new CustomEvent("modal-opened", {detail: {name: name}}))
            } else {
                return Promise.resolve();
            }
        } else {
            console.error(`Modal ${name} not found`)
        }
    }

    close(name, fadeOut) {
        if(name) {
            let modal = document.querySelector(`modal-wrapper[modal=${name}]`)
            if (modal) {
                if (fadeOut) {
                    modal.classList.add("fade-out")
                    setTimeout(() => modal.remove(), 300)
                } else {
                    modal.remove()
                }
                this.dispatcher.dispatchEvent(new CustomEvent("modal-closed", {detail: {name: name}}))
            }
        } else {
            document.querySelectorAll("modal-wrapper").forEach(modal => modal.remove())
            this.dispatcher.dispatchEvent(new CustomEvent("modal-closed", {detail: {name: name}}))
        }
    }

    create(name, json) {
        // create the wrapper
        let wrapper = generator.createTag("modal-wrapper", {modal: name})
        let modal = generator.createTag("modal")
        // create the header
        let header = generator.createTag("modal-header")
        {
            // create the title
            let title = generator.createTag("title")
            title.innerText = json.title
            // add the close button
            let close = generator.createTag("close");
            // add the content in the header
            header.append(title, close)
        }
        modal.append(header)
        // create the body
        let body = generator.createTag("modal-body")
        // add the content in the body
        for (let key in json.content) {
            let content = json.content[key]
            let element = this.parseContent(content)
            if (element) body.append(element)
        }
        // if the body is not empty, add it to the modal
        if (body.innerHTML !== "") modal.append(body)
        wrapper.append(modal)
        return wrapper
    }

    parseContent(content) {
        let element = null
        switch (content.type) {
            case "text":
                element = generator.createTag("text")
                if(content.center) element.style.textAlign = "center"
                element.innerText = content.value
                break;
            case "big-text":
                element = generator.createTag("big-text")
                if(content.center) element.style.justifyContent = "center"
                element.innerHTML = content.value
                break;
            case "image":
                element = generator.createTag("img")
                let ip = ""
                if (window.cordova)
                    ip = "http://15.236.216.122"
                element.src = ip + content.source
                //element.src = "../../../assets/medias/images/local/my-hero-academia-katsuki-bakugo.gif"
                break;
            case "title":
                element = generator.createTag("h2")
                element.innerText = content.value
                break;
            case "button":
                element = generator.createButton(content.label, content.icon)
                if (content.action) {
                    for (let key in content.action) {
                        if (typeof content.action[key] !== "string") {
                            if (key === "modal") {
                                element.setAttribute("modal", content.action[key].name)
                                element.setAttribute("closable", content.action[key].closable || false)
                                element.setAttribute("fadeIn", content.action[key].fadeIn || false)
                                element.setAttribute("fadeOut", content.action[key].fadeOut || false)
                            }
                        } else {
                            element.setAttribute(key, content.action[key])
                        }
                    }
                }
                break;
            case "flex":
                element = generator.createTag("flex")
                for (let key in content.content) {
                    let flexContent = content.content[key]
                    let flexElement = this.parseContent(flexContent)
                    if (flexElement) element.append(flexElement)
                }
                break;
            case "flex-auto":
                element = generator.createTag("flex-auto")
                for (let key in content.content) {
                    let flexContent = content.content[key]
                    let flexElement = this.parseContent(flexContent)
                    if (flexElement) element.append(flexElement)
                }
                break;
            case "form":
                element = generator.createTag("form", {method: content.method, action: content.action});
                for (let key in content.content) {
                    let flexContent = content.content[key];
                    let flexElement = this.parseContent(flexContent);
                    if (flexElement) element.append(flexElement);
                }
                break;
            case "input":
                element = generator.createInput(content.id, content.label, content.icon, content.attributes);
                break;
            case "separator":
                element = generator.createTag("separator");
                break;
            case "flex-column":
                element = generator.createTag("flex-column");
                for (let key in content.content) {
                    let flexContent = content.content[key]
                    let flexElement = this.parseContent(flexContent)
                    if (flexElement) element.append(flexElement)
                }
                break;
            case "collapser":
                element = generator.createTag("collapser");
                let opener = generator.createTag("label", {"for": content.id});
                let openerIcon = generator.createTag("icon");
                openerIcon.innerHTML = content.icon;
                opener.append(openerIcon);
                opener.innerHTML += content.label;
                // add checkbox
                let checkbox = generator.createTag("input", {"type": "checkbox", "id": content.id});
                let contentElement = generator.createTag("collapser-content");
                let contentBody = generator.createTag("content");
                for (let key in content.content) {
                    let collapserElement = this.parseContent(content.content[key]);
                    if (collapserElement) contentBody.append(collapserElement);
                }
                contentElement.append(contentBody);
                element.append(checkbox, opener, contentElement);
                break;
            default:
                break;
        }
        if (element !== null) {
            if (content['logged'] !== undefined) element.setAttribute("logged", content['logged'])
            if (content['closable'] !== undefined) element.setAttribute("closable", content['closable'])
            if (content.id && element.tagName !== "INPUT-GROUP" && element.tagName !== "COLLAPSER") element.id = content.id
        }
        return element
    }
}

export default new Modaliser()