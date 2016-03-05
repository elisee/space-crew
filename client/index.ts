/// <reference path="../typings/browser.d.ts" />
/// <reference path="../game.d.ts" />

import * as io from "socket.io-client";

const logElt = document.querySelector(".log textarea") as HTMLTextAreaElement;

let socket: SocketIOClient.Socket;

function getPane(name: string) { return document.querySelector(`body > main > .${name}`) as HTMLDivElement; }
function getButton(name: string) { return document.querySelector(`button.${name}`) as HTMLButtonElement; }
function getInput(name: string) { return (document.querySelector(`input.${name}`) as HTMLInputElement); }
function getValue(name: string) { return (document.querySelector(`input.${name}`) as HTMLInputElement).value; }

getInput("server-host").value = window.location.host;
getButton("connect").addEventListener("click", onConnectClick);

let ourCrew: Game.Crew;
let ourShip: Game.Ship;

function log(message: string) {
  logElt.value += message + "\n";
  logElt.scrollTop = 9e9;
}

function onConnectClick(event: MouseEvent) {
  event.preventDefault();

  const host = getValue("server-host");
  socket = io.connect(host, { reconnection: false });

  log(`Connecting to ${host}...`);
  getPane("server").hidden = true;

  socket.on("connect", onConnected);
  socket.on("disconnect", () => { document.write("Whoops, disconnected. Please reload the page.") });
}

function onConnected() {
  log("Connected!");
  getPane("crew").hidden = false;

  getButton("create-crew").addEventListener("click", onCreateCrewClick);
  getButton("return-to-crew").addEventListener("click", onReturnToCrewClick);
}

function onCreateCrewClick(event: MouseEvent) {
  event.preventDefault();

  const shipName = getValue("ship-name");
  const captainName = getValue("captain-name");

  const onCreateCrewAck: Game.CreateCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while creating crew: ${err}.`);
      getPane("crew").hidden = false;
      return;
    }

    log(`Crew created! ID is ${result.crew.id}, key is ${result.crewKey}.`);
    log(`Ship ID is ${result.ship.id}, key is ${result.shipKey}.`);
    log(`Save those for future use!`);

    ourCrew = result.crew;
    ourShip = result.ship;
    crewDone();
  };

  socket.emit("createCrew", shipName, captainName, onCreateCrewAck);
  getPane("crew").hidden = true;
}

function onReturnToCrewClick(event: MouseEvent) {
  event.preventDefault();

  const crewId = getValue("crew-id");
  const crewKey = getValue("crew-key");

  const onReturnToCrewAck: Game.ReturnToCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while returning to crew: ${err}.`);
      getPane("crew").hidden = false;
      return;
    }

    if (result.ship != null) log(`Current ship ID is ${result.ship.id}.`);

    crewDone();
  };

  socket.emit("returnToCrew", crewId, crewKey, onReturnToCrewAck);
  getPane("crew").hidden = true;
}

function crewDone() {
  socket.on("shipCourseTargetReached", onShipCourseTargetReached);
  socket.on("setShipPosition", onSetShipPosition);
  socket.on("shout", onShout);

  getPane("ship").hidden = false;

  if (ourShip != null) {
    log(`Ship position is (${ourShip.position.x},${ourShip.position.y},${ourShip.position.z}).`);
  }

  getButton("scan-planets").addEventListener("click", onScanPlanetsClick);
  getButton("set-ship-course").addEventListener("click", onSetShipCourseClick);
  getButton("land-ship").addEventListener("click", onLandShipClick);
  getButton("take-off-ship").addEventListener("click", onTakeOffShipClick);
  getButton("leave-ship").addEventListener("click", onLeaveShipClick);
  getButton("enter-ship").addEventListener("click", onEnterShipClick);
  getButton("shout").addEventListener("click", onShoutClick);
}

function onShipCourseTargetReached() {
  log("Ship course target reached!");
}

function onSetShipPosition(pos: XYZ) {
  ourShip.position = pos;
  log(`Ship position is now at (${pos.x},${pos.y},${pos.z})`);
}

function onShout(author: { crewId: string; captainName: string }, text: string) {
  log(`${author.captainName} (Crew ID: ${author.crewId}) shouts: ${text}`);
}

function onScanPlanetsClick(event: MouseEvent) {
  event.preventDefault();

  const onScanPlanetsAck: Game.ScanPlanetsCallback = (err, planets) => {
    if (err != null) {
      log(`Error while scanning planets: ${err}.`);
      return;
    }

    log(`Ship position is (${ourShip.position.x},${ourShip.position.y},${ourShip.position.z}).`);
    log("Nearby planets (radius 100):");
    for (const planet of planets) {
      log(`Planet ID ${planet.id} (name: ${planet.name}) at (${planet.position.x},${planet.position.y},${planet.position.z}).`);
    }
    if (planets.length === 0) log("None found!");
  };

  socket.emit("scanPlanets", onScanPlanetsAck);
}

function onSetShipCourseClick(event: MouseEvent) {
  event.preventDefault();

  const [ x, y, z ] = getValue("ship-course-target").split(",").map((v) => parseInt(v, 10));

  const onSetShipCourseAck: Game.SetShipCourseCallback = (err) => {
    if (err != null) {
      log(`Error while setting ship course: ${err}.`);
      return;
    }

    log("Course set!");
  };

  log(`Setting course for (${x},${y},${z})`);
  socket.emit("setShipCourse", { x, y, z }, onSetShipCourseAck);
}

function onLandShipClick(event: MouseEvent) {
  event.preventDefault();

  const onLandShipAck: Game.LandShipCallback = (err) => {
    if (err != null) {
      log(`Error while landing ship: ${err}.`);
      return;
    }

    log("Ship has landed!");
  };

  socket.emit("landShip", onLandShipAck);
}

function onTakeOffShipClick(event: MouseEvent) {
  event.preventDefault();

  const onTakeOffShipAck: Game.TakeOffShipCallback = (err) => {
    if (err != null) {
      log(`Error while taking off ship: ${err}.`);
      return;
    }

    log("Ship has taken off!");
  };

  socket.emit("takeOffShip", onTakeOffShipAck);
}

function onLeaveShipClick(event: MouseEvent) {
  event.preventDefault();

  const onLeaveShipAck: Game.LeaveShipCallback = (err) => {
    if (err != null) {
      log(`Error while leaving ship: ${err}.`);
      return;
    }

    log("Left the ship.");
  };

  socket.emit("leaveShip", onLeaveShipAck);
}

function onEnterShipClick(event: MouseEvent) {
  event.preventDefault();

  const onEnterShipAck: Game.LeaveShipCallback = (err) => {
    if (err != null) {
      log(`Error while entering ship: ${err}.`);
      return;
    }

    log("Entered the ship.");
  };

  const shipId = getValue("ship-id");
  const key = getValue("ship-key");

  socket.emit("enterShip", shipId, key, onEnterShipAck);
}

function onShoutClick(event: MouseEvent) {
  event.preventDefault();

  const onShoutAck: Game.ShoutCallback = (err) => {
    if (err != null) {
      log(`Error while taking off ship: ${err}.`);
      return;
    }
  };

  const message = getValue("shout-message");
  socket.emit("shout", message, onShoutAck);
}
