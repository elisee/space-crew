/// <reference path="../typings/browser.d.ts" />
/// <reference path="../game.d.ts" />

import * as io from "socket.io-client";
import * as ui from "./ui";

const game: {
  crew: Game.Crew;
  ship: Game.Ship;
  planet: Game.Planet;
} = {
  crew: null,
  ship: null,
  planet: null
};
export default game;

export let socket: SocketIOClient.Socket;

const logElt = document.querySelector(".log textarea") as HTMLTextAreaElement;

export function log(message: string) {
  logElt.value += message + "\n";
  logElt.scrollTop = 9e9;
}

let tickIntervalId: NodeJS.Timer;

ui.getInput("server-host").value = (localStorage["gameServerHost"] != null) ? localStorage["gameServerHost"] : window.location.host;
ui.getButton("connect").addEventListener("click", onConnectClick);

function onConnectClick(event: MouseEvent) {
  event.preventDefault();

  const host = localStorage["gameServerHost"] = ui.getValue("server-host");
  socket = io.connect(host, { reconnection: false });

  log(`Connecting to ${host}...`);
  ui.getPane("server").hidden = true;

  socket.on("connect", onConnected);
  socket.on("disconnect", onDisconnected);
}

function onConnected() {
  log("Connected!");
  ui.getPane("log-in").hidden = false;

  ui.login.setup();
}

function onDisconnected() {
  document.body.innerHTML = "Whoops, disconnected. Please reload the page.";
  clearInterval(tickIntervalId);
  tickIntervalId = null;
}

export function loginDone() {
  ui.getPane("crew").hidden = false;
  ui.crew.refresh();

  ui.crew.setup();
  ui.ship.setup();
  ui.planet.setup();

  tickIntervalId = setInterval(tick, 1000);
}

function tick() {
  ui.ship.tick();
}
