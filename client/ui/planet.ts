import game, { log, socket } from "../index";
import * as ui from "./index";

export function setup() {
  if (game.planet != null) {
    show();
    refresh();
  }
}

export function show() { ui.getPane("planet").hidden = false; }
export function hide() { ui.getPane("planet").hidden = true; }

export function refresh() {
  refreshStatus();
}

export function refreshStatus() {
  const position = ui.getReadablePosition(game.planet.position);

  (document.querySelector(".planet .name span") as HTMLSpanElement).textContent = game.planet.name;
  (document.querySelector(".planet .position span") as HTMLSpanElement).textContent = position;
}

export function refreshPlaces() {
  // TODO
}
