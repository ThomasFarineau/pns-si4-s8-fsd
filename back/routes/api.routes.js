const Router = require('../utils/Router')
const userController = require('../controllers/user.controller')
const friendController = require("../controllers/friend.controller");
const achievementController = require("../controllers/achievement.controller");
const emoteController = require("../controllers/emote.controller");
const gameController = require("../controllers/game.controller");
const duelController = require("../controllers/duel.controller")

let apiRouter = new Router("api")

// get routes
apiRouter.get("logout", userController.logout)
apiRouter.get("user/check", userController.check)
apiRouter.get("user/profile", userController.profile)
apiRouter.get("user/leaderboard", userController.leaderboard)
apiRouter.get('game', gameController.get)
apiRouter.get("game/gif/loser", gameController.getLoserGif)
apiRouter.get("game/gif/winner", gameController.getWinnerGif)
apiRouter.get("game/gif/draw", gameController.getDrawGif)
apiRouter.get("game/gif/local", gameController.getLocalGif)
apiRouter.get("friend/request", friendController.getRequest)
apiRouter.get("friend", friendController.get)
apiRouter.get("emotes/sentences", emoteController.getSentences)
apiRouter.get("emotes/images", emoteController.getImages)
apiRouter.get("friend/duelRequest", duelController.get)


// post routes
apiRouter.post("signup", userController.signup)
apiRouter.post("login", userController.login)
apiRouter.post("game", gameController.save)
apiRouter.post('surprise', achievementController.surprise)
apiRouter.post("friend", friendController.add)
apiRouter.post("friend/duelRequest", duelController.add)

// delete routes
apiRouter.delete("friend", friendController.remove)
apiRouter.delete("friend/duelRequest", duelController.remove)


module.exports = apiRouter