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
    this.socket.on("createCrew", this.onCreateCrew);
    this.socket.on("returnToCrew", this.onReturnToCrew);
  }

  private kill() {
    this.socket.disconnect();
  }

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

    this.crew = serverCrew;

    const serverShip = ships.byId[serverCrew.pub.location.shipId];
    const ship = serverShip != null ? serverShip.pub : null;
    let planet: Game.Planet;

    if (ship != null) {
      if (ship.planetId != null) planet = planets.byId[ship.planetId].pub;
    } else {
      planet = planets.byId[this.crew.pub.location.planetId].pub;
    }

    this.crewDone();
    callback(null, { crew: serverCrew.pub, ship, planet });
  };

  private crewDone() {
    const location = this.crew.pub.location;
    if (location.shipId != null) this.socket.join(`ship:${location.shipId}`);
    else if (location.planetId != null) this.socket.join(`planet:${location.planetId}`);

    this.socket.on("useShipScanner", this.onUseShipScanner);
    this.socket.on("setShipCourse", this.onSetShipCourse);
    this.socket.on("landShip", this.onLandShip);
    this.socket.on("leaveShip", this.onLeaveShip);
    this.socket.on("enterShip", this.onEnterShip);
    this.socket.on("takeOffShip", this.onTakeOffShip);

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

    callback(null, planet.pub);
  };

  private onLeaveShip = (callback: Game.LeaveShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId == null) { callback("shipNotOnPlanet"); return; }

    this.crew.pub.location.shipId = null;
    this.crew.pub.location.planetId = ship.pub.planetId;

    ship.crew = null;

    this.socket.leave(`ship:${ship.pub.id}`);
    this.socket.join(`planet:${ship.pub.planetId}`);

    callback(null);
  };

  private onEnterShip = (shipId: string, key: string, callback: Game.EnterShipCallback) => {
    if (this.crew.pub.location.shipId != null) { callback("alreadyOnShip"); return; }
    const ship = ships.byId[shipId];
    if (ship == null) { callback("noSuchShip"); return; }
    if (ship.pub.planetId !== this.crew.pub.location.planetId) { callback("shipNotOnPlanet"); return; }
    if (ship.crew != null) { callback("shipFull"); return; }
    if (ship.priv.key !== key) { callback("invalidKey"); return; }

    ship.crew = this.crew;

    this.crew.pub.location.planetId = null;
    this.crew.pub.location.shipId = ship.pub.id;

    this.socket.leave(`planet:${ship.pub.planetId}`);
    this.socket.join(`ship:${ship.pub.id}`);

    callback(null, ship.pub);
  };

  private onTakeOffShip = (callback: Game.TakeOffShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId == null) { callback("shipNotOnPlanet"); return; }

    ships.removeFromPlanet(ship);
    callback(null);
  };

  private onShout = (message: string, callback: Game.ShoutCallback) => {
    if (typeof message !== "string" || message.length === 0 || message.length > 300) {
      callback("invalidMessage");
      return;
    }

    const location = this.crew.pub.location;
    const room = (location.shipId != null) ? `ship:${location.shipId}` : `planet:${location.planetId}`;
    io.in(room).emit("shout", { crewId: this.crew.pub.id, captainName: this.crew.pub.members.captain.name }, message);
    callback(null);
  };
}
