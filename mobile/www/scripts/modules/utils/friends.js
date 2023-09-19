import ezrequest from "./ezrequest.js";
import session from "./session.js";
import modaliser from "./modaliser.js";
import Profile from "./profile.js";
import generator from "./generator.js";

class Friends {
    pendingFriendRequests;
    dispatcher = new EventTarget()

    constructor() {
        console.log("on passe")
        setInterval(() => {
            this.pollForNotifs()
        }, 5000)
    }

    fetchFriendList() {
        let friendList = document.getElementById("friendsList")
        friendList.innerHTML = ""
        ezrequest.get("/api/friend").then((friends) => {
            let parsedFriends = JSON.parse(friends.response)
            for (let e of parsedFriends) {
                let newFriend = generator.createTag("friend")
                // en ligne
                let friendCo = generator.createTag("status", {online: e.friend.online})
                let friendName = generator.createTag("text")
                friendName.innerText = e.friend.username
                friendName.addEventListener("click", () => {
                    ezrequest.get("/api/user/profile?user=" + e.friend.username + "&logged=" + session.isLogged()).then((data) => {
                        modaliser.open("account", false, false, false, false).then(() => {
                            Profile.openProfile(data.response)
                        })
                    })
                })
                let chatButton = generator.createButton("Défier", "swords")
                chatButton.addEventListener("click", () => {
                    // open chat modal with friend session id
                    // TEMPORARY DUEL REQUEST
                    this.dispatcher.dispatchEvent(new CustomEvent("duelSent", {"detail": {userID: e.friend._id}}))
                    //ezrequest.post("/api/friend/duelRequest", {user: e.friend._id, roomID: "test"}).then(() => console.log("duel envoyé")).catch((error) => console.log(error))
                })
                let removeButton = generator.createButton("", "person_remove")
                removeButton.addEventListener("click", () => {
                    ezrequest.delete("/api/friend", {user: e.friend._id}).then(() => friendList.removeChild(newFriend)).catch((error) => console.warn(error))
                })
                newFriend.append(friendCo, friendName, chatButton, removeButton)
                friendList.appendChild(newFriend)
            }
        })
    }

    fetchfriendRequestList() {
        let friendR = document.getElementById("pendingFriendR")
        friendR.innerHTML = ""
        if (this.pendingFriendRequests !== undefined) {
            for (let e of this.pendingFriendRequests) {
                let container = document.createElement("friend-request")
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
                    ezrequest.post("/api/friend", {user: e._id}).then(() => {
                        friendR.removeChild(container)
                    }).catch((error) => console.log(error))
                })
                let checkIcon = document.createElement("icon")
                checkIcon.innerText = "check"
                acceptButton.appendChild(checkIcon)
                let denyButton = document.createElement("button")
                denyButton.addEventListener("click", () => {
                    ezrequest.delete("/api/friend", {user: e._id}).then(() => {
                        friendR.removeChild(container)
                    }).catch((error) => console.log(error))
                })
                let denyIcon = document.createElement("icon")
                denyIcon.innerText = "close"
                denyButton.appendChild(denyIcon)
                container.append(name, acceptButton, denyButton)
                friendR.appendChild(container)
            }
        }
    }

    pollForNotifs() {
        if (session.isLogged()) {
            // check if the play modal is opened
            ezrequest.get("/api/friend/request?role=receiver").then((data) => {
                this.pendingFriendRequests = JSON.parse(data.response)
                if (this.pendingFriendRequests.length > 0) {
                    if (document.querySelector("modal-wrapper[modal='play']") !== null) {
                        let button = document.querySelector("modal-wrapper[modal='play'] button[modal='friendRequests']")
                        let oldNotif = button.querySelector("notif");
                        let notif = document.createElement("notif");
                        notif.innerText = this.pendingFriendRequests.length > 100 ? "99+" : this.pendingFriendRequests.length;
                        if (oldNotif !== null) button.replaceChild(notif, oldNotif); else button.appendChild(notif);
                    }
                }
            }).catch((e) => console.log(e))
        }
    }

}

export default new Friends();