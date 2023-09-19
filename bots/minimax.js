class Minimax {
    grid;
    currentPlayer;
    time;
    position_heuristics;

    constructor(AIplays) {
        this.position_heuristics = [[2, 2, 2, 2, 2, 2], [3, 4, 5, 5, 4, 3], [4, 6, 8, 8, 6, 4], [6, 8, 10, 10, 8, 6], [4, 6, 8, 8, 6, 4], [3, 4, 5, 5, 4, 3], [2, 2, 2, 2, 2, 2]];
        this.currentPlayer = AIplays;
        this.grid = new Array(7)
        for (let i = 0; i < 7; i++) {
            this.grid[i] = new Array(6)
            for (let j = 0; j < 6; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    playFromServer(col, row, player) {
        this.play(this.grid, col, row, player);
    }

    getGrid() {
        return this.grid;
    }

    play(gr, col, row, player) {

        let n = gr[col].filter(e => e === 0).length;

        if (n > 0) {
            gr[col][6 - n] = player;
            return true;
        }
        return false;
    }

    // playableMoves(gameState) {
    //     let ret = []
    //     for (let i = 0; i < 7; i++) {
    //         for (let j = 0; j < 6; j++) {
    //             if (gameState[i][j] === 0) {
    //                 let arr = new Array(2);
    //                 arr = [i, j]
    //                 ret.push(arr);
    //                 break;
    //             }
    //         }
    //     }
    //     return ret;
    // }

    nextMove(lastMove) {
        //console.log(lastMove)
            this.time = performance.now()
            if (lastMove.length !== 0) {
                this.play(this.grid, lastMove[0], lastMove[1], this.currentPlayer);
                if (this.currentPlayer === 1) {
                    this.currentPlayer = 2;
                } else if (this.currentPlayer === 2) {
                    this.currentPlayer = 1;
                }
            }
            let ret;
            let finalRet;
            let depth = 1;
            while (performance.now() - this.time < 95 && depth <= 42) {
                finalRet = ret;
                ret = this.minimax(this.grid, this.currentPlayer, depth, -Number.MAX_VALUE, Number.MAX_VALUE)[1];
                depth++;
            }
            if (finalRet[0] === -1 && finalRet[1] === -1) {
                finalRet = this.playableMoves(this.grid)[Math.floor(Math.random() * 7)];
            }
            this.play(this.grid, finalRet[0], finalRet[1], this.currentPlayer);

            if (this.currentPlayer === 1) {
                this.currentPlayer = 2;
            } else if (this.currentPlayer === 2) {
                this.currentPlayer = 1;
            }
            return finalRet
    }

    minimax(gameState, player, depth, alpha, beta) {
        if (performance.now() - this.time > 98) {
            let val;
            if (player === 1) {
                val = -Number.MAX_VALUE;
            }
            if (player === 2) {
                val = Number.MAX_VALUE;
            }
            return [val, [-1, -1]]
        }

        let allMoves = this.playableMoves(gameState);
        let score = this.applyPoints(gameState);

        if (depth === 0 || score <= -1000 || score >= 1000 || allMoves.length === 0) {
            return [score, [-1, -1]];
        }

        if (player === 1) {
            let moveToPlay = [-1, -1]
            let maxVal = -Number.MAX_VALUE;
            for (const element of allMoves) {
                let currentMove = element;
                let newGameState = new Array(7);
                for (let j = 0; j < 7; j++) {
                    let c = new Array(6);
                    for (let k = 0; k < 6; k++) {
                        c[k] = (gameState[j][k] * 1);
                    }
                    newGameState[j] = c;
                }
                this.play(newGameState, currentMove[0], currentMove[1], 1);
                let val = this.minimax(newGameState, 2, depth - 1, alpha, beta)[0];
                if (val > maxVal) {
                    maxVal = val;
                    moveToPlay = currentMove;
                }
                alpha = Math.max(alpha, val);
                if (beta <= alpha) {
                    break;
                }
            }
            return [maxVal, moveToPlay]
        }
        if (player === 2) {
            let moveToPlay = [-1, -1]
            let minVal = Number.MAX_VALUE;
            for (const element of allMoves) {
                let currentMove = element;
                let newGameState = new Array(7);
                for (let j = 0; j < 7; j++) {
                    let c = new Array(6);
                    for (let k = 0; k < 6; k++) {
                        c[k] = (gameState[j][k] * 1);
                    }
                    newGameState[j] = c;
                }
                this.play(newGameState, currentMove[0], currentMove[1], 2);
                let val = this.minimax(newGameState, 1, depth - 1, alpha, beta)[0]
                if (val < minVal) {
                    minVal = val
                    moveToPlay = currentMove;
                }
                beta = Math.min(beta, val);
                if (beta <= alpha) {
                    break;
                }
            }
            return [minVal, moveToPlay]
        }
    }


        ScoreHeuristic(HumanInRow, ComputerInRow, p1Tokens, p2Tokens) {
            let points = 0;
            switch (HumanInRow) {
                case 4:
                    points += 100000;
                    break;
                case 3:
                    if (p2Tokens === 0) {
                        points += 80;
                    } else {
                        points += 40;
                    }
                    break;
                case 2:
                    points += 20 - 5 * p2Tokens;
                    break;
            }
            switch (ComputerInRow) {
                case 4:
                    points -= 100000;
                    break;
                case 3:
                    if (p1Tokens === 0) {
                        points -= 80;
                    } else {
                        points -= 40;
                    }
                    break;
                case 2:
                    points -= 20 + 5 * p1Tokens;
                    break;
            }
            return points;
        }

        applyPoints(gameState) {
            let score = 0;
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 6; j++) {
                    if (gameState[i][j] === 1) {
                        score += this.position_heuristics[i][j];
                    }
                    if (gameState[i][j] === 2) {
                        score -= this.position_heuristics[i][j];
                    }
                }
            }
            //apply points for rows
            for (let rows = 0; rows < 6; rows++) {
                for (let column = 0; column <= 7 - 4; column++) {
                    let p1InRow = 0, p2InRow = 0, p1Tokens = 0, p2Tokens = 0;
                    for (let offset = column; offset < column + 4; offset++) {
                        if (gameState[offset][rows] === 1) {
                            p1InRow++;
                            p2InRow = 0;
                            p1Tokens++;
                        } else if (gameState[offset][rows] === 2) {
                            p2InRow++;
                            p1InRow = 0;
                            p2Tokens++;
                        }
                    }

                    score += this.ScoreHeuristic(p1InRow, p2InRow, p1Tokens, p2Tokens);
                    if (score <= -1000 || score >= 1000) return score;
                }
            }

            //apply points for columns
            for (let column = 0; column < 7; column++) {
                for (let rows = 0; rows <= 6 - 4; rows++) {
                    let p1InRow = 0, p1Tokens = 0, p2Tokens = 0;
                    let p2InRow = 0;

                    for (let offset = rows; offset < rows + 4; offset++) {
                        if (gameState[column][offset] === 1) {
                            p1InRow++;
                            p2InRow = 0;
                            p1Tokens++;
                        } else if (gameState[column][offset] === 2) {
                            p2InRow++;
                            p1InRow = 0;
                            p2Tokens++;
                        }
                    }

                    score += this.ScoreHeuristic(p1InRow, p2InRow, p1Tokens, p2Tokens);
                    if (score <= -1000 || score >= 1000) return score;
                }
            }

            //apply points for diag
            for (let column = 0; column <= 7 - 4; column++) {
                for (let rows = 0; rows <= 6 - 4; rows++) {
                    let p1InRow = 0, p1Tokens = 0, p2Tokens = 0;
                    let p2InRow = 0;
                    for (let offset = rows; offset < rows + 4; offset++) {
                        if (gameState[column + (offset - rows)][offset] === 1) {
                            p1InRow++;
                            p2InRow = 0;
                            p1Tokens++;
                        } else if (gameState[column + (offset - rows)][offset] === 2) {
                            p2InRow++;
                            p1InRow = 0;
                            p2Tokens++;
                        }
                    }
                    score += this.ScoreHeuristic(p1InRow, p2InRow, p1Tokens, p2Tokens);
                    if (score <= -1000 || score >= 1000) return score;
                }
            }


            //apply points for anti diag
            for (let column = 7 - 1; column >= 7 - 4; column--) {
                for (let rows = 0; rows <= 6 - 4; rows++) {
                    let p1InRow = 0, p1Tokens = 0, p2Tokens = 0;
                    let p2InRow = 0;
                    for (let offset = rows; offset < rows + 4; offset++) {
                        if (gameState[column - (offset - rows)][offset] === 1) {
                            p1InRow++;
                            p2InRow = 0;
                            p1Tokens++;
                        } else if (gameState[column - (offset - rows)][offset] === 2) {
                            p2InRow++;
                            p1InRow = 0;
                            p2Tokens++;
                        }
                    }
                    score += this.ScoreHeuristic(p1InRow, p2InRow, p1Tokens, p2Tokens);
                    if (score <= -1000 || score >= 1000) return score;
                }
            }
            return score;
        }

        playableMoves(gameState) {
            let ret = []
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 6; j++) {
                    if (gameState[i][j] === 0) {
                        ret.push([i, j]);
                        break;
                    }
                }
            }
            return ret;
        }
}
exports.Minimax = Minimax;


// exports.setup = setup;
// exports.nextMove = nextMove;
// exports.play = playFromServer;
// exports.grid = getGrid;