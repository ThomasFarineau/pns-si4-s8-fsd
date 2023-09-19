import Playing from "./playing.js";
import Viewer from "../viewer.js";
import Game from "../game.js";
import modaliser from "../utils/modaliser.js";
import navigation from "../utils/navigation.js";
import generator from "../utils/generator.js";

class AI extends Playing {

    constructor(socket, moves = null, starter = Math.floor(Math.random() * 2) + 1) {
        super("ai");
        this.starter = starter;
        if (moves) {
            moves = JSON.parse(moves)
            this.starter = moves[moves.length - 1][3] === 1 ? 2 : 1
        }
        this.players = [{
            name: "Joueur", profile: "color", color: "#ED2E2E", darkerColor: "#B71C1C"
        }, {
            name: "Robot", profile: "color", color: "#FFC700", darkerColor: "#C79D00"
        }]

        // set game and viewer
        this.game = new Game(this.starter)
        if (moves) this.game.handleMoves(moves)
        this.viewer = new Viewer(this.players, this.starter)
        this.viewer.init().finally(() => {
            navigation.load("AI")
            if (moves) {
                this.viewer.fill(this.game.moves)

                socket.emit("retrieve", {
                    moves: moves,
                });

            } else {
                socket.emit("setup", {
                    AIplays: this.starter === 1 ? 2 : 1, board: this.game.board,
                });
            }

            socket.on("setup", () => {
                if (this.starter === 2) this.disable(); else this.enable();
            })

            socket.on("updatedBoard", (data) => {
                let lastMove = this.game.findLastMove(data.board)
                this.game.play(lastMove)
            })

            this.viewer.dispatcher.addEventListener("move", (e) => {
                this.disable()
                return socket.emit("newMove", [e.detail.column, e.detail.row]);
            })
        })

        this.game.dispatcher.addEventListener("newMove", (e) => {
            this.viewer.addToken(e.detail.column, e.detail.row, e.detail.player).then(() => {
                if (e.detail.player === 2) this.enable();
            })
        })

        this.game.dispatcher.addEventListener("gameOver", (e) => {
            this.disable()
            let data = {
                "winner": e.detail,
                "player1": this.players[0].name,
                "player2": this.players[1].name,
                "type": e.detail ? (e.detail === 1 ? "winning" : "losing") : "draw"
            }
            modaliser.save("end", generator.endGameModal(data, "play_ai"))
            modaliser.open("end")
        })
    }

    disable() {
        this.viewer.disable()
    }

    enable() {
        this.viewer.enable()
    }

    reset() {
        console.log("oui")
    }

    save() {
        return {
            "type": this.type, "moves": this.game.getHistory()
        }
    }
}

export default AI