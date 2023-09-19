const encrypter = require("./utils/Encrypter");
// const bot = require("../bots/minimax");
const {Game} = require("./utils/Game");
const userController = require("./controllers/user.controller");
const databaseController = require("./controllers/database.controller");
const {Minimax} = require("../bots/minimax");

function determineFactor(elo) {
    if (elo < 2100) return 32
    if (elo > 2400) return 16
    return 24
}

class SocketHandler {
    static waitingList = []; //contains only socketIDs
    static usersList = []; //"socketID" --> "userID"

    roomId
    bot

    constructor(socket, io) {
        this.io = io
        this.socket = socket

        // add socket to this.io.sockets.adapter.rooms[roomID]
        this.socket.on('connect', () => {
        })
        this.socket.on('disconnect', () => {
            this.leaveRoom()
            this.cancelOnline()
        });
        this.socket.on('login', (data) => this.login(data.token))
        this.socket.on('setup', async (data) => await this.setup(data.AIplays))
        this.socket.on('retrieve', async (data) => await this.retrieve(data.moves))
        this.socket.on('newMove', (data) => this.newMove(data))

        this.socket.on('joinQueue', () => this.joinQueue())
        this.socket.on('joinRoom', data => this.joinRoom(data))
        this.socket.on('newMoveRoom', data => this.newMoveRoom(data))

        this.socket.on('emote', (data) => io.of('api/game').in(this.roomId).emit('emote', data))
        this.socket.on('reset', (data) => {

        })
        this.socket.on('leave', (data) => this.leaveRoom());
        this.socket.on('cancelOnline', (data) => this.cancelOnline());

        this.socket.on('createDuelRoom', () => this.createDuelRoom());
        this.socket.on('joinDuelRoom', (roomID) => this.joinDuelRoom(roomID));
    }

    login(token) {
        encrypter.unjwt(token).then((data) => {
            if (this.findSocketByToken(data)) {
                this.socket.emit("alreadyLogged")
                return
            }
            this.socket.handshake.auth.token = data
        })
    }

    findSocketByToken(token) {
        let clients = this.io.of('api/game').sockets;
        let socket = null;
        clients.forEach((client) => {
            if (client.handshake.auth.token === token) socket = client
        })
        return socket
    }

    joinQueue() {
        if (!SocketHandler.waitingList.includes(this.socket)) {
            //console.log("joinQueue", SocketHandler.waitingList.length);
            SocketHandler.waitingList.push(this.socket);
        }
        this.socket.emit("waiting");
        this.matchmaking();
    }

    matchmaking() {
        //console.log("matchmaking", "Matchmaking is called")
        //console.log("matchmaking - roomId", this.roomId);
        if (this.roomId) return;
        //console.log("matchmaking", SocketHandler.waitingList)
        if (SocketHandler.waitingList.length >= 2) {
            //console.log("on est la")
            //TODO add elo matchmaking logic
            let data = this.createRoom(); // roomUUID
            let startingPlayer = +(Math.random() < 0.5) + 1;

            // get player 1 info from database
            let player1Token = SocketHandler.waitingList[0].handshake.auth.token
            let player2Token = SocketHandler.waitingList[1].handshake.auth.token
            userController.getOnlineGameData(player1Token).then((data1) => {
                userController.getOnlineGameData(player2Token).then((data2) => {
                    let players = [{
                        name: data1.username, profile: "color", color: "#ED2E2E", darkerColor: "#B71C1C", elo: data1.elo
                    }, {
                        name: data2.username, profile: "color", color: "#FFC700", darkerColor: "#C79D00", elo: data2.elo
                    }]
                    this.io.sockets.adapter.rooms[data].playerIds = []
                    this.io.sockets.adapter.rooms[data].playerIds.push(data1._id)
                    this.io.sockets.adapter.rooms[data].playerIds.push(data2._id)
                    SocketHandler.waitingList[0].emit("roomSetup", [data, startingPlayer, 1, players]);
                    SocketHandler.waitingList[1].emit("roomSetup", [data, startingPlayer, 2, players]);
                })
            })

        } else {
            let currentHandler = this;
            setTimeout(function () {
                currentHandler.matchmaking();
            }, 1000);
        }

    }

