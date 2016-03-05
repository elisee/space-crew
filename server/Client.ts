import { getNextId } from "./ids";
import { isValidName } from "./names";
import { generateKey } from "./keys";
import { getRandomPosition, getPositionString } from "./positions";

import { io } from "./index";
import * as crews from "./crews";
import * as ships from "./ships";
import * as planets from "./planets";
import * as upgrades from "./upgrades";

export default class Client {
  private crew: ServerGame.Crew;

  constructor(public socket: SocketIO.Socket) {
    this.log("Connected.");
    this.socket.on("disconnected", this.onDisconnected);
    this.socket.on("createCrew", this.onCreateCrew);
    this.socket.on("returnToCrew", this.onReturnToCrew);
  }

  log(message: string) {
    const date = new Date();
    const text = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} [${this.crew != null ? this.crew.pub.members.captain.name : this.socket.id}] ${message}`;
    console.log(text);
  }

  private kill() {
    this.log("Killed.");
    this.socket.disconnect();
  }

  private onDisconnected = () => {
    this.log("Disconnected.");
  };

  private onCreateCrew = (shipName: string, captainName: string, callback: Game.CreateCrewCallback) => {
    if (typeof callback !== "function") { this.kill(); return; }
    if (!isValidName(shipName)) { callback("invalidCrewName"); return; }
    if (!isValidName(captainName)) { callback("invalidCaptainName"); return; }

    const ship: Game.Ship = {
      id: getNextId(),
      name: shipName,
      planetId: null,
      position: getRandomPosition(),
      scanner: {
        timer: null,
        data: null
      }
    };

    const crewId = getNextId();

    const captain: Game.CrewMember = {
      id: getNextId(),
      name: captainName,
      role: "captain"
    };

    const crew: Game.Crew = {
      id: crewId,
      location: { shipId: ship.id },
      members: { captain, pilot: null, weapon: null, mechanic: null, cook: null }
    };

    const serverCrew: ServerGame.Crew = { pub: crew, priv: { key: generateKey() } };
    crews.register(serverCrew);

    this.log(`Captain ${captain.name} started a crew aboard ship ${ship.name}.`);

    this.crew = serverCrew;

    const serverShip: ServerGame.Ship = { pub: ship, crew: serverCrew, priv: { key: generateKey() } };
    ships.register(serverShip);

    this.crewDone();
    callback(null, { crew, ship, crewKey: serverCrew.priv.key, shipKey: serverShip.priv.key });
  };

  private onReturnToCrew = (crewId: string, key: string, callback: Game.ReturnToCrewCallback) => {
    const serverCrew = crews.byId[crewId];
    if (serverCrew == null) { callback("noSuchCrew"); return; }
    if (serverCrew.priv.key !== key) { callback("invalidKey"); return; }

    this.log(`${serverCrew.pub.members.captain.name} returning to crew.`);

    this.crew = serverCrew;

    const serverShip = ships.byId[serverCrew.pub.location.shipId];
    const ship = serverShip != null ? serverShip.pub : null;
    let planet: Game.Planet;

    if (ship != null) {
      if (ship.planetId != null) planet = planets.byId[ship.planetId].pub;
    } else {
      planet = planets.byId[this.crew.pub.location.planet.id].pub;
    }

    this.crewDone();
    callback(null, { crew: serverCrew.pub, ship, planet });
  };

  private crewDone() {
    const location = this.crew.pub.location;
    if (location.shipId != null) {
      this.socket.join(`ship:${location.shipId}`);

      const ship = ships.byId[location.shipId];
      if (ship.pub.planetId != null) {
        this.socket.join(`planet:${ship.pub.planetId}`);
      }
    } else if (location.planet != null) {
      this.socket.join(`planet:${location.planet.id}`);
      this.socket.join(`planet:${location.planet.id}:${location.planet.place}`);
    }

    this.socket.on("ship.useScanner", this.onUseShipScanner);
    this.socket.on("ship.setCourse", this.onSetShipCourse);
    this.socket.on("ship.land", this.onLandShip);
    this.socket.on("ship.takeOff", this.onTakeOffShip);

    this.socket.on("spaceport.exitShip", this.onSpaceportExitShip);
    this.socket.on("spaceport.enterShip", this.onSpaceportEnterShip);

    this.socket.on("shout", this.onShout);
  }

  private onUseShipScanner = (callback: Game.UseShipScannerCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.scanner.timer != null) { callback("scanInProgress"); return; }

    ship.pub.scanner.timer = upgrades.ship.scanner.duration[0];
    callback(null);
  };

  private onSetShipCourse = (target: XYZ, callback: Game.SetShipCourseCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId != null) { callback("shipOnPlanet"); return; }

    ship.pub.course = { target };

    this.log(`Setting ship course to ${getPositionString(target)}.`);

    callback(null);
  };

  private onLandShip = (callback: Game.LandShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.course != null) { callback("shipCourseInProgress"); return; }
    if (ship.pub.planetId != null) { callback("shipOnPlanet"); return; }

    const planet = planets.byPosition[getPositionString(ship.pub.position)];
    if (planet == null) { callback("shipNotAbovePlanet"); return; }

    ship.pub.planetId = planet.pub.id;
    ships.addToPlanet(ship);

    this.socket.join(`planet:${ship.pub.planetId}`);
    this.socket.join(`planet:${ship.pub.planetId}:spaceport`);

    this.log(`Landed ship on ${planet.pub.name}.`);

    callback(null, planet.pub);
  };

  private onTakeOffShip = (callback: Game.TakeOffShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId == null) { callback("shipNotOnPlanet"); return; }

    this.socket.leave(`planet:${ship.pub.planetId}`);
    this.socket.leave(`planet:${ship.pub.planetId}:spaceport`);

    this.log(`Took off from ${planets.byId[ship.pub.planetId].pub.name}.`);

    ships.removeFromPlanet(ship);

    callback(null);
  };


  private onSpaceportExitShip = (callback: Game.SpaceportExitShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId == null) { callback("shipNotOnPlanet"); return; }

    this.crew.pub.location.shipId = null;
    this.crew.pub.location.planet = { id: ship.pub.planetId, place: "spaceport" };

    ship.crew = null;
    this.socket.leave(`ship:${ship.pub.id}`);

    this.log(`Exiting ship.`);

    callback(null);
  };

  private onSpaceportEnterShip = (shipId: string, key: string, callback: Game.SpaceportEnterShipCallback) => {
    const crewLocation = this.crew.pub.location;
    if (crewLocation.shipId != null) { callback("alreadyOnShip"); return; }
    if (crewLocation.planet.place !== "spaceport") { callback("notAtSpaceport"); return; }

    const ship = ships.byId[shipId];
    if (ship == null) { callback("noSuchShip"); return; }
    if (ship.pub.planetId !== crewLocation.planet.id) { callback("shipNotOnPlanet"); return; }
    if (ship.crew != null) { callback("shipFull"); return; }
    if (ship.priv.key !== key) { callback("invalidKey"); return; }

    ship.crew = this.crew;

    crewLocation.planet = null;
    crewLocation.shipId = ship.pub.id;

    this.socket.join(`ship:${ship.pub.id}`);

    this.log(`Entering ship ${ship.pub.name}.`);

    callback(null, ship.pub);
  };

  private onShout = (message: string, callback: Game.ShoutCallback) => {
    if (typeof message !== "string" || message.length === 0 || message.length > 300) {
      callback("invalidMessage");
      return;
    }

    const location = this.crew.pub.location;
    const room = (location.shipId != null) ? `ship:${location.shipId}` : `planet:${location.planet.id}:${location.planet.place}`;

    this.log(`Shouted "${message}" in ${room}.`);
    io.in(room).emit("shout", { crewId: this.crew.pub.id, captainName: this.crew.pub.members.captain.name }, message);
    callback(null);
  };
}
