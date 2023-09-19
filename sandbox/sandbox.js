const ai = require("../bots/minimax");
const ai2 = require("../bots/thomas");
const {Game} = require("../back/utils/Game");

class Sandbox {
    constructor() {
        this.player1 = 0;
        this.player2 = 0;
        this.draw = 0;
    }

    async setup(n) {
        for (let i = 0; i < n; i++) {
            let r = Math.random() < 0.5 ? 1 : 2;
            ai.setup(r);
            ai2.setup(r === 2 ? 1 : 2);
            let game = new Game(r)
            let lastMove2 = [];

            console.log("Game " + i + " - player " + game.player + " starts")
            while (!game.ended) {
                if (game.player === 1) {
                    let move = await ai.nextMove(lastMove2);
                    lastMove2 = move;
                    game.play(move[0], move[1])
                } else {
                    let move = ai2.nextMove(lastMove2);
                    lastMove2 = move;
                    game.play(move[0], move[1])
                }
                if (game.ended) {
                    if (game.winner === 1) {
                        this.player1++;
                        console.log("Game " + i + " - won by player 1")
                    } else if (game.winner === 2) {
                        this.player2++;
                        console.log("Game " + i + " - won by player 2")
                    } else {
                        this.draw++;
                        console.log("Game " + i + " - draw")
                    }
                }
            }
        }
        // stats
        console.log("Player 1 won " + (this.player1 / n) * 100 + "% of the time")
        console.log("Player 2 won " + (this.player2 / n) * 100 + "% of the time")
        console.log("Draw " + (this.draw / n) * 100 + "% of the time")
    }

}

let sandbox = new Sandbox();
sandbox.setup(25);


