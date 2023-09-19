class Game {
    col
    row
    connect
    grid
    player
    ended
    winner
    score
    duel

    constructor(AIplays, isDuel = false) {
        this.duel = isDuel
        this.col = 7
        this.row = 6
        this.connect = 4
        this.ended = false
        this.winner = null
        this.player = AIplays === 1 ? 2 : 1
        this.grid = this.emptyGrid()
        this.score = 0
        this.moves = null
    }

    static parseGrid(toParse) {
        let grid = []
        let parsedGrid = toParse.split(",").map((e) => parseInt(e))
        for (let i = 0; i < parsedGrid.length; i++) {
            if (i % 6 === 0) grid.push(parsedGrid.slice(i, i + 6))
        }
        return grid;
    }

    emptyGrid() {
        let gr = new Array(this.col)
        for (let i = 0; i < this.col; i++) {
            gr[i] = new Array(this.row)
            for (let j = 0; j < this.row; j++) {
                gr[i][j] = 0;
            }
        }
        return gr
    }

    play(move) {
        //Compte le nombre de cases disponibles dans la colonne
        let n = 0;
        for (let i = 0; i < this.row; i++) if (this.grid[move[0]][i] === 0) n++;
        if (n > 0) {
            this.grid[move[0]][this.row - n] = this.player;
            this.checkEnd(move[0], this.row - n, this.player)
            this.player = this.player === 1 ? 2 : 1
            return true;
        }
        return false;
    }

    checkEnd(col, row, player) {
        let end;
        end = this.checkHorizontal(col, row, player)
        if (!end) end = this.checkVertical(col, row, player)
        if (!end) end = this.checkDiagonal(col, row, player)
        if (!end) end = this.checkAntiDiagonal(col, row, player)

        if (end) {
            this.ended = true;
            this.winner = player;
        }
        if (this.checkFull()) {
            this.ended = true;
        }
    }

    checkHorizontal(col, row, player) {
        let n = 1;
        let left = parseInt(col) - 1;
        let right = parseInt(col) + 1;
        while (left >= 0) {
            if (this.grid[left][row] === player) {
                n++;
                left--;
                if (this.checkConnect(n)) return true;
            } else break;
        }
        while (right < this.col) {
            if (this.grid[right][row] === player) {
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
            if (this.grid[col][down] === player) {
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
        while (leftCol >= 0 && leftRow < this.row) {
            if (player === this.grid[leftCol][leftRow]) {
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
        while (rightCol < this.col && rightRow >= 0) {
            if (player === this.grid[rightCol][rightRow]) {
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
            if (player === this.grid[leftCol][leftRow]) {
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
        while (rightCol < this.col && rightRow < this.row) {
            if (player === this.grid[rightCol][rightRow]) {
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
        return this.grid.filter(e => e.includes(0)).length === 0;
    }

    handleMoves(moves) {
        for (let key in moves) {
            let move = moves[key];
            this.grid[move[1]][move[2]] = move[3];
            this.checkEnd(move[1], move[2], move[3])
        }
    }

}

exports.Game = Game