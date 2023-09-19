const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const grid = []
let player = 1;

function setup(AIplays) {
    for (let c = 0; c < COLS; c++) {
        grid[c] = [];
        for (let r = 0; r < ROWS; r++) {
            grid[c][r] = EMPTY;
        }
    }
}

function nextMove(lastMove) {
    if (lastMove.length !== 0) {
        grid[lastMove[0]][lastMove[1]] = 2;
    }
    let bestCol = 0;
    let bestScore = -Infinity;
    for (let c = 0; c < COLS; c++) {
        let score = evaluateScore(c);
        if (score > bestScore) {
            bestScore = score;
            bestCol = c;
        }
    }
    let row = grid[bestCol].indexOf(EMPTY)
    grid[bestCol][row] = 1;
    return [bestCol, row];
}

function evaluateScore(col) {
    let score = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[col][r] === EMPTY) {
            let hr = 1;
            let vr = 1;
            let dtb = 1;
            let dbt = 1;

            for (let i = 0; i < 4; i++) {
                if (col + i < COLS && grid[col + i][r] === player) {
                    hr++;
                } else {
                    break;
                }
            }
            for (let i = 1; i < 4; i++) {
                if (r + i < ROWS && grid[col][r + i] === player) {
                    vr++;
                } else {
                    break;
                }
            }
            for (let i = 1; i < 4; i++) {
                if (col + i < COLS && r + i < ROWS && grid[col + i][r + i] === player) {
                    dtb++;
                } else {
                    break;
                }
            }
            for (let i = 1; i < 4; i++) {
                if (col - i >= 0 && r + i < ROWS && grid[col - i][r + i] === player) {
                    dbt++;
                } else {
                    break;
                }
            }
            if (hr >= 4 || vr >= 4 || dtb >= 4 || dbt >= 4) {
                score += 1000;
            } else {
                score += hr + vr + dtb + dbt;
            }

        }
    }
    return score;
}


exports.setup = setup;
exports.nextMove = nextMove;