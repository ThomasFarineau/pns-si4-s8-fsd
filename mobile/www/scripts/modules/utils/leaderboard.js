import generator from "./generator.js";
import ezrequest from "./ezrequest.js";
import session from "./session.js";
import modaliser from "./modaliser.js";
import Profile from "./profile.js";

class Leaderboard {
    loadLeaderboard(response) {
        let leaderboard = JSON.parse(response)
        let tenBestP = document.getElementById("leaderboardContainer")
        for (let i of leaderboard.ten) {
            let ranking = generator.createTag("user")
            let rank = generator.createTag("rank")
            let username = generator.createTag("username")
            let elo = generator.createTag("elo")
            rank.innerText = i.rank
            username.innerText = i.username
            elo.innerText = i.elo
            ranking.appendChild(rank)
            ranking.appendChild(username)
            ranking.appendChild(elo)
            ranking.addEventListener("click", () => {
                ezrequest.get("/api/user/profile?user=" + i.username + "&logged=" + session.isLogged()).then((data) => {
                    modaliser.open("account", false, false, false, false).then(() => {
                        Profile.openProfile(data.response)
                    })
                })
            })
            tenBestP.appendChild(ranking)
        }
        if (leaderboard.ranking !== undefined) {
            let separator = generator.createTag("text")
            separator.innerText = "⠇"
            let ranking = generator.createTag("user")
            let rank = generator.createTag("rank")
            let username = generator.createTag("username")
            let elo = generator.createTag("elo")
            rank.innerText = leaderboard.ranking
            username.innerText = leaderboard.username
            elo.innerText = leaderboard.elo
            ranking.appendChild(rank)
            ranking.appendChild(username)
            ranking.appendChild(elo)
            ranking.addEventListener("click", () => {
                ezrequest.get("/api/user/profile").then((data) => {
                    modaliser.open("account", false, false, false, false).then(() => {
                        Profile.openProfile(data.response)
                    })
                })
            })
            tenBestP.appendChild(separator)
            tenBestP.appendChild(ranking)

        }
    }
}

export default new Leaderboard();