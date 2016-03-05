import game, { log, socket } from "../index";
import * as ui from "./index";

export function setup() {
  if (localStorage["gameShipId"] != null) ui.getInput("ship-id").value = localStorage["gameShipId"];
  if (localStorage["gameShipKey"] != null) ui.getInput("ship-key").value = localStorage["gameShipKey"];

  ui.getButton("enter-ship").addEventListener("click", onEnterShipClick);

  if (game.planet != null) {
    ui.getPane("planet").hidden = false;
    ui.planet.refresh();
  }
}

export function refresh() {
  refreshStatus();
}

export function refreshStatus() {
  
}


function onEnterShipClick(event: MouseEvent) {
  event.preventDefault();

  const onEnterShipAck: Game.EnterShipCallback = (err, ship) => {
    if (err != null) {
      log(`Error while entering ship: ${err}.`);
      return;
    }

    log("Entered the ship.");
    game.ship = ship;
    ui.getPane("planet").hidden = true;
    ui.getPane("ship").hidden = false;
    ui.ship.refresh();
    ui.crew.refresh();
  };

  const shipId = localStorage["gameShipId"] = ui.getValue("ship-id");
  const key = localStorage["gameShipKey"] = ui.getValue("ship-key");

  socket.emit("enterShip", shipId, key, onEnterShipAck);
}
