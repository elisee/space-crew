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
let ourPlanet: Game.Planet;

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
  socket.on("disconnect", () => { document.write("Whoops, disconnected. Please reload the page."); });
}

function onConnected() {
  log("Connected!");
  getPane("log-in").hidden = false;

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
      getPane("log-in").hidden = false;
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
  getPane("log-in").hidden = true;
}

function onReturnToCrewClick(event: MouseEvent) {
  event.preventDefault();

  const crewId = getValue("crew-id");
  const crewKey = getValue("crew-key");

  const onReturnToCrewAck: Game.ReturnToCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while returning to crew: ${err}.`);
      getPane("log-in").hidden = false;
      return;
    }

    ourCrew = result.crew;
    ourShip = result.ship;
    ourPlanet = result.planet;

    crewDone();
  };

  socket.emit("returnToCrew", crewId, crewKey, onReturnToCrewAck);
  getPane("log-in").hidden = true;
}

function crewDone() {
  getPane("crew").hidden = false;
  updateCrewInfo();

  socket.on("shipCourseTargetReached", onShipCourseTargetReached);
  socket.on("setShipPosition", onSetShipPosition);
  socket.on("shout", onShout);

  if (ourShip != null) {
    getPane("ship").hidden = false;
    updateShipStatus();
    updateShipActions();
  }

  getButton("shout").addEventListener("click", onShoutClick);

  getButton("land-ship").addEventListener("click", onLandShipClick);
  getButton("take-off-ship").addEventListener("click", onTakeOffShipClick);
  getButton("leave-ship").addEventListener("click", onLeaveShipClick);

  getButton("use-ship-scanner").addEventListener("click", onUseShipScannerClick);

  getButton("set-ship-course").addEventListener("click", onSetShipCourseClick);

  getButton("enter-ship").addEventListener("click", onEnterShipClick);
}

function getReadablePosition(pos: XYZ) {
  return `(${pos.x},${pos.y},${pos.z})`;
}

function updateCrewInfo() {
  let location = "";
  if (ourShip != null) location = `Onboard ship ${ourShip.name} (ID: ${ourShip.id}).`;
  else location = `On planet ${ourPlanet.name} (ID: ${ourPlanet.id}).`;

  (document.querySelector(".crew .location span") as HTMLSpanElement).textContent = location;

  const membersList = document.querySelector(".crew .members ul") as HTMLUListElement;
  membersList.innerHTML = "";

  for (const role in ourCrew.members) {
    const member = ourCrew.members[role];

    let desc = `${role}: (none)`;
    if (member != null) desc = `${role}: ${member.name}`;

    const li = document.createElement("li");
    li.textContent = desc;

    membersList.appendChild(li);
  }
}

function updateShipStatus() {
  let location = "In space";
  if (ourShip.planetId != null) location = `Landed on planet ${ourPlanet.name} (ID: ${ourPlanet.id}).`;

  const position = getReadablePosition(ourShip.position);

  let course = "None";
  if (ourShip.course != null) course = `Moving towards ${getReadablePosition(ourShip.course.target)}`;

  (document.querySelector(".ship .location span") as HTMLSpanElement).textContent = location;
  (document.querySelector(".ship .position span") as HTMLSpanElement).textContent = position;
  (document.querySelector(".ship .course span") as HTMLSpanElement).textContent = course;
}

function updateShipActions() {
  const hasLanded = ourShip.planetId != null;

  getButton("land-ship").disabled = hasLanded;
  getButton("take-off-ship").disabled = !hasLanded;
  getButton("leave-ship").disabled = !hasLanded;
}

function updatePlanetInfo() {
  // ...
}

function onShipCourseTargetReached() {
  log("Ship course target reached!");

  ourShip.course = null;
  updateShipStatus();
}

function onSetShipPosition(pos: XYZ) {
  ourShip.position = pos;
  updateShipStatus();
}

function onShout(author: { crewId: string; captainName: string }, text: string) {
  log(`${author.captainName} (Crew ID: ${author.crewId}) shouts: ${text}`);
}

function onUseShipScannerClick(event: MouseEvent) {
  event.preventDefault();

  const onScanPlanetsAck: Game.UseShipScannerCallback = (err, planets) => {
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

  socket.emit("useShipScanner", onScanPlanetsAck);
}

function onSetShipCourseClick(event: MouseEvent) {
  event.preventDefault();

  const [ x, y, z ] = getValue("ship-course-target").split(",").map((v) => parseInt(v, 10));
  const target = { x, y, z };

  const onSetShipCourseAck: Game.SetShipCourseCallback = (err) => {
    if (err != null) {
      log(`Error while setting ship course: ${err}.`);
      return;
    }

    ourShip.course = { target };
    log("Ship course set!");
    updateShipStatus();
  };

  log(`Setting course for (${x},${y},${z})`);
  socket.emit("setShipCourse", target, onSetShipCourseAck);
}

function onLandShipClick(event: MouseEvent) {
  event.preventDefault();

  const onLandShipAck: Game.LandShipCallback = (err, planet) => {
    if (err != null) {
      log(`Error while landing ship: ${err}.`);
      return;
    }

    log("Ship has landed!");

    ourPlanet = planet;
    ourShip.planetId = planet.id;
    updateShipStatus();
    updateShipActions();
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

    ourPlanet = null;
    ourShip.planetId = null;
    updateShipStatus();
    updateShipActions();
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
    ourShip = null;
    getPane("ship").hidden = true;
    updateCrewInfo();

    getPane("planet").hidden = false;
    updatePlanetInfo();
  };

  socket.emit("leaveShip", onLeaveShipAck);
}

function onEnterShipClick(event: MouseEvent) {
  event.preventDefault();

  const onEnterShipAck: Game.EnterShipCallback = (err, ship) => {
    if (err != null) {
      log(`Error while entering ship: ${err}.`);
      return;
    }

    log("Entered the ship.");
    ourShip = ship;
    getPane("planet").hidden = true;
    getPane("ship").hidden = false;
    updateShipStatus();
    updateShipActions();
    updateCrewInfo();
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
