function computeMove(gameState) {
    while (true) {
        // Get a random column (integer between 0 and 6)
        let i = Math.floor(Math.random() * gameState.col);
        for (let j = 0; j <= gameState.row; j++) {
            if (gameState.grid[i][j] === 0) {
                return [i, j];
            }
        }
    }
}

exports.computeMove = computeMove;