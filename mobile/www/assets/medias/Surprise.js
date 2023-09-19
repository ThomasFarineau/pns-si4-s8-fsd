import Generator from "../../scripts/modules/utils/generator.js";
import Session from "../../scripts/modules/utils/session.js";
import EZRequest from "../../scripts/modules/utils/ezrequest.js";

export default class Surprise {
    keys;
    pressedKeys;

    constructor() {
        this.keys = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        this.pressedKeys = [];
    }

    handle() {
        window.addEventListener("keydown", (e) => {
            this.pressedKeys.push(e["keyCode"]);
            if (this.pressedKeys.length > this.keys.length) this.pressedKeys.shift();
            if (this.pressedKeys.toString() === this.keys.toString()) this.secret();
        });
    }

    static handle() {
        let surprise = new Surprise();
        surprise.handle();
    }

    secret() {
        let popup = Generator.createTag("surprise")
        let image = "./assets/medias/images/surprise.gif"
        let img = document.createElement("img");
        img.src = image;
        let audio = "./assets/medias/surprise.mp3";
        let sound = new Audio(audio);
        popup.append(img);
        sound.play().then(() => {
            document.body.append(popup);
            sound.addEventListener("ended", () => {
                popup.remove();
            })
        })
        if (Session.isLogged()) {
            let body = {
                "achievement": "SURPRISE MOTHER..."
            }
            EZRequest.post("/api/surprise", Session.session, body).then((res) => {
                console.log(res)
            }).catch(e => console.log(e))
        }
    }
}
