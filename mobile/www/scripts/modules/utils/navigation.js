import session from "./session.js";
import generator from "./generator.js";

class Navigation {
    dispatcher = new EventTarget();

    constructor(element) {
        this.nav = document.querySelector(element);

        let friends = generator.createTag("item", {friends: "", logged: ""})
        let friendsIcon = generator.createTag("icon")
        friendsIcon.innerHTML = "group"
        friends.appendChild(friendsIcon)

        let account = generator.createTag("item", {account: "", logged: ""})
        let accountIcon = generator.createTag("icon")
        accountIcon.innerHTML = "settings"
        account.appendChild(accountIcon)

        let save = generator.createTag("item", {save: "", logged: "", mobileOffline: ""})
        let saveIcon = generator.createTag("icon")
        saveIcon.innerHTML = "save"
        save.appendChild(saveIcon)

        let load = generator.createTag("item", {load: "", logged: "", mobileOffline: ""})
        let loadIcon = generator.createTag("icon")
        loadIcon.innerHTML = "sync"
        load.appendChild(loadIcon)

        let quit = generator.createTag("item", {quit: ""})
        let quitIcon = generator.createTag("icon")
        quitIcon.innerHTML = "cancel_presentation"
        quit.appendChild(quitIcon)

        this.navitems = [friends, account, save, load, quit]

        this.collapser = this.nav.querySelector('item[collapser]');
        this.collapser.addEventListener("click", (e) => {
            let aside = document.querySelector("aside")
            let main = document.querySelector("main")
            if (aside.classList.contains("closed")) {
                this.collapser.querySelector("icon[closed]").classList.add("hidden");
                this.collapser.querySelector("icon[opened]").classList.remove("hidden");
                aside.classList.remove("closed");
                main.classList.remove("sidebar-closed");
            } else {
                this.collapser.querySelector("icon[closed]").classList.remove("hidden");
                this.collapser.querySelector("icon[opened]").classList.add("hidden");
                aside.classList.add("closed");
                main.classList.add("sidebar-closed");
            }
            window.dispatchEvent(new Event("resize"));
        })
    }


    load(params) {
        if (params === "LOCAL" || params === "AI") {
            this.loadItem(this.navitems[0])
            this.loadItem(this.navitems[1])
            this.loadItem(this.navitems[2])
            this.loadItem(this.navitems[3])
            this.loadItem(this.navitems[4])
        }
        if (params === "ONLINE") {
            this.loadItem(this.navitems[0])
            this.loadItem(this.navitems[1])
            this.loadItem(this.navitems[4])
        }
    }

    loadItem(item) {
        if (item.hasAttribute("logged") && !session.isLogged())
            if (!(item.hasAttribute("mobileOffline") && window.cordova))
                return
        this.nav.appendChild(item)
        // for each attr
        for (let attr of item.attributes) {
            if (attr.name === "logged") continue;
            item.addEventListener("click", (e) => {
                let event = new CustomEvent(attr.name, {detail: item});
                this.dispatcher.dispatchEvent(event);
            })
        }

    }

}

export default new Navigation("aside nav");

