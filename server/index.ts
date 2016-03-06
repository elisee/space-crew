/// <reference path="../typings/main.d.ts" />
/// <reference path="../game.d.ts" />

import * as http from "http";
import * as express from "express";
import * as SocketIO from "socket.io";

import * as cluster from "./cluster";
import * as ships from "./ships";
import * as planets from "./planets";
import Client from "./Client";

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);
export { io };
export let time = 0;

app.use(express.static("public"));
server.listen(port);

if (!cluster.load()) cluster.generate();

process.on("SIGINT", onExit);

let tickInterval = setInterval(() => {
  ships.tick();
  time++;
}, 1000);

io.on("connect", (socket) => { new Client(socket); });

console.log(`Server started on port ${port}.`);

function onExit() {
  if (tickInterval == null) return;

  clearInterval(tickInterval);
  tickInterval = null;

  console.log("Saving...");
  cluster.save();
  process.exit(0);
}
