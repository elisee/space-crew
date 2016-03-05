import game, { log, socket } from "../index";
import * as ui from "./index";

export function setup() {
  // Network
  ui.getButton("shout").addEventListener("click", onShoutClick);

  // UI events
  socket.on("shout", onShout);
}

export function refresh() {
  refreshStatus();
}

export function refreshStatus() {
  let location = "";
  if (game.ship != null) location = `Onboard ship ${game.ship.name} (ID: ${game.ship.id}).`;
  else location = `On planet ${game.planet.name} (ID: ${game.planet.id}).`;

  (document.querySelector(".crew .location span") as HTMLSpanElement).textContent = location;

  const membersList = document.querySelector(".crew .members ul") as HTMLUListElement;
  membersList.innerHTML = "";

  for (const role in game.crew.members) {
    const member = game.crew.members[role];

    let desc = `${role}: (none)`;
    if (member != null) desc = `${role}: ${member.name}`;

    const li = document.createElement("li");
    li.textContent = desc;

    membersList.appendChild(li);
  }
}

// Network
function onShout(author: { crewId: string; captainName: string }, text: string) {
  log(`${author.captainName} (Crew ID: ${author.crewId}) shouts: ${text}`);
}

// UI events
function onShoutClick(event: MouseEvent) {
  event.preventDefault();

  const onShoutAck: Game.ShoutCallback = (err) => {
    if (err != null) {
      log(`Error while taking off ship: ${err}.`);
      return;
    }
  };

  const message = ui.getValue("shout-message");
  socket.emit("shout", message, onShoutAck);
}
