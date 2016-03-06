import game, { log, socket } from "../index";
import * as ui from "./index";

let shipKeys: { [shipId: string]: string; } = {};

export function setup() {
  // Storage
  if (localStorage["gameShipKeys"] != null) shipKeys = JSON.parse(localStorage["gameShipKeys"]);

  // Show
  if (game.crew.location.planet != null && game.crew.location.planet.place === "spaceport") {
    show();
    refresh();
  }

  // Network
  socket.on("addShip", onAddShip);
  socket.on("removeShip", onRemoveShip);

  // UI events
  document.querySelector(".exit-ship button").addEventListener("click", onExitShipclick);
  document.querySelector(".enter-ship button").addEventListener("click", onEnterShipClick);
  document.querySelector(".enter-ship select.ship-id").addEventListener("change", () => { displaySelectedShipKey(); });
}

export function show() { ui.getPane("spaceport").hidden = false; }
export function hide() { ui.getPane("spaceport").hidden = true; }


function onAddShip(shipInfo: Game.ShipInfo) {
  (game.place as Game.Spaceport).ships.push(shipInfo);
  refreshShipList();
}

function onRemoveShip(shipId: string) {
  // TODO: store ships by id somewhere?

  let shipIndex: number;
  (game.place as Game.Spaceport).ships.some((x, index) => {
    if (x.id === shipId) { shipIndex = index; return true; }
    return false;
  });

  (game.place as Game.Spaceport).ships.splice(shipIndex, 1);
  refreshShipList();
}

export function refresh() {
  refreshShipList();
}

export function refreshShipList() {
  (document.querySelector(".spaceport .ship-list .count span") as HTMLSpanElement).textContent = (game.place as Game.Spaceport).ships.length.toString();

  const tbody = document.querySelector(".spaceport .ship-list tbody") as HTMLTableSectionElement;
  tbody.innerHTML = "";

  const select = document.querySelector(".spaceport .enter-ship select.ship-id") as HTMLSelectElement;
  select.innerHTML = "";

  const place = game.place as Game.Spaceport;
  for (const ship of place.ships) {
    const shipRow = document.createElement("tr");
    tbody.appendChild(shipRow);

    const nameCell = document.createElement("td");
    nameCell.textContent = ship.name;
    shipRow.appendChild(nameCell);

    const modelCell = document.createElement("td");
    modelCell.textContent = ship.model;
    shipRow.appendChild(modelCell);

    const keyCell = document.createElement("td");
    keyCell.textContent = shipKeys[ship.id] != null ? "Known" : "?";
    shipRow.appendChild(keyCell);


    const option = document.createElement("option");
    option.value = ship.id;
    option.textContent = ship.name;
    select.appendChild(option);
  }
  displaySelectedShipKey();

  (document.querySelector(".exit-ship") as HTMLDivElement).hidden = game.ship == null;
  (document.querySelector(".enter-ship") as HTMLDivElement).hidden = game.ship != null;
}

function onExitShipclick(event: MouseEvent) {
  event.preventDefault();

  const onExitShipAck: Game.SpaceportExitShipCallback = (err) => {
    if (err != null) {
      log(`Error while exiting ship: ${err}.`);
      return;
    }

    game.ship = null;
    ui.ship.hide();
    log("Exited the ship.");

    ui.crew.refreshStatus();
    ui.planet.refreshPlaces();
    refresh();
  };

  socket.emit("spaceport.exitShip", onExitShipAck);
}

function onEnterShipClick(event: MouseEvent) {
  event.preventDefault();

  const shipId = ui.getValue("ship-id");
  const key = ui.getValue("ship-key");

  const onEnterShipAck: Game.SpaceportEnterShipCallback = (err, ship) => {
    if (err != null) {
      log(`Error while entering ship: ${err}.`);
      return;
    }

    shipKeys[shipId] = key;
    localStorage["gameShipKeys"] = JSON.stringify(shipKeys);

    log("Entered the ship.");
    game.ship = ship;
    ui.ship.show();

    ui.ship.refresh();
    ui.crew.refreshStatus();
    ui.planet.refreshPlaces();
    refresh();
  };

  socket.emit("spaceport.enterShip", shipId, key, onEnterShipAck);
}

function displaySelectedShipKey() {
  const shipId = ui.getValue("ship-id");
  const key = shipKeys[shipId] != null ? shipKeys[shipId] : "";
  ui.getInput("ship-key").value = key;
}
