import { io } from "./index";
import * as planets from "./planets";
import { isSamePosition, moveTowards } from "./positions";

export const byId: { [shipId: string]: ServerGame.Ship; } = {};
export const byPlanetId: { [planetId: string]: ServerGame.Ship[]; } = {};
export const all: ServerGame.Ship[] = [];

export function register(ship: ServerGame.Ship) {
  all.push(ship);
  byId[ship.pub.id] = ship;
  if (ship.pub.planetId != null) addToPlanet(ship);
}

export function addToPlanet(ship: ServerGame.Ship) {
  if (ship.pub.planetId == null) throw new Error("ships.addToPlanet called with null ship planetId");
  let planetShips = byPlanetId[ship.pub.planetId];
  if (planetShips == null) planetShips = byPlanetId[ship.pub.planetId] = [];
  planetShips.push(ship);
}

export function removeFromPlanet(ship: ServerGame.Ship) {
  if (ship.pub.planetId == null) throw new Error("ships.addToPlanet called with null ship planetId");
  const planetShips = byPlanetId[ship.pub.planetId];
  planetShips.splice(planetShips.indexOf(ship), 1);
  ship.pub.planetId = null;
}

export function tick() {
  for (const ship of all) {
    if (ship.pub.course != null) advanceCourse(ship);
  }
}

function advanceCourse(ship: ServerGame.Ship) {
  if (isSamePosition(ship.pub.position, ship.pub.course.target)) {
    ship.pub.course = null;
    io.in(`ship:${ship.pub.id}`).emit("shipCourseTargetReached");
  } else {
    moveTowards(ship.pub.position, ship.pub.course.target);
    io.in(`ship:${ship.pub.id}`).emit("setShipPosition", ship.pub.position);
  }
}
