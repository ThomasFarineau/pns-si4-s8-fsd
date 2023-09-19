const Validator = require("../utils/Validator");
const encrypter = require("../utils/Encrypter");
const databaseController = require("./database.controller");
const helper = require("../utils/Helper");

class UserController {

    async leaderboard(req, res) {
        // check parameters for page
        let page = 1;
        let limit = 10;
        if(req.body.page)
            page = req.body.page;
        if(page < 1)
            page = 1;
        // get the users
        let usersSize = await databaseController.collection("users").countDocuments();
        databaseController.collection("users").find({}).sort({elo: -1}).skip((page - 1) * limit).limit(limit).project({
            _id: 1, username: 1, elo: 1
        }).toArray().then((users) => {
            // add user ranks
            for(let i = 0; i < users.length; i++) {
                users[i].rank = (page - 1) * limit + i + 1;
            }
            helper.checkBearer(req).then((session) => {
                helper.checkSession(session).then((user) => {
                    let isAmong = false;
                    // check if user is in users
                    for(let i = 0; i < users.length; i++) {
                        if(users[i]._id.toString() === user._id.toString()) {
                            isAmong = true;
                            break;
                        }
                    }
                    if(!isAmong) {
                        databaseController.collection("users").countDocuments({elo: {$gt: user.elo}}).then((count) => {
                            res.statusCode = 200
                            res.end(JSON.stringify({ten: users, ranking: count + 1, elo: user.elo, username: user.username}))
                        }).catch((err) => {
                            res.statusCode = 500;
                            res.end("Internal server error: " + err)
                        })
                    } else {
                        res.statusCode = 200;
                        res.end(JSON.stringify({
                            ten: users
                        }))
                    }
                }).catch((err) => {
                    res.statusCode = 401;
                    res.end("Invalid session token : " + err)
                })
            }).catch(() => {
                res.statusCode = 200;
                res.end(JSON.stringify({
                    ten: users,
                    pages: Math.ceil(usersSize / limit),
                    currentPage: page
                }))
            })
        })
    }

