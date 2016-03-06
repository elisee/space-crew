import game, { log, socket, loginDone } from "../index";
import * as ui from "./index";

export function setup() {
  if (localStorage["gameCrewId"] != null) ui.getInput("crew-id").value = localStorage["gameCrewId"];
  if (localStorage["gameCrewKey"] != null) ui.getInput("crew-key").value = localStorage["gameCrewKey"];

  ui.getButton("create-crew").addEventListener("click", onCreateCrewClick);
  ui.getButton("return-to-crew").addEventListener("click", onReturnToCrewClick);
}

export function show() { ui.getPane("log-in").hidden = false; }
export function hide() { ui.getPane("log-in").hidden = true; }

// UI events
function onCreateCrewClick(event: MouseEvent) {
  event.preventDefault();

  const shipName = ui.getValue("ship-name");
  const captainName = ui.getValue("captain-name");

  const onCreateCrewAck: Game.CreateCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while creating crew: ${err}.`);
      show();
      return;
    }

    log(`Crew created! ID is ${result.crew.info.id}, key is ${result.crewKey}.`);
    log(`Ship ID is ${result.ship.info.id}, key is ${result.shipKey}.`);
    log(`Save those for future use!`);

    game.crew = result.crew;
    game.ship = result.ship;

    localStorage["gameCrewId"] = game.crew.info.id;
    localStorage["gameCrewKey"] = result.crewKey;
    localStorage["gameShipKeys"] = JSON.stringify({ [game.ship.info.id]: result.shipKey });

    loginDone();
  };

  socket.emit("createCrew", shipName, captainName, onCreateCrewAck);
  hide();
}

function onReturnToCrewClick(event: MouseEvent) {
  event.preventDefault();

  const crewId = localStorage["gameCrewId"] = ui.getValue("crew-id");
  const crewKey = localStorage["gameCrewKey"] = ui.getValue("crew-key");

  const onReturnToCrewAck: Game.ReturnToCrewCallback = (err, result) => {
    if (err != null) {
      log(`Error while returning to crew: ${err}.`);
      show();
      return;
    }

    game.crew = result.crew;
    game.ship = result.ship;
    game.planet = result.planet;
    game.place = result.place;
    loginDone();
  };

  socket.emit("returnToCrew", crewId, crewKey, onReturnToCrewAck);
  hide();
}
