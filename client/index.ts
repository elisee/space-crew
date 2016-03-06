/// <reference path="../typings/browser.d.ts" />
/// <reference path="../game.d.ts" />

import * as io from "socket.io-client";
import * as ui from "./ui";

const game: {
  crew: Game.Crew;
  ship: Game.Ship;

  planet: Game.Planet;
  place: Game.Place;
  nearbyCrewsById: { [crewId: string]: Game.CrewInfo; };
} = {
  crew: null,
  ship: null,

  planet: null,
  place: null,
  nearbyCrewsById: {}
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

  socket.on("addCrew", onAddCrew);
  socket.on("removeCrew", onRemoveCrew);
}

function onConnected() {
  log("Connected!");
  ui.login.show();
  ui.login.setup();
}

function onDisconnected() {
  document.body.innerHTML = "Whoops, disconnected. Please reload the page.";
  clearInterval(tickIntervalId);
  tickIntervalId = null;
}

function onAddCrew(crewInfo: Game.CrewInfo) {
  game.place.crews.push(crewInfo);
  game.nearbyCrewsById[crewInfo.id] = crewInfo;
  ui.sidebar.refreshCrewsList();
}

function onRemoveCrew(crewId: string) {
  const crewInfo = game.nearbyCrewsById[crewId];
  game.place.crews.splice(game.place.crews.indexOf(crewInfo), 1);
  delete game.nearbyCrewsById[crewInfo.id];
  ui.sidebar.refreshCrewsList();
}

export function setupPlace() {
  game.nearbyCrewsById = {};

  if (game.place != null) {
    for (const crewInfo of game.place.crews) {
      game.nearbyCrewsById[crewInfo.id] = crewInfo;
    }
  }

  ui.sidebar.refreshCrewsList();
}

export function loginDone() {
  setupPlace();

  ui.crew.show();
  ui.crew.refresh();

  ui.crew.setup();
  ui.ship.setup();

  ui.planet.setup();
  ui.spaceport.setup();

  ui.sidebar.setup();

  tickIntervalId = setInterval(tick, 1000);
}

function tick() {
  ui.ship.tick();
}