    createRoom() {
        let roomId = encrypter.uuid()
        this.io.sockets.adapter.rooms[roomId] = {
            id: roomId, players: [], game: undefined
        }
        return roomId;
    }


    joinRoom(data) {
        //makes the socket join room AND create new game
        let room = data[0];
        this.roomId = room;
        this.io.sockets.adapter.rooms[room].players.push(this.socket.id);
        this.socket.join(room);
        const index = SocketHandler.waitingList.indexOf(this.socket);

        //console.log("index is : " + index);
        //console.log("before splice : " + SocketHandler.waitingList.length)
        SocketHandler.waitingList.splice(index, 1);

        //console.log("after splice : " + SocketHandler.waitingList.length)

        this.socket.emit('joined', {
            "type": "joining", id: room, roomData: this.io.sockets.adapter.rooms[room]
        });
        this.socketPlayerValue = data[2];
        //also initialize game
        if (this.io.sockets.adapter.rooms[data[0]].game === undefined) {
            //console.log("game created backend");
            this.io.sockets.adapter.rooms[data[0]].game = new Game(data[1] === 1 ? 2 : 1);
        }
        //console.log("Room Joined");
    }

    createDuelRoom() {
        let player1Token = this.socket.handshake.auth.token
        let player;
        userController.getOnlineGameData(player1Token).then((data1) => {
            player = {
                socket: this.socket.id,
                name: data1.username,
                profile: "color",
                color: "#ED2E2E",
                darkerColor: "#B71C1C",
                elo: data1.elo
            }
            let roomID = this.createRoom()
            //makes the socket join room AND create new game
            this.roomId = roomID;
            //call to DB do add duel
            this.io.sockets.adapter.rooms[this.roomId].vplayers = [player];
            this.socket.join(this.roomId);
            //player who creates the room always is first
            this.socketPlayerValue = 1;
            let data = {roomID: roomID}
            console.log(data)
            this.socket.emit("waitingFriend")
            this.socket.emit("duelRoomCreated", data);
        })
    }

    joinDuelRoom(roomID) {
        console.log("on a join")
        let player2Token = this.socket.handshake.auth.token
        let player;
        userController.getOnlineGameData(player2Token).then((data1) => {
            player = {
                socket: this.socket.id,
                name: data1.username,
                profile: "color",
                color: "#FFC700",
                darkerColor: "#C79D00",
                elo: data1.elo
            }
            this.roomId = roomID;
            this.io.sockets.adapter.rooms[this.roomId].vplayers = [this.io.sockets.adapter.rooms[this.roomId].vplayers[0], player];

            this.socket.join(this.roomId);
            let startingPlayer = +(Math.random() < 0.5) + 1;

            this.socketPlayerValue = 2;
            this.io.sockets.adapter.rooms[this.roomId].game = new Game(startingPlayer === 1 ? 2 : 1, true)
            let that = this;
            that.io.of('/api/game').to(this.roomId).emit("roomSetup", [this.roomId, startingPlayer, this.socket.id, this.io.sockets.adapter.rooms[this.roomId].vplayers])
        })
    }

