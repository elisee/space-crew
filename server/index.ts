/// <reference path="../typings/main.d.ts" />
/// <reference path="../game.d.ts" />

import * as http from "http";
import * as express from "express";
import * as SocketIO from "socket.io";

import * as ships from "./ships";
import Client from "./Client";

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);
export { io };

app.use(express.static("public"));
server.listen(port);

io.on("connect", (socket) => { new Client(socket); });

setInterval(() => {
  ships.tick();
}, 1000);

console.log(`Server started on port ${port}.`);
