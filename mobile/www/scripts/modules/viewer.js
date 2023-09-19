import generator from "./utils/generator.js";
import Move from "./move.js";

const boardQuery = "main board"
const playersQuery = "main players"
const playingQuery = "aside playing"
export default class Viewer {

    dispatcher = new EventTarget();

    constructor(players, currentPlayer, columns = 7, rows = 6) {
        this.boardDom = document.querySelector(boardQuery);
        this.playersDom = document.querySelector(playersQuery);
        this.playingDom = document.querySelector(playingQuery);
        this.boardDom.innerHTML = "";
        this.playersDom.innerHTML = "";
        this.playingDom.innerHTML = "";
        this.columns = columns
        this.rows = rows
        this.disabled = false;
        this.players = players
        this.currentPlayer = currentPlayer;
    }

    static randomGrid(boardElement, playersElement, playingElement) {
        let randomViewer = new Viewer([{
            name: "Joueur 1", profile: "color", color: "#ED2E2E", darkerColor: "#B71C1C", elo: 1500,
        }, {
            name: "Joueur 2", profile: "color", color: "#FFC700", darkerColor: "#C79D00", elo: 1500, add: true
        }], 1);
        randomViewer.init(boardElement, playersElement, playingElement).then(() => {
            let moves = [];
            for (let column = 0; column < 7; column++) {
                for (let row = 0; row < Math.floor(Math.random() * 6) + 1; row++) {
                    moves.push(new Move(column, row, Math.floor(Math.random() * 2) + 1));
                }
            }
            randomViewer.fill(moves);
        })
        randomViewer.disable()
    }

    init() {
        return new Promise((resolve) => {
            this.wrapperDom = generator.createTag("wrapper");
            // create indicators
            this.indicatorsDom = generator.createTag("indicators");
            for (let column = 0; column < 7; column++) this.indicatorsDom.append(generator.createTag("token", {column: column}));
            // create grid
            this.gridDom = generator.createTag("grid");
            for (let column = 0; column < 7; column++) {
                let columnElement = generator.createTag("column", {column: column});
                columnElement.append(generator.createTag("separator"));
                for (let row = 5; row >= 0; row--) {
                    let cellElement = generator.createTag("cell", {row: row});
                    columnElement.append(cellElement, generator.createTag("separator"));
                }
                this.gridDom.appendChild(columnElement);
                // add event listener on column mouseover
                columnElement.addEventListener("mouseover", () => this.columnHover(column))
                // add event listener on column click
                columnElement.addEventListener("click", () => this.columnClick(column))
            }
            // add indicators and grid to board
            this.wrapperDom.append(this.indicatorsDom, this.gridDom);
            this.boardDom.append(this.wrapperDom);
            // setup players ui
            this.playersDom.append(this.generatePlayer(this.players[0]), this.generatePlayer(this.players[1]));
            // setup playing ui
            this.updatePlaying();
            // resize from width and height
            window.addEventListener("resize", () => {
                let timeout = setTimeout(() => {
                    this.resize();
                    clearTimeout(timeout);
                }, 250)
            });
            this.resize();
            resolve();
        })
    }

    fill(moves) {
        moves.forEach((move) => {
            let cellElement = this.gridDom.querySelector(`column[column="${move.move[0]}"] cell[row="${move.move[1]}"]`);
            let token = generator.createTag("token", {"player": move.player});
            token.style.backgroundColor = this.players[move.player - 1].color;
            token.style.boxShadow = `inset 0 0 0 0.375em ${this.players[move.player - 1].darkerColor}`;
            cellElement.append(token);
        })
        let lastToken = this.gridDom.querySelector(`column[column="${moves[moves.length - 1].move[0]}"] cell[row="${moves[moves.length - 1].move[1]}"] token`);
        lastToken.classList.add("last");
    }

    columnHover(column) {
        let columnElement = document.querySelector(`column[column="${column}"]`);
        columnElement.classList.add("focus");
        // get corresponding indicator
        let indicator = this.indicatorsDom.querySelector(`token[column="${column}"]`);
        indicator.style.backgroundColor = this.players[this.currentPlayer - 1].color;
        indicator.style.boxShadow = `inset 0 0 0 0.375em ${this.players[this.currentPlayer - 1].darkerColor}`;
        indicator.classList.add("focus");

        //remove focus on other columns
        let columns = document.querySelectorAll("column");
        columns.forEach((column) => {
            if (column !== columnElement) {
                column.classList.remove("focus");
                this.indicatorsDom.querySelector(`token[column="${column.getAttribute("column")}"]`).classList.remove("focus");
            }
        })
    }

    columnClick(column) {
        // last empty row
        let row = -1;
        for (let i = 0; i < 6; i++) {
            if (document.querySelector(`column[column="${column}"] cell[row="${i}"]`).childElementCount === 0) {
                row = i;
                break;
            }
        }
        // if row is -1, column is full
        if (row === -1) {
            console.warn("Column " + column + " is full")
            return;
        }
        if (!this.disabled) {
            //console.log("Column " + column + " clicked, row " + row + " selected")
            this.dispatcher.dispatchEvent(new CustomEvent("move", {
                detail: {
                    column: column, row: row, player: this.currentPlayer
                }
            }));
        }
    }

