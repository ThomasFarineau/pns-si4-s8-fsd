const helper = require("../utils/Helper");
const databaseController = require("./database.controller");

class DuelController {

    async remove(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                databaseController.db.collection("duelRequests").deleteOne({
                    sender: user._id
                }).then((result) => {
                    if (result.deletedCount === 0) {
                        res.end("Duel request did not exist")
                    } else {
                        res.end("Duel request removed")
                    }
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end("Error removing duel request: " + err)
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

    async add(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                if (req.body.user === undefined) {
                    res.statusCode = 400;
                    res.end("User is required")
                } else {
                    //could add a "if both are friend" condition
                    if (user._id.toString() !== helper.toObjectId(req.body.user).toString()) {
                        databaseController.db.collection("duelRequests").findOne({
                            $or: [{
                                sender: user._id, receiver: helper.toObjectId(req.body.user)
                            }, {
                                receiver: user._id, sender: helper.toObjectId(req.body.user)
                            }]
                        }).then((duelRequest) => {
                            // if request doesn't exist, create a new request
                            if (duelRequest === null) {
                                if (req.body.roomID !== undefined) {
                                    databaseController.db.collection("duelRequests").insertOne({
                                        sender: user._id,
                                        receiver: helper.toObjectId(req.body.user),
                                        created_at: new Date(),
                                        roomID: req.body.roomID
                                    }).then(() => {
                                        res.end("Request sent")
                                    }).catch((err) => {
                                        res.statusCode = 500;
                                        res.end("Error while inserting request: " + err)
                                    })
                                }
                                else {
                                    res.statusCode = 400;
                                    res.end("You need a room ID")
                                }
                            } else {
                                if (duelRequest.sender.toString() === user._id.toString()) {
                                    res.statusCode = 400;
                                    res.end("Request already sent")
                                } else {
                                    // delete request and allow duel
                                    databaseController.db.collection("duelRequests").findOneAndDelete({
                                        _id: duelRequest._id
                                    }).then((deleted) => {
                                        console.log(deleted)
                                        res.end(JSON.stringify({roomID: deleted.value.roomID}))
                                    }).catch((err) => {
                                        res.statusCode = 500;
                                        res.end("Error while inserting friend: " + err)
                                    })
                                }
                            }
                        }).catch((err) => {
                            res.statusCode = 500;
                            res.end("Error while finding duel: " + err)
                        })
                    } else {
                        res.statusCode = 400;
                        res.end("You can't duel yourself")
                    }
                }
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid session token : " + err)
            })
        }).catch((err) => {
            res.statusCode = 401;
            res.end("Invalid bearer: " + err)
        })
    }

    async get(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                databaseController.db.collection("duelRequests").find({receiver: user._id}).toArray().then((requests) => {
                    if (requests !== null) {
                        let count = 0
                        let requestUsers = []
                        if (requests.length > 0) {
                            for (let request of requests) {
                                databaseController.db.collection("users").findOne({_id: request.sender}).then((requestUser) => {
                                    delete requestUser.password
                                    delete requestUser.mail
                                    delete requestUser.session
                                    requestUser.roomID = request.roomID
                                    requestUsers.push(requestUser)
                                    count++
                                    if (count >= requests.length) {
                                        res.statusCode = 200;
                                        res.end(JSON.stringify(requestUsers))
                                    }
                                })
                            }
                        } else {
                            res.statusCode = 200;
                            res.end(JSON.stringify(requestUsers))
                        }
                    } else {
                        res.statusCode = 500;
                        res.end("Error fetching friend requests")
                    }
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end("Error while getting friend requests: " + err)
                })
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid session token : " + err)
            })
        }).catch((err) => {
            res.statusCode = 401;
            res.end("Invalid bearer: " + err)
        })
    }
}
module.exports = new DuelController();