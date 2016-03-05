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
    if (ship.pub.scanner.timer != null) runScan(ship);
  }
}

function advanceCourse(ship: ServerGame.Ship) {
  if (isSamePosition(ship.pub.position, ship.pub.course.target)) {
    ship.pub.course = null;
    io.in(`ship:${ship.pub.id}`).emit("ship.courseTargetReached");
  } else {
    moveTowards(ship.pub.position, ship.pub.course.target);
    io.in(`ship:${ship.pub.id}`).emit("ship.setPosition", ship.pub.position);
  }
}

function runScan(ship: ServerGame.Ship) {
  ship.pub.scanner.timer--;

  if (ship.pub.scanner.timer === 0) {
    ship.pub.scanner.timer = null;
    const nearbyObjects = ship.pub.scanner.data = [];

    for (const planet of planets.getNearbyPlanets(ship.pub.position, 50)) {
      nearbyObjects.push({
        type: "planet",
        name: planet.name,
        position: planet.position
      });
    }

    io.in(`ship:${ship.pub.id}`).emit("ship.scannerResults", nearbyObjects);
  }
}