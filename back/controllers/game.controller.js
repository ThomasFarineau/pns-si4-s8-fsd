const Validator = require("../utils/Validator");
const helper = require("../utils/Helper");
const databaseController = require("./database.controller");
const fs = require("fs");

class GameController {


    getLoserGif(req, res) {
        helper.gif("loser").then((gif) => {
            res.writeHead(200, {'Content-Type': 'image/gif'});
            res.end(fs.readFileSync(gif));
        }).catch((err) => {
            res.statusCode = 500;
            res.end("Internal server error: " + err)
        })
    }

    getWinnerGif(req, res) {
        helper.gif("winner").then((gif) => {
            res.writeHead(200, {'Content-Type': 'image/gif'});
            res.end(fs.readFileSync(gif));
        }).catch((err) => {
            res.statusCode = 500;
            res.end("Internal server error: " + err)
        })
    }

    getDrawGif(req, res) {
        helper.gif("draw").then((gif) => {
            res.writeHead(200, {'Content-Type': 'image/gif'});
            res.end(fs.readFileSync(gif));
        }).catch((err) => {
            res.statusCode = 500;
            res.end("Internal server error: " + err)
        })
    }

    getLocalGif(req, res) {
        helper.gif("local").then((gif) => {
            res.writeHead(200, {'Content-Type': 'image/gif'});
            res.end(fs.readFileSync(gif));
        }).catch((err) => {
            res.statusCode = 500;
            res.end("Internal server error: " + err)
        })
    }


    async get(req, res) {
        helper.checkBearer(req).then((session) => {
            helper.checkSession(session).then((user) => {
                databaseController.collection("games").findOne({
                    "user": user._id, type: req.body.type
                }).then((game) => {
                    if (!game) {
                        res.statusCode = 404;
                        res.end("Game not found")
                    } else {
                        res.statusCode = 200;
                        if (game.settings) {
                            res.end(JSON.stringify({
                                "moves": game.moves, "settings": game.settings
                            }))
                        } else {
                            res.end(JSON.stringify({
                                "moves": game.moves
                            }))
                        }
                    }
                }).catch((err) => {
                    res.statusCode = 500;
                    res.end("Internal server error: " + err)
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

    async save(req, res) {
        Validator.validate(req.body, {
            type: "required:true|type:string",
            moves: "required:true|type:string",
            settings: "required:false|type:string"
        }).then(r => {
            if (req.body.type === "local" && !req.body.settings) {
                res.statusCode = 400;
                res.end("Invalid request: Local game must include settings")
            }
            helper.checkBearer(req).then((session) => {
                helper.checkSession(session).then((user) => {
                    if (!req.body.settings) req.body.settings = null
                    databaseController.collection("games").replaceOne({
                        "user": user._id, type: req.body.type
                    }, {
                        "user": user._id, type: req.body.type, moves: req.body.moves, settings: req.body.settings
                    }, {
                        upsert: true
                    }).then(() => {
                        res.statusCode = 201;
                        res.end("Game saved")
                    }).catch((err) => {
                        res.statusCode = 500;
                        res.end("Internal server error: " + err)
                    })
                }).catch((err) => {
                    res.statusCode = 401;
                    res.end("Invalid session token : " + err)
                })
            }).catch((err) => {
                res.statusCode = 401;
                res.end("Invalid authorization header: " + err)
            })
        }).catch((err) => {
            res.statusCode = 400;
            res.end("Invalid request: " + err)
        })
    }

}

module.exports = new GameController()