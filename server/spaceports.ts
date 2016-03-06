export const byPlanetId: { [planetId: string]: ServerGame.Spaceport; } = {};
export const all: ServerGame.Spaceport[] = [];

export function create(planetId: string) {
  const spaceport: ServerGame.Spaceport = {
    pub: {
      planetId,
      ships: [],
      crews: []
    }
  };
  register(spaceport);

  return spaceport;
}

export function register(spaceport: ServerGame.Spaceport) {
  all.push(spaceport);
  byPlanetId[spaceport.pub.planetId] = spaceport;
}

export function addShip(ship: ServerGame.Ship) {
  const spaceport = byPlanetId[ship.pub.planetId];
  spaceport.pub.ships.push(ship.pub.info);
}

export function removeShip(ship: ServerGame.Ship) {
  const spaceport = byPlanetId[ship.pub.planetId];
  spaceport.pub.ships.splice(spaceport.pub.ships.indexOf(ship.pub.info), 1);
}

export function addCrew(crew: ServerGame.Crew) {
  const spaceport = byPlanetId[crew.pub.location.planet.id];
  spaceport.pub.crews.push(crew.pub.info);
}

export function removeCrew(crew: ServerGame.Crew) {
  const spaceport = byPlanetId[crew.pub.location.planet.id];
  spaceport.pub.crews.splice(spaceport.pub.crews.indexOf(crew.pub.info), 1);
}
