import game, { log, socket } from "../index";
import * as ui from "./index";

export function setup() {
  if (localStorage["gameShipId"] != null) ui.getInput("ship-id").value = localStorage["gameShipId"];
  if (localStorage["gameShipKey"] != null) ui.getInput("ship-key").value = localStorage["gameShipKey"];

  document.querySelector(".exit-ship button").addEventListener("click", onSpaceportExitShipclick);
  document.querySelector(".enter-ship button").addEventListener("click", onSpaceportEnterShipClick);

  if (game.planet != null) {
    ui.getPane("planet").hidden = false;
    ui.planet.refresh();
  }
}

export function refresh() {
  refreshStatus();
  refreshSpaceport();
}

export function refreshStatus() {
  const position = ui.getReadablePosition(game.planet.position);

  (document.querySelector(".planet .name span") as HTMLSpanElement).textContent = game.planet.name;
  (document.querySelector(".planet .position span") as HTMLSpanElement).textContent = position;
}

export function refreshPlaces() {
  // TODO
}

export function refreshSpaceport() {
  (document.querySelector(".exit-ship") as HTMLDivElement).hidden = game.ship == null;
  (document.querySelector(".enter-ship") as HTMLDivElement).hidden = game.ship != null;
}

function onSpaceportExitShipclick(event: MouseEvent) {
  event.preventDefault();

  const onExitShipAck: Game.SpaceportExitShipCallback = (err) => {
    if (err != null) {
      log(`Error while exiting ship: ${err}.`);
      return;
    }

    game.ship = null;
    ui.getPane("ship").hidden = true;
    log("Exited the ship.");

    ui.crew.refreshStatus();
    refreshPlaces();
    refreshSpaceport();
  };

  socket.emit("spaceport.exitShip", onExitShipAck);
}

function onSpaceportEnterShipClick(event: MouseEvent) {
  event.preventDefault();

  const onEnterShipAck: Game.SpaceportEnterShipCallback = (err, ship) => {
    if (err != null) {
      log(`Error while entering ship: ${err}.`);
      return;
    }

    log("Entered the ship.");
    game.ship = ship;
    ui.getPane("ship").hidden = false;

    ui.ship.refresh();
    ui.crew.refreshStatus();
    refreshPlaces();
    refreshSpaceport();
  };

  const shipId = localStorage["gameShipId"] = ui.getValue("ship-id");
  const key = localStorage["gameShipKey"] = ui.getValue("ship-key");

  socket.emit("spaceport.enterShip", shipId, key, onEnterShipAck);
}
