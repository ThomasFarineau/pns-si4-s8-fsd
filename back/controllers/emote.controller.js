const fs = require("fs");
const emoteFile = "back/data/emotes.json"

class EmoteController {

    async getImages(req, res) {
        fs.readFile(emoteFile, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let json = JSON.parse(data)
            res.end(JSON.stringify(json['images']))
        })
    }
    async getSentences(req, res) {
        fs.readFile(emoteFile, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let json = JSON.parse(data)
            res.end(JSON.stringify(json['sentences']))
        })
    }
}

module.exports = new EmoteController()