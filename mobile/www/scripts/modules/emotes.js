import generator from "./utils/generator.js";
import ezrequest from "./utils/ezrequest.js";

class Emotes {
    dispatcher = new EventTarget();

    constructor() {
        if (document.querySelector("aside emotes") !== null) document.querySelectorAll("aside emotes").forEach((e) => e.remove())
        this.board = document.querySelector("main board");
        let aside = document.querySelector("aside");
        this.emotes = generator.createTag("emotes");
        let emoteIcon = generator.createTag("icon");
        emoteIcon.innerText = "mic"
        this.emotes.appendChild(emoteIcon);
        let emoteText = generator.createTag("text");
        emoteText.innerText = "envoyer un message";
        this.emotes.appendChild(emoteText);
        aside.appendChild(this.emotes);

        this.emotesMenu = null;
        this.canSendEmote = true;
        this.emotes.addEventListener("click", () => {
            if (this.emotesMenu === null) this.openEmotesMenu(); else this.closeEmotesMenu();
        })
        this.handleEmote()

        this.sentences = ezrequest.get("/api/emotes/sentences").then((data) => this.sentences = JSON.parse(data.response)).finally(() => {
            this.images = ezrequest.get("/api/emotes/images").then((data) => this.images = JSON.parse(data.response))
        })
    }

    remove() {
        this.emotes.remove()
    }


    sendEmote(v) {
        this.canSendEmote = v;
        if (v) this.emotes.classList.remove("disabled"); else this.emotes.classList.add("disabled");
    }


    handleEmote() {
        this.dispatcher.addEventListener("emote", (e) => {
            if (this.canSendEmote) {
                this.sendEmote(false)
                setTimeout(() => {
                    this.sendEmote(true)
                }, 5000);
            }
        })
    }


    printEmote(playerId, image, s) {
        let emote = generator.createTag("emote", {player: playerId});
        if (s !== null) {
            let sentence = generator.createTag("sentence");
            sentence.innerText = s;
            emote.appendChild(sentence);
        } else if (image !== null) {
            let img = generator.createTag("img", {src: image});
            emote.appendChild(img);
        }
        this.board.appendChild(emote);
        setTimeout(() => emote.classList.add("fade-in"), 100);
        setTimeout(() => {
            emote.classList.add("fade-out");
            setTimeout(() => emote.remove(), 250);
        }, 5000);
    }

    openEmotesMenu() {
        this.emotesMenu = generator.createTag("emotes-menu");
        // placer juste au-dessus de l'emote

        // mélanger this.sentences et this.images
        this.sentences = this.sentences.sort(() => Math.random() - 0.5);
        this.images = this.images.sort(() => Math.random() - 0.5);

        let sentences = generator.createTag("sentences");
        for (let sentence of this.sentences) {
            let emote = generator.createTag("sentence");
            emote.innerHTML = sentence;
            emote.addEventListener("click", () => {
                this.dispatcher.dispatchEvent(new CustomEvent("emote", {detail: {sentence: sentence}}));
                this.closeEmotesMenu();
            })
            sentences.appendChild(emote);
        }

        let images = generator.createTag("images");
        for (let image of this.images) {
            let emote = generator.createTag("image");
            emote.append(generator.createTag("img", {src: image}))
            emote.addEventListener("click", () => {
                this.dispatcher.dispatchEvent(new CustomEvent("emote", {detail: {image: image}}));
                this.closeEmotesMenu();
            })
            images.appendChild(emote);
        }
        this.emotesMenu.appendChild(images);
        this.emotesMenu.append(sentences, images);
        this.emotesMenu.addEventListener("mouseleave", () => this.closeEmotesMenu())
        this.emotes.parentNode.appendChild(this.emotesMenu);
        this.emotesMenu.style.bottom = this.emotes.clientHeight + 24 + "px";
        this.emotesMenu.style.right = this.emotes.offsetLeft + "px";
    }

    closeEmotesMenu() {
        let board = document.querySelector("main board");
        board.classList.add("disabled");
        setTimeout(() => board.classList.remove("disabled"), 750);
        this.emotesMenu.remove();
        this.emotesMenu = null;
    }
}

export default Emotes;