    newMoveRoom(move) {
        let game = this.io.sockets.adapter.rooms[this.roomId].game;
        let p = this.socketPlayerValue
        if (!(p === 1 || p === 2)) {
            p = this.io.sockets.adapter.rooms[this.roomId].players.indexOf(this.socket.id) + 1
        }
        console.log(game.player, p)
        if (game.player === p) {
            // is the move is legal
            if (game.play(move)) {
                if (game.ended !== true) {
                    this.io.of('/api/game').to(this.roomId).emit("updatedRoom", {
                        board: game.grid, ended: game.ended
                    });
                } else {
                    if (game.duel) {
                        let that = this
                        that.io.of('/api/game').to(this.roomId).emit("updatedRoom", {
                            board: game.grid, ended: game.ended, winner: game.winner
                        });
                    } else {
                        let winnerId;
                        let loserId;
                        if (game.winner !== null) {
                            winnerId = this.io.sockets.adapter.rooms[this.roomId].playerIds[game.winner - 1]
                            loserId = this.io.sockets.adapter.rooms[this.roomId].playerIds[game.winner === 1 ? 1 : 0]
                        } else {
                            winnerId = this.io.sockets.adapter.rooms[this.roomId].playerIds[0]
                            loserId = this.io.sockets.adapter.rooms[this.roomId].playerIds[1]
                        }
                        let that = this
                        let roomId = this.roomId
                        databaseController.collection("users").findOne({_id: winnerId}).then((winner) => {
                            databaseController.collection("users").findOne({_id: loserId}).then((loser) => {
                                let winnerElo = winner.elo
                                let loserElo = loser.elo
                                let newWinnerElo = Math.round(winnerElo + determineFactor(winnerElo) * ((game.winner === null ? 0.5 : 1) - 1 / (1 + Math.pow(10, -Math.min(winnerElo - loserElo, 400) / 400))))
                                let newLoserElo = Math.round(loserElo + determineFactor(loserElo) * ((game.winner === null ? 0.5 : 0) - 1 / (1 + Math.pow(10, -Math.min(loserElo - winnerElo, 400) / 400))))
                                that.io.of('/api/game').to(roomId).emit("updatedRoom", {
                                    board: game.grid,
                                    ended: game.ended,
                                    winner: game.winner,
                                    "previous-elo": [winnerElo, loserElo],
                                    "new-elo": [newWinnerElo, newLoserElo]
                                });

                                databaseController.collection("users").updateOne({_id: winnerId}, {$set: {elo: newWinnerElo}}).then(() => {
                                    databaseController.collection("users").updateOne({_id: loserId}, {$set: {elo: newLoserElo}}).then(() => {
                                        console.log("elo updated")
                                    }).catch((e) => console.warn(e))
                                }).catch((e) => console.warn(e))
                            }).catch((e) => console.warn(e))
                        }).catch((e) => console.warn(e))
                    }
                    delete this.io.sockets.adapter.rooms[this.roomId];
                    this.roomId = undefined;
                }
            }
        } else {
            console.log("marche pas")
        }
    }

    cancelOnline() {
        // remove the socket from the waiting list
        SocketHandler.waitingList.splice(SocketHandler.waitingList.indexOf(this.socket.id), 1);
    }

    leaveRoom() {
        for (let room in this.io.sockets.adapter.rooms) {
            let roomData = this.io.sockets.adapter.rooms[room];
            if (roomData.players.includes(this.socket.id)) {
                roomData.players.splice(roomData.players.indexOf(this.socket.id), 1);
                this.socket.to(room).emit("opponentLeft");
                this.socket.leave(room);
                this.socket.emit('left', {
                    id: room, roomData: this.io.sockets.adapter.rooms[room]
                });
                this.roomId = undefined;
                this.socketPlayerValue = undefined
                return;
            }
        }
    }

    async retrieve(moves) {
        let game = new Game(moves[moves.length - 1][3])
        game.handleMoves(moves)
        this.bot = new Minimax(game.player);
        for (let k in moves) this.bot.play(moves[k][1], moves[k][2], moves[k][3])
        if (game.player === 2) {
            let move = await this.bot.nextMove(moves)
            game.play(move)
            this.socket.emit("updatedBoard", {board: game.grid, ended: game.ended, winner: game.winner})
        }
        this.socket.handshake.auth.game = game
    }

    async setup(AIplays) {
        let game = new Game(AIplays)
        this.bot = new Minimax(game.player);
        this.socket.emit("setup")
        if (game.player === 2) {
            let move = await this.bot.nextMove([]);
            game.play(move)
            this.socket.emit("updatedBoard", {board: game.grid, ended: game.ended, winner: game.winner})
        }
        this.socket.handshake.auth.game = game
    }

    newMove(move) {
        let game = this.socket.handshake.auth.game
        if (game) {
            if (game.player === 1 && game.play(move)) {
                this.socket.emit("updatedBoard", {board: game.grid, ended: game.ended, winner: game.winner})
                if (!game.ended) {
                    setTimeout(async () => {
                        let botMove = await this.bot.nextMove(move)
                        game.play(botMove)
                        this.socket.emit("updatedBoard", {board: game.grid, ended: game.ended, winner: game.winner})
                    }, 250)
                }
            }
        }
    }
}

module.exports = SocketHandler;