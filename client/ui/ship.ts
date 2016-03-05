import * as ui from "./index";
import game, { log, socket } from "../index";

export function setup() {
  ui.getButton("land-ship").addEventListener("click", onLandShipClick);
  ui.getButton("take-off-ship").addEventListener("click", onTakeOffShipClick);
  ui.getButton("leave-ship").addEventListener("click", onLeaveShipClick);

  ui.getButton("use-ship-scanner").addEventListener("click", onUseShipScannerClick);

  ui.getButton("set-ship-course").addEventListener("click", onSetShipCourseClick);
}

export function refresh() {
  refreshStatus();
  refreshActions();
  refreshScanner();
}

export function refreshStatus() {
  let location = "In space";
  if (game.ship.planetId != null) location = `Landed on planet ${game.planet.name} (ID: ${game.planet.id}).`;

  const position = ui.getReadablePosition(game.ship.position);

  let course = "None";
  if (game.ship.course != null) course = `Moving towards ${ui.getReadablePosition(game.ship.course.target)}`;

  (document.querySelector(".ship .location span") as HTMLSpanElement).textContent = location;
  (document.querySelector(".ship .position span") as HTMLSpanElement).textContent = position;
  (document.querySelector(".ship .course span") as HTMLSpanElement).textContent = course;
}

export function refreshActions() {
  const hasLanded = game.ship.planetId != null;

  ui.getButton("land-ship").disabled = hasLanded;
  ui.getButton("take-off-ship").disabled = !hasLanded;
  ui.getButton("leave-ship").disabled = !hasLanded;
}

function refreshScanner() {
  
}


function onUseShipScannerClick(event: MouseEvent) {
  event.preventDefault();

  const onScanPlanetsAck: Game.UseShipScannerCallback = (err, planets) => {
    ui.getButton("use-ship-scanner").disabled = false;

    if (err != null) {
      log(`Error while scanning planets: ${err}.`);
      return;
    }

    log(`Scan successful! ${planets.length} objects located in a 100 units radius.`);

    const resultsList = document.querySelector(".scanner .results") as HTMLUListElement;
    resultsList.innerHTML = "";

    log("Nearby planets (radius 100):");
    for (const planet of planets) {
      log(`Planet ID ${planet.id} (name: ${planet.name}) at (${planet.position.x},${planet.position.y},${planet.position.z}).`);
    }
    if (planets.length === 0) log("None found!");
  };

  log("Scanning nearby objects...");
  ui.getButton("use-ship-scanner").disabled = true;
  socket.emit("useShipScanner", onScanPlanetsAck);
}

function onSetShipCourseClick(event: MouseEvent) {
  event.preventDefault();

  const [ x, y, z ] = ui.getValue("ship-course-target").split(",").map((v) => parseInt(v, 10));
  const target = { x, y, z };

  const onSetShipCourseAck: Game.SetShipCourseCallback = (err) => {
    if (err != null) {
      log(`Error while setting ship course: ${err}.`);
      return;
    }

    game.ship.course = { target };
    log("Ship course set!");
    ui.ship.refreshStatus();
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

    game.planet = planet;
    game.ship.planetId = planet.id;
    ui.ship.refresh();
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

    game.planet = null;
    game.ship.planetId = null;
    ui.ship.refresh();
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

    game.ship = null;
    ui.getPane("ship").hidden = true;
    log("Left the ship.");

    ui.crew.refreshStatus();

    ui.getPane("planet").hidden = false;
    ui.planet.refresh();
  };

  socket.emit("leaveShip", onLeaveShipAck);
}