    async profile(req, res) {
        if (req.body['user']) {
            databaseController.collection("users").findOne({username: req.body['user']}).then((user) => {
                if (user) {
                    require("./user.controller").getUserProfile(user).then((profile) => {
                        res.statusCode = 200;
                        profile.own = false;
                        if (req.body['logged']) {
                            if (req.body['logged'] === "true") {
                                helper.checkBearer(req).then((session) => {
                                    helper.checkSession(session).then((self) => {
                                        console.log(user._id.toString())
                                        console.log(self._id.toString())
                                        console.log(user._id.toString() === self._id.toString())
                                        profile.own = user._id.toString() === self._id.toString()
                                        res.end(JSON.stringify(profile))
                                    }).catch((err) => {
                                        res.statusCode = 401;
                                        res.end("Invalid session token : " + err)
                                    })
                                }).catch((err) => {
                                    res.statusCode = 401;
                                    res.end("Invalid authorization header: " + err)
                                })
                            }
                            else
                                res.end(JSON.stringify(profile))
                        }
                        else
                            res.end(JSON.stringify(profile))
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while getting user profile: " + err)
                    })
                } else {
                    res.statusCode = 404;
                    res.end("User not found")
                }
            })
        } else {
            helper.checkBearer(req).then((session) => {
                helper.checkSession(session).then((user) => {
                    require("./user.controller").getUserProfile(user).then((profile) => {
                        res.statusCode = 200;
                        profile.own = true;
                        res.end(JSON.stringify(profile))
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while getting user profile: " + err)
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
    }

    getUserProfile(user) {
        return new Promise((resolve, reject) => {
            // get all the achievements
            databaseController.collection("achievements").find({}).toArray().then((achievements) => {
                // get all the achievements unlocked by the user
                databaseController.collection("achievementsUnlocked").find({userID: user._id}).toArray().then((achievementsUnlocked) => {
                    // set the achievements unlocked
                    for (let achievement of achievements) {
                        achievement.unlocked = false;
                        for (let achievementUnlocked of achievementsUnlocked) {
                            if (achievementUnlocked.achievementID.toString() === achievement._id.toString()) {
                                achievement.unlocked = true;
                                break;
                            }
                        }
                        delete achievement._id;
                    }
                    // set the number of achievements remaining
                    user.achievements = achievementsUnlocked.length;
                    // delete the password, session and updated_at fields
                    delete user.password;
                    delete user.session;
                    delete user.updated_at;
                    // encrypt the mail
                    user.mail = encrypter.jwt(user.mail);

                    // merge the user and the achievements
                    let profile = {
                        user: user, achievements: achievements
                    }
                    resolve(profile)
                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })
        })
        /*
        databaseController.collection("achievements").countDocuments({}).then((nbAchievements) => {
            databaseController.collection("achievementsUnlocked").find({userID: user._id}).toArray().then((achievements) => {
                // TODO mieux gérer le fetch des achievements (le foreach n'a pas de callback et la suite s'éxécute avant d'attendre le retour)
                let achievementsDescs = []
                let nb = achievements.length
                let counter = 0;
                if (nb === 0) {
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        "name": user.username,
                        "nbAchievementsRemaining": nbAchievements - achievementsDescs.length,
                        "achievements": achievementsDescs,
                        "isAnotherUser": isAnotherUser,
                        "userID": user._id
                    }))
                } else {
                    for (let doc of achievements) {
                        databaseController.collection("achievements").findOne({id: doc.achievementID}).then((ach) => {
                            achievementsDescs.push(ach)
                            counter++
                            if (counter === nb) {
                                res.statusCode = 200;
                                let toReturn = JSON.stringify({
                                    "name": user.username,
                                    "nbAchievementsRemaining": nbAchievements - achievementsDescs.length,
                                    "achievements": achievementsDescs,
                                    "isAnotherUser": isAnotherUser,
                                    "userID": user._id
                                })
                                console.log(toReturn)
                                res.end(toReturn)
                            }
                        }).catch(() => {
                            res.statusCode = 404;
                            res.end('Error fetching achievement')
                        })
                    }
                }
            }).catch(() => {
                res.statusCode = 404;
                res.end('Error fetching achievements unlocked')
            })
        }).catch(() => {
            res.statusCode = 404;
            res.end('Error fetching achievements count')
        })

         */
    }
    check(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                res.end(JSON.stringify({
                    username: user.username, mail: encrypter.jwt(user.mail), created_at: user.created_at
                }));
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid session token : " + err)
            })
        }).catch((err) => {
            res.statusCode = 401;
            res.end("Invalid authorization header: " + err)
        })
    }

    async logout(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                databaseController.collection("users").updateOne({
                    _id: user._id
                }, {
                    $set: {
                        session: null, updated_at: new Date()
                    }
                }).then(() => {
                    res.end("Logged out");
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end(err);
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

    async login(req, res) {
        Validator.validate(req.body, {
            mail: "required:false|type:email",
            username: "required:false|type:string",
            password: "required:true|type:string"
        }).then(() => {
            if (!req.body.username && !req.body.mail) {
                res.statusCode = 400;
                res.end("Username or mail is required");
                return;
            }
            databaseController.collection("users").findOne({
                $or: [{
                    username: req.body.username
                }, {
                    mail: req.body.mail
                }]
            }).then((user) => {
                encrypter.compare(req.body.password, user.password).then(() => {
                    let session = encrypter.uuid();
                    databaseController.db.collection("users").updateOne({
                        _id: user._id
                    }, {
                        $set: {
                            session: session, updated_at: new Date()
                        }
                    }).then(() => {
                        res.end(JSON.stringify({session: encrypter.jwt(session)}))
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while updating user session: " + err)
                        console.error("Error while updating user session: ", err)
                    })
                }).catch((err) => {
                    res.statusCode = 400;
                    res.end("Mot de passe incorrect")
                })
            }).catch((err) => {
                res.statusCode = 500;
                res.end("Nom d'utilisateur ou email incorrect")
            })
        }).catch((err) => {
            res.statusCode = 400;
            res.end("Invalid request")
        })
    }

    async signup(req, res) {
        Validator.validate(req.body, {
            mail: "required:true|type:email",
            username: "required:true|type:string|min:3|max:30",
            password: "required:true|type:string|min:8|max:255"
        }).then(() => {
            encrypter.hash(req.body.password).then((hash) => {
                databaseController.collection("users").insertOne({
                    username: req.body.username,
                    mail: req.body.mail,
                    password: hash,
                    elo: parseInt(process.env.BASE_ELO),
                    created_at: new Date(),
                    updated_at: new Date()
                }).then(() => {
                    res.statusCode = 201;
                    res.end("User created")
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end("Nom d'utilisateur ou email déjà présent")
                    console.error("Error while creating user: ", err)
                })
            }).catch((err) => {
                res.statusCode = 500;
                res.end("Error while hashing password")
                console.error("Error while hashing password: ", err)
            })
        }).catch((err) => {
            res.statusCode = 400;
            res.end("Invalid request")
        })
    }



    getOnlineGameData(token) {
        return new Promise((resolve, reject) => {
            databaseController.collection("users").findOne({
                session: token
            }).then((user) => {
                return resolve(user)
            }).catch((err) => {
                return reject(err)
            })
        })
    }

}

module.exports = new UserController()