import generator from "./generator.js";
import session from "./session.js";
import ezrequest from "./ezrequest.js";

class Profile {
    openProfile(response) {
        let infos = JSON.parse(response)
        let modal = document.querySelector("modal-wrapper[modal='account']")

        if (!infos.own) {
            let title = modal.querySelector("modal-header title")
            title.innerText = "Profil de " + infos.user.username
        }

        document.getElementById("friendActions").classList.add("hidden")
        document.getElementById("myFriendsContainer").classList.add("hidden")
        let userInfos = modal.querySelector("#userInfos")
        userInfos.innerHTML = ""
        let username = generator.createTag("username")
        username.innerHTML = "<span>Nom d'utilisateur: </span><span>" + infos.user.username + "</span>"
        let elo = generator.createTag("elo")
        elo.innerHTML = "<span>ELO: </span><span>" + infos.user.elo + "</span>"
        let date = generator.createTag("date")
        date.innerHTML = "<span>Membre depuis le: </span><span>" + new Date(infos.user.created_at).toLocaleDateString("fr-FR", {
            year: "numeric", month: "long", day: "numeric"
        }) + "</span>"
        userInfos.append(username, elo, date)
        if (infos.own) {
            let id = generator.createTag("id")
            id.innerHTML = "<span>ID: </span><span>" + infos.user._id + "</span>"
            userInfos.appendChild(id)
            document.getElementById("myFriendsContainer").classList.remove("hidden")
        }

        let successH2 = modal.querySelectorAll("h2")[1]
        successH2.innerText = "Succès (" + infos.user.achievements + "/" + infos.achievements.length + ")"

        let achievementsList = modal.querySelector("#successList")
        achievementsList.innerHTML = ""
        infos.achievements.forEach(ach => {
            let achievement = generator.createTag("achievement", {achId: ach.id, unlocked: ach.unlocked})
            let name = generator.createTag("name")
            let description = generator.createTag("description")
            name.innerText = ach.name
            description.innerText = ach.description
            achievement.append(name, description)
            achievementsList.appendChild(achievement)
        })

        if (!infos.own && session.isLogged()) {
            let friendActions = modal.querySelector("#friendActions")
            friendActions.classList.remove("hidden")

            friendActions.querySelector("#acceptFriend").addEventListener("click", () => ezrequest.post("/api/friend", {user: infos.user._id}).then(() => {
                ezrequest.get("/api/user/profile?user=" + infos.user.username).then((data) => {
                    friendActions.querySelector("#acceptFriend").classList.add("hidden")
                    friendActions.querySelector("#denyFriend").classList.add("hidden")
                    friendActions.querySelector("#removeFriend").classList.remove("hidden")
                })
            }).catch((error) => console.error(error)))

            friendActions.querySelector("#denyFriend").addEventListener("click", () => ezrequest.delete("/api/friend", {user: infos.user._id}).then(() => {
                ezrequest.get("/api/user/profile?user=" + infos.user.username).then(() => {
                    friendActions.querySelector("#acceptFriend").classList.add("hidden")
                    friendActions.querySelector("#denyFriend").classList.add("hidden")
                    friendActions.querySelector("#addFriend").classList.remove("hidden")
                })
            }).catch((error) => console.error(error)))

            friendActions.querySelector("#removeFriend").addEventListener("click", () => ezrequest.delete("/api/friend", {user: infos.user._id}).then(() => {
                ezrequest.get("/api/user/profile?user=" + infos.user.username).then((data) => {
                    friendActions.querySelector("#addFriend").classList.remove("hidden")
                    friendActions.querySelector("#removeFriend").classList.add("hidden")
                })
            }).catch((error) => console.error(error)))

            friendActions.querySelector("#addFriend").addEventListener("click", () => ezrequest.post("/api/friend", {user: infos.user._id}).then(() => {
                ezrequest.get("/api/user/profile?user=" + infos.user.username).then(() => {
                    friendActions.querySelector("#addFriend").classList.add("hidden")
                    friendActions.querySelector("#requestSent").classList.remove("hidden")
                })
            }).catch((error) => console.error(error)))

            ezrequest.get("/api/friend?user=" + infos.user._id).then((data) => {
                friendActions.querySelector("#addFriend").classList.add("hidden")
                friendActions.querySelector("#acceptFriend").classList.add("hidden")
                friendActions.querySelector("#denyFriend").classList.add("hidden")
                friendActions.querySelector("#requestSent").classList.add("hidden")

            }).catch((error) => {
                // demande
                ezrequest.get("/api/friend/request?user=" + infos.user._id + "&type=request").then((data) => {
                    let request = JSON.parse(data.response)
                    let senderId = request.sender
                    if (senderId === infos.user._id) {
                        friendActions.querySelector("#addFriend").classList.add("hidden")
                        friendActions.querySelector("#removeFriend").classList.add("hidden")
                        friendActions.querySelector("#requestSent").classList.add("hidden")
                    } else {
                        friendActions.querySelector("#acceptFriend").classList.add("hidden")
                        friendActions.querySelector("#addFriend").classList.add("hidden")
                        friendActions.querySelector("#removeFriend").classList.add("hidden")
                        friendActions.querySelector("#denyFriend").classList.add("hidden")
                        friendActions.querySelector("#requestSent").classList.remove("hidden")
                    }
                }).catch(() => {
                    // remove
                    friendActions.querySelector("#removeFriend").classList.add("hidden")
                    friendActions.querySelector("#denyFriend").classList.add("hidden")
                    friendActions.querySelector("#requestSent").classList.add("hidden")
                    friendActions.querySelector("#acceptFriend").classList.add("hidden")
                    friendActions.querySelector("#addFriend").classList.remove("hidden")
                    // pas amis ni demande
                })

            })
            /*
            handleFriendActionsDisplay(infos).then(r => {

            }).catch((error) => console.log(error))

             */
        }
    };
}

export default new Profile()