const helper = require("../utils/Helper");
const databaseController = require("./database.controller");
const Validator = require("../utils/Validator");
const fs = require("fs");

class AchievementController {

    constructor() {
        this.load("back/data/achievements.json")
    }

    /*async unlock(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                Validator.validate(req.body, {
                    achievement: "required:true|type:string"
                }).then(() => {
                    this.unlockAchievement(user._id, req.body.achievement).then(() => {
                        res.end("Achievement unlocked")
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end(err)
                    })
                })
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid session token : " + err)
            })
        }).catch((err) => {
            res.statusCode = 401;
            res.end("Invalid authorization header: " + err)
        })
    }

    async unlockAchievement(userID, achievementName) {
        return new Promise((resolve, reject) => {
            databaseController.collection("achievements").findOne({
                name: achievementName
            }).then((achievement) => {
                if (achievement === null) return reject("Achievement not found");
                databaseController.collection("achievementsUnlocked").insertOne({
                    user: userID, achievement: achievement._id, created_at: new Date()
                }).then(() => {
                    resolve()
                }).catch((err) => reject(err))
            }).catch((err) => reject(err))
        })
    }*/

    async surprise(req,res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                databaseController.db.collection("achievements").findOne({id: "surprise"}).then((surprise) => {
                    databaseController.db.collection("achievementsUnlocked").insertOne({
                        userID: user._id, achievementID: surprise._id
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error adding achievement : " + err)
                    })
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end("Error fetching achievement : " + err)
                })
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid session token : " + err)
            })
        }).catch((err) => {
            res.statusCode = 401;
            res.end("Invalid authorization header: " + err)
        })
    }

    load(file) {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            for (let e of JSON.parse(data)) {
                // insert achievement
                require("./database.controller").collection("achievements").replaceOne({id: e.id}, {
                    id: e.id, name: e.name, description: e.description
                }, {upsert: true}).then().catch((error) => console.log(`Error while adding achievements: ${error}`))
            }
        });
    }
}

module.exports = new AchievementController()