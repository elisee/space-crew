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


ui.getInput("server-host").value = window.location.host;
ui.getButton("connect").addEventListener("click", onConnectClick);

function onConnectClick(event: MouseEvent) {
  event.preventDefault();

  const host = ui.getValue("server-host");
  socket = io.connect(host, { reconnection: false });

  log(`Connecting to ${host}...`);
  ui.getPane("server").hidden = true;

  socket.on("connect", onConnected);
  socket.on("disconnect", () => { document.write("Whoops, disconnected. Please reload the page."); });
}

function onConnected() {
  log("Connected!");
  ui.getPane("log-in").hidden = false;

  ui.getButton("create-crew").addEventListener("click", onCreateCrewClick);
  ui.getButton("return-to-crew").addEventListener("click", onReturnToCrewClick);
}

function onCreateCrewClick(event: MouseEvent) {
  event.preventDefault();

  const shipName = ui.getValue("ship-name");
  const captainName = ui.getValue("captain-name");

  const onCreateCrewAck: Game.CreateCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while creating crew: ${err}.`);
      ui.getPane("log-in").hidden = false;
      return;
    }

    log(`Crew created! ID is ${result.crew.id}, key is ${result.crewKey}.`);
    log(`Ship ID is ${result.ship.id}, key is ${result.shipKey}.`);
    log(`Save those for future use!`);

    game.crew = result.crew;
    game.ship = result.ship;
    crewDone();
  };

  socket.emit("createCrew", shipName, captainName, onCreateCrewAck);
  ui.getPane("log-in").hidden = true;
}

function onReturnToCrewClick(event: MouseEvent) {
  event.preventDefault();

  const crewId = ui.getValue("crew-id");
  const crewKey = ui.getValue("crew-key");

  const onReturnToCrewAck: Game.ReturnToCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while returning to crew: ${err}.`);
      ui.getPane("log-in").hidden = false;
      return;
    }

    game.crew = result.crew;
    game.ship = result.ship;
    game.planet = result.planet;

    crewDone();
  };

  socket.emit("returnToCrew", crewId, crewKey, onReturnToCrewAck);
  ui.getPane("log-in").hidden = true;
}

function crewDone() {
  ui.getPane("crew").hidden = false;
  ui.crew.refresh();

  socket.on("shipCourseTargetReached", onShipCourseTargetReached);
  socket.on("setShipPosition", onSetShipPosition);
  socket.on("shout", onShout);

  if (game.ship != null) {
    ui.getPane("ship").hidden = false;
    ui.ship.refresh();
  }
}

function onShout(author: { crewId: string; captainName: string }, text: string) {
  log(`${author.captainName} (Crew ID: ${author.crewId}) shouts: ${text}`);
}

function onShipCourseTargetReached() {
  log("Ship course target reached!");

  game.ship.course = null;
  ui.ship.refreshStatus();
}

function onSetShipPosition(pos: XYZ) {
  game.ship.position = pos;
  ui.ship.refreshStatus();
}
