import { getNextId } from "./ids";
import { generatePlanetName } from "./names";
import { getRandomPosition, getPositionString, distanceBetween } from "./positions";

export const byId: { [planetId: string]: ServerGame.Planet; } = {};
export const byPosition: { [position: string]: ServerGame.Planet; } = {};
export const all: ServerGame.Planet[] = [];

export function register(planet: ServerGame.Planet) {
  all.push(planet);
  byId[planet.pub.id] = planet;
  byPosition[getPositionString(planet.pub.position)] = planet;
}

for (let i = 0; i < 10; i++) {
  let position: XYZ;
  let positionString: string;
  while (true) {
    position = getRandomPosition();
    positionString = getPositionString(position);
    if (byPosition[positionString] == null) break;
  }

  const planet: Game.Planet = {
    id: getNextId(),
    name: generatePlanetName(),
    position
  };

  const serverPlanet: ServerGame.Planet = { pub: planet };
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
