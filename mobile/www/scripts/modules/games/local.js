import Playing from "./playing.js";
import Viewer from "../viewer.js";
import Game from "../game.js";
import modaliser from "../utils/modaliser.js";
import navigation from "../utils/navigation.js";
import generator from "../utils/generator.js";

class Local extends Playing {

    constructor(column = 7, row = 6, connect = 4, moves = null, starter = Math.floor(Math.random() * 2) + 1, currentPlayer = null) {
        super("local");
        this.starter = starter;
        this.column = column;
        this.row = row;
        this.connect = connect;
        if(moves) {
            moves = JSON.parse(moves)
            this.starter = moves[0][3] === 1 ? 2 : 1
        }
        this.players = [{
            name: "Joueur 1", profile: "color", color: "#ED2E2E", darkerColor: "#B71C1C"
        }, {
            name: "Joueur 2", profile: "color", color: "#FFC700", darkerColor: "#C79D00"
        }]

        // set game and viewer
        if (currentPlayer !== null)
            this.game = new Game(currentPlayer)
        else
            this.game = new Game(this.starter)
        if(moves) this.game.handleMoves(moves)
        this.viewer = new Viewer(this.players, this.starter)
        this.viewer.init().finally(() => {
            navigation.load("LOCAL")

            if(moves) this.viewer.fill(this.game.moves)
            this.enable()
            this.viewer.dispatcher.addEventListener("move", (e) => {
                let move = [e.detail.column, e.detail.row]
                this.game.play(move)
                this.disable()
            })
        })

        this.game.dispatcher.addEventListener("newMove", (e) => {
            this.viewer.addToken(e.detail.column, e.detail.row, e.detail.player).then(() => {
                this.enable()
            })
        })

        this.game.dispatcher.addEventListener("gameOver", (e) => {
            this.disable()
            let data = {
                "winner": e.detail,
            }
            modaliser.save("end", generator.endGameModal(data, "play_local"))
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
            "type": this.type,
            "settings": "[" + this.column + ", " + this.row + ", " + this.connect + "]",
            "moves": this.game.getHistory(),
            "player": this.game.player
        }
    }
}

export default Local