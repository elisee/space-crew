import game, { log, socket } from "../index";

export function setup() {
  (document.querySelector(".shout") as HTMLFormElement).hidden = false;
  (document.querySelector(".nearby-crews") as HTMLFormElement).hidden = false;

  refreshCrewsList();
}

export function refreshCrewsList() {
  const crewsList = document.querySelector(".sidebar .nearby-crews ul") as HTMLUListElement;
  crewsList.innerHTML = "";

  if (game.place != null) {
    for (const crewInfo of game.place.crews) {
      const crewItem = document.createElement("tr");
      crewItem.textContent = crewInfo.captainName;
      crewsList.appendChild(crewItem);
    }
  } else {
    const crewItem = document.createElement("tr");
    crewItem.textContent = "In space, no one can hear you shout.";
    crewsList.appendChild(crewItem);
  }
}
