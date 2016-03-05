import * as fs from "fs";

import * as index from "./index";
import * as crews from "./crews";
import * as ships from "./ships";
import * as planets from "./planets";

export function save() {
  const data: ServerGame.Save = {
    time: index.time,
    planets: planets.all.map((x) => { return { pub: x.pub, priv: x.priv }; }),
    ships: ships.all.map((x) => { return { pub: x.pub, priv: x.priv }; }),
    crews: crews.all.map((x) => { return { pub: x.pub, priv: x.priv }; })
  };

  fs.writeFileSync(`${__dirname}/../save.json`, JSON.stringify(data, null, 2));

  console.log(`Saved game at time ${index.time}.`);
}

export function load() {
  let dataJSON: string;
  try {
    dataJSON = fs.readFileSync(`${__dirname}/../save.json`, { encoding: "utf8" });
  } catch (err) {
    return false;
  }

  const data: ServerGame.Save = JSON.parse(dataJSON);
  index.time = data.time;

  for (const savedPlanet of data.planets) {
    const planet: ServerGame.Planet = {
      pub: savedPlanet.pub,
      priv: savedPlanet.priv,
      // ...
    };
    planets.register(savedPlanet);
  }

  for (const savedShip of data.ships) {
    const ship: ServerGame.Ship = {
      pub: savedShip.pub,
      priv: savedShip.priv,
      crew: null
    };
    ships.register(ship);
  }

  for (const savedCrew of data.crews) {
    const crew: ServerGame.Crew = {
      pub: savedCrew.pub,
      priv: savedCrew.priv,
      // ...
    };

    if (crew.pub.location.shipId != null) {
      ships.byId[crew.pub.location.shipId].crew = crew;
    }

    crews.register(crew);
  }

  console.log(`Loaded saved game at time ${index.time}.`);
  return true;
}
