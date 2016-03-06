import { getNextId } from "./ids";
import { generatePlanetName } from "./names";
import { getPositionString, distanceBetween } from "./positions";

import * as spaceports from "./spaceports";

export const byId: { [planetId: string]: ServerGame.Planet; } = {};
export const byPosition: { [position: string]: ServerGame.Planet; } = {};
export const all: ServerGame.Planet[] = [];

export function register(planet: ServerGame.Planet) {
  all.push(planet);
  byId[planet.pub.id] = planet;
  byPosition[getPositionString(planet.pub.position)] = planet;
}

export function createPlanet(position: XYZ) {
  const planet: Game.Planet = {
    id: getNextId(),
    name: generatePlanetName(),
    position
  };

  const spaceport = spaceports.create(planet.id);

  const serverPlanet: ServerGame.Planet = {
    pub: planet,
    spaceport
  };
  register(serverPlanet);
}

export function getNearbyPlanets(position: XYZ, radius: number) {
  // TODO: Replace with Game.PlanetInfo?
  const nearbyPlanets: Game.Planet[] = [];

  for (const planet of all) {
    const distance = distanceBetween(planet.pub.position, position);
    if (distance <= radius) nearbyPlanets.push(planet.pub);
  }

  return nearbyPlanets;
}
