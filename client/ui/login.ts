import game, { log, socket, loginDone } from "../index";
import * as ui from "./index";

export function setup() {
  if (localStorage["gameCrewId"] != null) ui.getInput("crew-id").value = localStorage["gameCrewId"];
  if (localStorage["gameCrewKey"] != null) ui.getInput("crew-key").value = localStorage["gameCrewKey"];

  ui.getButton("create-crew").addEventListener("click", onCreateCrewClick);
  ui.getButton("return-to-crew").addEventListener("click", onReturnToCrewClick);
}

// UI events
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

    localStorage["gameCrewId"] = game.crew.id;
    localStorage["gameCrewKey"] = result.crewKey;

    localStorage["gameShipId"] = game.ship.id;
    localStorage["gameShipKey"] = result.shipKey;

    loginDone();
  };

  socket.emit("createCrew", shipName, captainName, onCreateCrewAck);
  ui.getPane("log-in").hidden = true;
}

function onReturnToCrewClick(event: MouseEvent) {
  event.preventDefault();

  const crewId = localStorage["gameCrewId"] = ui.getValue("crew-id");
  const crewKey = localStorage["gameCrewKey"] = ui.getValue("crew-key");

  const onReturnToCrewAck: Game.ReturnToCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while returning to crew: ${err}.`);
      ui.getPane("log-in").hidden = false;
      return;
    }

    game.crew = result.crew;
    game.ship = result.ship;
    game.planet = result.planet;

    loginDone();
  };

  socket.emit("returnToCrew", crewId, crewKey, onReturnToCrewAck);
  ui.getPane("log-in").hidden = true;
}
