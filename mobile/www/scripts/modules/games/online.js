import Playing from "./playing.js";
import Viewer from "../viewer.js";
import Game from "../game.js";
import modaliser from "../utils/modaliser.js";
import Emotes from "../emotes.js";
import navigation from "../utils/navigation.js";
import generator from "../utils/generator.js";

class Online extends Playing {
    duel;

    constructor(socket, isDuel = false, duelRoomID) {
        super("online");
        this.socket = socket;
        this.duel = isDuel;
        this.duelRoomID = duelRoomID;
        console.log(this.duelRoomID)
        // this game is a duel
        if (this.duel) {
            //joining a duelroom
            if (this.duelRoomID) {
                console.log("on essaye de join")
                this.socket.emit("joinDuelRoom", duelRoomID);
            }
            // creating a duelRoom
            else {
                console.log("on crée une room")
                this.socket.emit("createDuelRoom");
            }
        } else {
            socket.emit("joinQueue")
        }

        socket.on("waiting", () => {
            console.log("waiting");
            //TODO add modal displaying the waiting informations
            modaliser.open("waiting")
        })

        socket.on("waitingFriend", () => {
            modaliser.open("waitingDuel")
        })

        socket.on("opponentLeft", () => this.opponentLeft())

        socket.on("roomSetup", (data) => {
            console.log("on setup la room")
            modaliser.close()
            console.log(this.duel)
            if (!this.duel) {
                console.log("oui bonsoir")
                socket.emit("joinRoom", data) // send roomUUID and startingPlayer
                this.currentPlayer = data[2]
            } else {
                this.currentPlayer = data[2] === this.socket.id ? 2 : 1;
            }
            this.starter = data[1]; // use socketPlayerValue to identify the player
            this.players = data[3]

            // set game and viewer
            this.game = new Game(this.starter)
            this.viewer = new Viewer(this.players, this.starter)
            this.viewer.init().finally(() => {
                navigation.load("ONLINE")

                if (this.game.player !== this.currentPlayer) this.disable(); else this.enable()

                let emotes = new Emotes(this.currentPlayer)

                emotes.dispatcher.addEventListener("emote", (e) => {
                    socket.emit("emote", {
                        "player": this.currentPlayer,
                        "image": e.detail.image || null,
                        "sentence": e.detail.sentence || null
                    })
                })

                socket.on("emote", (data) => emotes.printEmote(data.player, data.image, data.sentence))

                socket.on("updatedRoom", (data) => {
                    console.log(data)
                    let lastMove = this.game.findLastMove(data.board)
                    this.game.play(lastMove)
                    this.disable();
                    if (data.ended) this.endGame(data);
                })

                this.viewer.dispatcher.addEventListener("move", (e) => {
                    this.disable()
                    return socket.emit("newMoveRoom", [e.detail.column, e.detail.row]);
                })
            })

            this.game.dispatcher.addEventListener("newMove", (e) => {
                this.viewer.addToken(e.detail.column, e.detail.row, e.detail.player).then(() => {
                    if (e.detail.player !== this.currentPlayer && !this.game.isGameOver()) this.enable();
                })
            })
        })
    }

    opponentLeft() {
        let endOnlineModal = {
            "title": "Que souhaitez-vous faire ?", "closable": false, "fade-in": true, "content": [{
                "type": "text", "value": "votre adversaire a abandonné"
            }, {
                "type": "button", "label": "Rejouer", "action": {
                    "event": "play_online"
                }

            }, {
                "type": "button", "label": "Retour au menu principal", "action": {
                    "modal": "play"
                }
            }]
        }
        modaliser.save("endOnlineGame", endOnlineModal);
        modaliser.open("endOnlineGame");
    }

    disable() {
        this.viewer.disable()
    }

    enable() {
        this.viewer.enable()
    }

    reset() {
        this.socket.emit("leave")
    }

    save() {
        return {
            "type": this.type, "moves": this.game.getHistory()
        }
    }

    endGame(socketData) {
        console.log(socketData)
        let data
        console.log(this.duel)
        if (socketData["previous-elo"] && socketData["new-elo"]) {
            data = {
                "winner": socketData.winner || null,
                "player1": this.players[0].name,
                "player2": this.players[1].name,
                "type": socketData.winner ? (socketData.winner === this.currentPlayer ? "winning" : "losing") : "draw",
                "previous-elo": socketData["previous-elo"][(socketData.winner === this.currentPlayer ? 0 : 1)],
                "new-elo": socketData["new-elo"][(socketData.winner === this.currentPlayer ? 0 : 1)],
            }
        }
        else {
            data = {
                "winner": socketData.winner || null,
                "player1": this.players[0].name,
                "player2": this.players[1].name,
                "type": socketData.winner ? (socketData.winner === this.currentPlayer ? "winning" : "losing") : "draw",
            }
        }
        modaliser.save("end", generator.endGameModal(data, "play_online"))
        modaliser.open("end")
    }
}

export default Online