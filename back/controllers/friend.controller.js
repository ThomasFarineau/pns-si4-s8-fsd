const helper = require("../utils/Helper");
const databaseController = require("./database.controller");

class FriendController {

    async remove(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                if (req.body.user === undefined) {
                    res.statusCode = 400;
                    res.end("User is required")
                } else {
                    // check if a friend already exists
                    databaseController.db.collection("friends").deleteOne({
                        $or: [{
                            user1: user._id, user2: helper.toObjectId(req.body.user)
                        }, {
                            user2: user._id, user1: helper.toObjectId(req.body.user)
                        }]
                    }).then((result) => {
                        if (result.deletedCount === 0) {
                            // check if a request already exists
                            databaseController.db.collection("friendRequests").deleteOne({
                                $or: [{
                                    sender: user._id, receiver: helper.toObjectId(req.body.user)
                                }, {
                                    receiver: user._id, sender: helper.toObjectId(req.body.user)
                                }]
                            }).then((result) => {
                                if (result.deletedCount === 0) {
                                    res.statusCode = 400;
                                    res.end("Friend request not found")
                                } else {
                                    res.end("Friend request removed")
                                }
                            })
                        } else {
                            res.end("Friend removed")
                        }
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while removing friend: " + err)
                    })
                }
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
                    if (user._id.toString() !== helper.toObjectId(req.body.user).toString()) {
                        databaseController.db.collection("friends").findOne({
                            $or: [{
                                user1: user._id, user2: helper.toObjectId(req.body.user)
                            }, {
                                user2: user._id, user1: helper.toObjectId(req.body.user)
                            }]
                        }).then((friend) => {
                            if (friend === null) {
                                // check if a request already exists
                                databaseController.db.collection("friendRequests").findOne({
                                    $or: [{
                                        sender: user._id, receiver: helper.toObjectId(req.body.user)
                                    }, {
                                        sender: helper.toObjectId(req.body.user), receiver: user._id
                                    }]
                                }).then((request) => {
                                    // if not, create a new request
                                    if (request === null) {
                                        databaseController.db.collection("friendRequests").insertOne({
                                            sender: user._id,
                                            receiver: helper.toObjectId(req.body.user),
                                            created_at: new Date()
                                        }).then(() => {
                                            res.end("Request sent")
                                        }).catch((err) => {
                                            res.statusCode = 500;
                                            res.end("Error while inserting request: " + err)
                                        })
                                    } else {
                                        if(request.sender.toString() === user._id.toString()) {
                                            res.statusCode = 400;
                                            res.end("Request already sent")
                                        } else {
                                            // delete request and create friend
                                            databaseController.db.collection("friendRequests").deleteOne({
                                                _id: request._id
                                            }).then(() => {
                                                let user2ID = helper.toObjectId(req.body.user)
                                                databaseController.db.collection("friends").insertOne({
                                                    user1: user._id,
                                                    user2: user2ID,
                                                    created_at: new Date()
                                                }).then(() => {
                                                    res.end("Friend added")
                                                    databaseController.db.collection("friends").countDocuments({$or: [{
                                                            user1: user._id
                                                        }, {
                                                            user2: user._id
                                                        }]
                                                    }).then((user1nbFriends) => {
                                                        databaseController.db.collection("friends").countDocuments({$or: [{
                                                                user1: user2ID
                                                            }, {
                                                                user2: user2ID
                                                            }]}
                                                        ).then((user2nbFriends) => {
                                                            if (user1nbFriends >= 1) {
                                                                databaseController.db.collection("achievements").findOne({id: "add1Friend"}).then((achiev) => {
                                                                    databaseController.db.collection("achievementsUnlocked").insertOne({userID: user._id, achievementID: achiev._id}).catch((e) => console.log(e))
                                                                }).catch((e) => console.log(e))
                                                            }
                                                            if (user2nbFriends >= 1) {
                                                                databaseController.db.collection("achievements").findOne({id: "add1Friend"}).then((achiev) => {
                                                                    databaseController.db.collection("achievementsUnlocked").insertOne({userID: user2ID, achievementID: achiev._id}).catch((e) => console.log(e))
                                                                }).catch((e) => console.log(e))
                                                            }
                                                        }).catch((e) => console.log(e))
                                                    }).catch((e) => console.log(e))
                                                }).catch((err) => {
                                                    res.statusCode = 500;
                                                    res.end("Error while inserting friend: " + err)
                                                })
                                            })
                                        }
                                    }
                                })
                            } else {
                                res.statusCode = 400;
                                res.end("Friend already exists")
                            }
                        }).catch((err) => {
                            res.statusCode = 500;
                            res.end("Error while finding friend: " + err)
                        })
                    } else {
                        res.statusCode = 400;
                        res.end("You can't add yourself as a friend")
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
                if (req.body.user !== undefined) {
                    // check if user and req.body.user are friends
                    databaseController.db.collection("friends").findOne({
                        $or: [{
                            user1: user._id, user2: helper.toObjectId(req.body.user)
                        }, {
                            user2: user._id, user1: helper.toObjectId(req.body.user)
                        }]
                    }).then((friend) => {
                        if (friend !== null) {
                            res.statusCode = 200;
                            res.end(JSON.stringify(friend))
                        } else {
                            res.statusCode = 404;
                            res.end("Friend not found")
                        }
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while finding friend: " + err)
                    })
                } else {
                    // get all friends for user
                    databaseController.db.collection("friends").find({
                        $or: [{
                            user1: user._id
                        }, {
                            user2: user._id
                        }]
                    }).toArray().then((friends) => {
                        let nbFriends = friends.length
                        let counter = 0
                        for (let f of friends) {
                            let friendID
                            if (f.user1.toString() === user._id.toString()) {
                                delete f.user1
                                friendID = f.user2
                                delete f.user2
                            }
                            else if (f.user2.toString() === user._id.toString()) {
                                delete f.user2
                                friendID = f.user1
                                delete f.user1
                            }
                            databaseController.db.collection("users").findOne({_id: friendID}, {projection: {username: 1, session: 1}}).then((friend) => {
                                f.friend = friend
                                counter++
                                friend.online = friend.session !== null
                                delete friend.session
                                if (counter >= nbFriends) {
                                    res.statusCode = 200;
                                    res.end(JSON.stringify(friends))
                                }
                            }).catch((e) => console.log(e))
                        }
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while finding friends: " + err)
                    })
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

    async getRequest(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                if (req.body.user !== undefined) {
                    // get requests between user and req.body.user
                    databaseController.db.collection("friendRequests").findOne({
                        $or: [{
                            sender: helper.toObjectId(req.body.user), receiver: user._id
                        }, {
                            sender: user._id, receiver: helper.toObjectId(req.body.user)
                        }]
                    }).then((request) => {
                        if (request !== null) {
                            res.statusCode = 200;
                            res.end(JSON.stringify(request))
                        } else {
                            res.statusCode = 400;
                            res.end("Friend request not found")
                        }
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Error while getting friend requests: " + err)
                    })
                } else {
                    // get all requests for user
                    if (req.body.role !== undefined) {
                        let filter;
                        if (req.body.role === "sender") {
                            filter = {sender: user._id}
                        }
                        else if (req.body.role === "receiver") {
                            filter = {receiver: user._id}
                        }
                        else {
                            res.statusCode = 500;
                            res.end("Error while getting friend requests: unknown role")
                        }
                        databaseController.db.collection("friendRequests").find(filter).toArray().then((requests) => {
                            if (requests !== null) {
                                let count = 0
                                let requestUsers = []
                                if (requests.length > 0) {
                                    for (let request of requests) {
                                        databaseController.db.collection("users").findOne({_id: request.sender}).then((requestUser) => {
                                            delete requestUser.password
                                            delete requestUser.mail
                                            delete requestUser.session
                                            requestUsers.push(requestUser)
                                            count++
                                            if (count >= requests.length) {
                                                res.statusCode = 200;
                                                res.end(JSON.stringify(requestUsers))
                                            }
                                        })
                                    }
                                }
                                else {
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
                    }
                    else {
                        databaseController.db.collection("friendRequests").find({
                            $or: [{
                                receiver: user._id
                            }, {
                                sender: user._id
                            }]
                        }).toArray().then((requests) => {
                            if (requests !== null) {
                                res.statusCode = 200;
                                res.end(JSON.stringify(requests))
                            } else {
                                res.statusCode = 400;
                                res.end("Friend requests not found")
                            }
                        }).catch((err) => {
                            res.statusCode = 500;
                            res.end("Error while getting friend requests: " + err)
                        })
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


}

module.exports = new FriendController();