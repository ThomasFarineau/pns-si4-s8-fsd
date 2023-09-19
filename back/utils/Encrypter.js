const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
global.crypto = require('crypto')

class Encrypter {

    static hash(value) {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) reject(err);
                bcrypt.hash(value, salt, (err, hash) => {
                    if (err) reject(err);
                    resolve(hash);
                });
            });
        });
    }

    static compare(value, hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(value, hash, function (err, result) {
                if (err) reject(err);
                if (result) return resolve();
                return reject();
            });
        })
    }

    static jwt(value) {
        return jwt.sign(value, process.env.JWT_SECRET);
    }

    static unjwt(value) {
        return new Promise((resolve, reject) => {
            jwt.verify(value, process.env.JWT_SECRET, (err, decoded) => {
                if (err) reject(err);
                resolve(decoded);
            })
        })
    }

    static uuid() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }

}

module.exports = Encrypter