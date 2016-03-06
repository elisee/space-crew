import * as fs from "fs";

import { getRandomPosition, getPositionString } from "./positions";

import * as index from "./index";
import * as crews from "./crews";
import * as ships from "./ships";
import * as planets from "./planets";
import * as spaceports from "./spaceports";

export function generate() {
  for (let i = 0; i < 10; i++) {
    let position: XYZ;
    let positionString: string;
    while (true) {
      position = getRandomPosition();
      positionString = getPositionString(position);
      if (planets.byPosition[positionString] == null) break;
    }

    planets.createPlanet(position);
  }
}

export function save() {
  const savedCrews: ServerGame.SavedCrew[] = crews.all.map((x) => { return { pub: x.pub, key: x.key }; });
  const savedShips: ServerGame.SavedShip[] = ships.all.map((x) => { return { pub: x.pub, key: x.key }; });
  const savedPlanets: ServerGame.SavedPlanet[] = planets.all.map((x) => { return { pub: x.pub }; });
  const savedSpaceports: ServerGame.SavedSpaceport[] = spaceports.all.map((x) => { return { planetId: x.pub.planetId }; });

  const data: ServerGame.Save = {
    time: index.time,
    crews: savedCrews,
    ships: savedShips,
    planets: savedPlanets,
    spaceports: savedSpaceports
  };

  fs.writeFileSync(`${__dirname}/../cluster.json`, JSON.stringify(data, null, 2));

  console.log(`Saved game at time ${index.time}.`);
}

export function load() {
  let dataJSON: string;
  try {
    dataJSON = fs.readFileSync(`${__dirname}/../cluster.json`, { encoding: "utf8" });
  } catch (err) {
    return false;
  }

  const data: ServerGame.Save = JSON.parse(dataJSON);
  index.time = data.time;

  for (const savedPlanet of data.planets) {
    const planet: ServerGame.Planet = {
      pub: savedPlanet.pub,
      spaceport: null
    };
    planets.register(planet);
  }

  for (const savedSpaceport of data.spaceports) {
    const spaceport: ServerGame.Spaceport = {
      pub: {
        planetId: savedSpaceport.planetId,
        ships: [],
        crews: []
      }
    };
    spaceports.register(spaceport);
  }

  for (const savedShip of data.ships) {
    const ship: ServerGame.Ship = {
      pub: savedShip.pub,
      key: savedShip.key,
      crew: null
    };
    ships.register(ship);

    if (ship.pub.planetId != null) spaceports.addShip(ship);
  }

  for (const savedCrew of data.crews) {
    const crew: ServerGame.Crew = {
      pub: savedCrew.pub,
      key: savedCrew.key
    };

    if (crew.pub.location.shipId != null) {
      ships.byId[crew.pub.location.shipId].crew = crew;
    }

    crews.register(crew);

    if (crew.pub.location.planet != null && crew.pub.location.planet.place === "spaceport") {
      spaceports.addCrew(crew);
    }
  }

  console.log(`Loaded saved game at time ${index.time}.`);
  return true;
}
