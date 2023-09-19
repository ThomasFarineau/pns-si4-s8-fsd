import session from "./session.js";
import ezrequest from "./ezrequest.js";
import modaliser from "./modaliser.js";
import Profile from "./profile.js";

class Duels {
    pendingDuelRequests;
    dispatcher = new EventTarget()

    constructor() {
        setTimeout(() => {
            setInterval(() => {
                this.pollForNotifs()
            }, 5000)
        }, 2500)
    }

    fetchDuelsList() {
        let duelR = document.getElementById("pendingDuelR")
        duelR.innerHTML = ""
        if (this.pendingDuelRequests !== undefined) {
            for (let e of this.pendingDuelRequests) {
                let container = document.createElement("duel-request")
                let name = document.createElement("text")
                name.innerText = e.username

                name.addEventListener("click", () => {
                    ezrequest.get("/api/user/profile?user=" + e.username + "&logged=" + session.isLogged()).then((data) => {
                        modaliser.open("account", false, false, false, false).then(() => {
                            Profile.openProfile(data.response)
                        })
                    })
                })

                let acceptButton = document.createElement("button")
                acceptButton.addEventListener("click", () => {
                    ezrequest.post("/api/friend/duelRequest", {user: e._id}).then((data) => {
                        duelR.removeChild(container)
                        let response = JSON.parse(data.response)

                        this.dispatcher.dispatchEvent(new CustomEvent("acceptDuel", {detail: {user: e._id, roomID: response.roomID}}))
                    }).catch((error) => console.warn(error))
                })
                let checkIcon = document.createElement("icon")
                checkIcon.innerText = "check"
                acceptButton.appendChild(checkIcon)
                /*let denyButton = document.createElement("button")
                denyButton.addEventListener("click", () => {
                    ezrequest.delete("/api/friend", {user: e._id}).then(() => {
                        duelR.removeChild(container)
                    }).catch((error) => console.log(error))
                })
                let denyIcon = document.createElement("icon")
                denyIcon.innerText = "close"
                denyButton.appendChild(denyIcon)
                container.append(denyButton)*/
                container.append(name, acceptButton)
                duelR.appendChild(container)
            }
        }
    }

    pollForNotifs() {
        if (session.isLogged()) {
            // check if the play modal is opened
            ezrequest.get("/api/friend/duelRequest").then((data) => {
                this.pendingDuelRequests = JSON.parse(data.response)
                if (this.pendingDuelRequests.length > 0) {
                    if (document.querySelector("modal-wrapper[modal='play']") !== null) {
                        let button = document.querySelector("modal-wrapper[modal='play'] button[modal='duelRequests']")
                        let oldNotif = button.querySelector("notif");
                        let notif = document.createElement("notif");
                        notif.innerText = this.pendingDuelRequests.length > 100 ? "99+" : this.pendingDuelRequests.length;
                        if (oldNotif !== null) button.replaceChild(notif, oldNotif); else button.appendChild(notif);
                    }
                }
            }).catch((e) => console.warn(e))
        }
    }

}

export default new Duels();