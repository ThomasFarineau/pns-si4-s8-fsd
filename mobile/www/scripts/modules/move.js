export default class Move {
    constructor(column, row, player, date = new Date()) {
        this.move = [column, row];
        this.player = player;
        this.date = date;
    }

    getForHistory() {
        return [
            this.date.getTime(),
            this.move[0],
            this.move[1],
            this.player
        ]
    }

    static fromHistory(history) {
        return new Move(history[1], history[2], history[3], new Date(history[0]))
    }
}