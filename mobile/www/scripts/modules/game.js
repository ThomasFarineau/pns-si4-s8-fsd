import Move from "./move.js";

class Game {

    dispatcher = new EventTarget();

    constructor(playerTurn, columns = 7, rows = 6, connect = 4) {
        this.board = [];
        this.columns = columns
        this.rows = rows;
        this.connect = connect;

        this.winner = undefined;
        this.players = [];
        this.player = playerTurn;
        this.gameOver = false;
        this.moves = []
        this.initBoard();
    }

    initBoard() {
        for (let i = 0; i < this.columns; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.rows; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    isGameOver() {
        return this.gameOver;
    }

    play(move) {
        if (this.gameOver) return;
        // play
        let playedMove = [0, 0]
        // get the first empty row
        let col = move[0]
        for (let i = 0; i < this.rows; i++) {
            if (this.board[col][i] === 0) {
                playedMove = [col, i];
                break;
            }
        }
        if (move[1] !== playedMove[1]) console.warn("Invalid move, row is not the lowest empty row, received: " + move[1] + ", expected: " + playedMove[1] + ".");
        this.board[playedMove[0]][playedMove[1]] = this.player;
        this.checkWinner(playedMove, this.player);
        this.dispatcher.dispatchEvent(new CustomEvent("newMove", {
            detail: {
                column: playedMove[0], row: playedMove[1], player: this.player
            }
        }));
        this.moves.push(new Move(playedMove[0], playedMove[1], this.player))
        this.player = this.player === 1 ? 2 : 1;
    }

    checkWinner(move, player) {
        let end;
        end = this.checkHorizontal(move[0], move[1], player)
        if (!end) end = this.checkVertical(move[0], move[1], player)
        if (!end) end = this.checkDiagonal(move[0], move[1], player)
        if (!end) end = this.checkAntiDiagonal(move[0], move[1], player)

        if (end) {
            this.gameOver = true;
            this.winner = player;
            this.dispatcher.dispatchEvent(new CustomEvent("gameOver", {detail: this.winner}));
        }
        if (this.checkFull()) {
            this.gameOver = true;
            this.dispatcher.dispatchEvent(new Event("gameOver"));
        }
    }

    checkHorizontal(col, row, player) {
        let n = 1;
        let left = parseInt(col) - 1;
        let right = parseInt(col) + 1;
        while (left >= 0) {
            if (this.board[left][row] === player) {
                n++;
                left--;
                if (this.checkConnect(n)) return true;
            } else break;
        }
        while (right < this.columns) {
            if (this.board[right][row] === player) {
                n++;
                right++;
                if (this.checkConnect(n)) return true;
            } else break;
        }
        return this.checkConnect(n);
    }

    checkVertical(col, row, player) {
        let n = 1;
        let down = parseInt(row) - 1;
        while (down >= 0) {
            if (this.board[col][down] === player) {
                n++;
                down--;
                if (this.checkConnect(n)) return true;
            } else break;
        }
        return this.checkConnect(n);
    }

    checkDiagonal(col, row, player) {
        let n = 1;
        // left is diagonal down left
        let leftCol = parseInt(col) - 1;
        let leftRow = parseInt(row) + 1;
        // right is diagonal up right
        let rightCol = parseInt(col) + 1;
        let rightRow = parseInt(row) - 1;

        // while down left diagonal is in bounds
        while (leftCol >= 0 && leftRow < this.rows) {
            if (player === this.board[leftCol][leftRow]) {
                // count the current token and keep checking the diagonal
                leftCol--;
                leftRow++;
                n++;
                if (this.checkConnect(n)) {
                    return true;
                }
            } else break;
        }
        // while up right diagonal is in bounds
        while (rightCol < this.columns && rightRow >= 0) {
            if (player === this.board[rightCol][rightRow]) {
                // count the current token and keep checking the diagonal
                rightCol++;
                rightRow--;
                n++;
                if (this.checkConnect(n)) {
                    return true;
                }
            } else break;
        }
        return false;
    }

    checkAntiDiagonal(col, row, player) {
        let n = 1;
        // left is diagonal up left
        let leftCol = parseInt(col) - 1;
        let leftRow = parseInt(row) - 1;
        // right is diagonal down right
        let rightCol = parseInt(col) + 1;
        let rightRow = parseInt(row) + 1;

        // while up left diagonal is in bounds
        while (leftCol >= 0 && leftRow >= 0) {
            if (player === this.board[leftCol][leftRow]) {
                // count the current token and keep checking the diagonal
                leftCol--;
                leftRow--;
                n++;
                if (this.checkConnect(n)) {
                    return true;
                }
            } else break;
        }
        // while down right diagonal is in bounds
        while (rightCol < this.columns && rightRow < this.rows) {
            if (player === this.board[rightCol][rightRow]) {
                // count the current token and keep checking the diagonal
                rightCol++;
                rightRow++;
                n++;
                if (this.checkConnect(n)) {
                    return true;
                }
            } else break;
        }
        return false;
    }

    checkConnect(n) {
        return n >= this.connect;
    }

    checkFull() {
        return this.board.filter(e => e.includes(0)).length === 0;
    }

    findLastMove(board) {
        let lastMove = [0, 0];
        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (board[i][j] !== this.board[i][j]) {
                    lastMove = [i, j];
                }
            }
        }
        return lastMove;
    }

    getHistory() {
        let history = []
        for (let key in this.moves) {
            history[history.length] = this.moves[key].getForHistory();
        }
        return JSON.stringify(history)
    }

    handleMoves(moves) {
        for (let key in moves) this.handleMove(Move.fromHistory(moves[key]))
    }

    handleMove(move) {
        this.board[move.move[0]][move.move[1]] = move.player;
        this.moves.push(move);
    }


}

export default Game;