    addToken(column, row, player) {
        const generateToken = player => {
            let token = generator.createTag("token", {"player": player}, ["last"]);
            token.style.backgroundColor = this.players[player - 1].color;
            token.style.boxShadow = `inset 0 0 0 0.375em ${this.players[player - 1].darkerColor}`;
            return token;
        };

        return new Promise((resolve) => {
            let cellElement = document.querySelector(`column[column="${column}"] cell[row="${row}"]`)
            if (!window.cordova) {
                this.animate(column, row, player).then(r => {
                    let token = generateToken(player)
                    cellElement.appendChild(token);
                    this.updatePlaying()
                }).finally(() => {
                    // remove all last class from other tokens
                    let tokens = document.querySelectorAll("token");
                    tokens.forEach((token) => {
                        if (token !== cellElement.lastChild) token.classList.remove("last");
                    })
                    resolve();
                })
            } else {
                let token = generateToken(player)
                cellElement.appendChild(token);
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.updatePlaying()
                let tokens = document.querySelectorAll("token");
                tokens.forEach((token) => {
                    if (token !== cellElement.lastChild) token.classList.remove("last");
                })
                resolve();
            }
        })
    }

    async animate(column, row, player) {
        return new Promise((resolve) => {
            let animatedToken = generator.createTag("animated-token");
            animatedToken.style.backgroundColor = this.players[player - 1].color;
            animatedToken.style.boxShadow = `inset 0 0 0 0.375em ${this.players[player - 1].darkerColor}`;

            // get board font size and convert it to int (to convert px to em)
            let fontSize = window.getComputedStyle(this.wrapperDom).fontSize;
            fontSize = parseInt(fontSize.substring(0, fontSize.length - 2));

            let indicator = this.indicatorsDom.querySelector(`token[column="${column}"]`);
            let wantedCell = document.querySelector(`column[column="${column}"] cell[row="${row}"]`);
            // set position of animated token
            animatedToken.style.top = `${indicator.offsetTop / fontSize}em`;
            animatedToken.style.left = `${indicator.offsetLeft / fontSize}em`;
            // hide indicator
            indicator.style.visibility = "hidden";
            // add animated token to grid
            this.gridDom.append(animatedToken);
            const animateMS = ms => {
                // using of setTimeout to create animation effect
                setTimeout(() => {
                    // move animated token to cell
                    animatedToken.style.top = `${(animatedToken.offsetTop / fontSize) + 0.5}em`;
                    // if animated token is in cell, remove it and show indicator
                    if (animatedToken.offsetTop > (wantedCell.offsetTop + this.gridDom.offsetTop)) {
                        console.log("la condition est remplie")
                        this.gridDom.removeChild(animatedToken);
                        indicator.style.visibility = "visible";
                        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                        resolve();
                    } else animateMS(Math.max(ms - 2, 4));
                }, ms)
            };
            console.log("on appelle animateMS")
            animateMS(14)
        })
    }

    disable() {
        this.disabled = true;
        this.boardDom.classList.add("disabled");
        // remove all focus
        let col = document.querySelector("column.focus");
        if (col) col.classList.remove("focus");
        let token = this.indicatorsDom.querySelector("token.focus");
        if (token) token.classList.remove("focus");
    }

    enable() {
        this.disabled = false;
        this.boardDom.classList.remove("disabled");
    }

    generatePlayer(data) {
        let player = generator.createTag("player");
        let content = generator.createTag("content");
        let profileElement = generator.createTag("profile");
        if (data['profile'] === "color") profileElement.style.backgroundColor = data['color']; else profileElement.style.backgroundImage = `url(${data['profile']})`;
        let nameElement = generator.createTag("name");
        nameElement.innerText = data['name'];
        let scoreElement = generator.createTag("elo");
        if (data['elo']) scoreElement.innerText = data['elo'];
        content.append(profileElement, nameElement, scoreElement, generator.createTag("filler"));
        let hr = generator.createTag("hr");
        hr.style.backgroundColor = data['color'];
        player.append(content, hr);
        return player;
    }

    updatePlaying() {
        this.playingDom.innerHTML = "";
        let text = generator.createTag("text");
        let color = generator.createTag("color");
        color.style.backgroundColor = this.players[this.currentPlayer - 1]["color"];
        text.innerText = "Au tour de:"
        let player = generator.createTag("player");
        player.innerText = this.players[this.currentPlayer - 1]["name"];
        text.append(player);
        this.playingDom.append(text, color);
    }

    resize(e) {
        console.log("on resize")
        // scale the wrapper to fit the board
        let wrapper = this.wrapperDom
        let board = this.boardDom
        // if defaultWidth is not set, set it
        if (!this.defaultWidth) this.defaultWidth = wrapper.offsetWidth;
        if (!this.defaultHeight) this.defaultHeight = wrapper.offsetHeight

        console.log("defaultWidth", this.defaultWidth)
        console.log("defaultHeight", this.defaultHeight)

        // check width ratio
        let widthRatio = (board.offsetWidth / this.defaultWidth) * 0.9;
        // check height ratio
        let heightRatio = (board.offsetHeight / this.defaultHeight) * 0.75;
        console.log("widthRatio", widthRatio)
        console.log("heightRatio", heightRatio)
        // calculate scale
        let scale = Math.min(widthRatio, heightRatio);
        // round to the fontsize th to avoid bad positioning of elements with animation
        scale = Math.round(scale * 16) / 16;
        // scale it
        wrapper.style.fontSize = `${scale}em`;
    }
}

