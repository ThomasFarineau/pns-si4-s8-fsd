const http = require("http");
const {Server} = require("socket.io");
require('dotenv').config()

const Routes = require("./utils/Routes");
const FrontHandler = require("./utils/FrontHandler");
const SocketHandler = require("./socket.handler");

const frontDir = "/mobile/www";
const frontHandler = new FrontHandler(frontDir);

async function main() {
    require("./routes/api.routes");
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            setCORS(req, res);
            if (!Routes.isRoute(req.url, req.method)) frontHandler.execute(req, res); else Routes.execute(req, res);
        });
        server.listen(process.env.PORT, process.env.HOST, () => resolve(server));
    });
}

setCORS = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
    }
}

main().then((s) => {
    const io = new Server(s, {
        cors: {origin: "*"}
    })
    io.of('/api/game').on('connection', (socket) => new SocketHandler(socket, io))
})