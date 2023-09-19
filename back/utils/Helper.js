const encrypter = require("./Encrypter")
const {ObjectId} = require("mongodb");
const fs = require("fs");

class Helper {
    frontDir = "mobile/www";

    checkBearer(req) {
        return new Promise((resolve, reject) => {
            if (req.headers.authorization === undefined) return reject("No authorization header");
            let bearer = req.headers.authorization.split(' ');
            if (bearer[0] !== "Bearer") return reject("No bearer token");
            return resolve(bearer[1]);
        })
    }

    gif(type) {
        return new Promise((resolve, reject) => fs.readdir(this.frontDir + "/assets/medias/images/" + type + "/", (err, files) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve(this.frontDir + "/assets/medias/images/" + type + "/" + files[Math.floor(Math.random() * files.length)]);
        }))
    }

    checkSession(session) {
        return new Promise((resolve, reject) => {
            encrypter.unjwt(session).then((decoded) => {
                require("../controllers/database.controller").collection("users").findOne({
                    session: decoded
                }).then((user) => {
                    if (user === null) return reject("Invalid session");
                    return resolve(user);
                }).catch((err) => reject(err))
            }).catch((err) => reject(err))
        })
    }

    toObjectId(id) {
        return (new ObjectId(id))
    }

}

module.exports = new Helper();