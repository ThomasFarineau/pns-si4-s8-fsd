const fs = require('fs');
const url = require('url');
const path = require('path');

const defaultFileIfFolder = "index.html";
const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.md': 'text/plain',
    'default': 'application/octet-stream'
};

class FrontHandler {

    constructor(frontDir) {
        this.frontDir = frontDir;
    }

    execute(req, res) {
        const parsedUrl = url.parse(this.frontDir + req.url)
        let pathName = `.${parsedUrl.pathname}`;
        let extension = path.parse(pathName).ext
        if (extension === "" && pathName.charAt(pathName.length - 1) !== "/") {
            pathName += ".html"
            extension = path.parse(pathName).ext;
        }
        fs.access(pathName, fs.constants.F_OK, (err) => {
            if (err) {
                this._404(pathName, res);
                return;
            }
            if (fs.statSync(pathName).isDirectory()) {
                pathName += defaultFileIfFolder;
                extension = path.parse(pathName).ext;
            }
            fs.readFile(pathName, (err, data) => {
                if (err) {
                    this._404(pathName, res);
                    return;
                }
                res.setHeader('Content-type', mimeTypes[extension] || mimeTypes['default']);
                res.end(data);
            })
        })
    }

    _404(path, res) {
        res.statusCode = 404;
        res.end('404 - File ' + path + ' not found');
    }
}

module.exports = FrontHandler;