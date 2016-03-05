import { getNextId } from "./ids";
import { isValidName } from "./names";
import { generateKey } from "./keys";
import { getRandomPosition, getPositionString } from "./positions";
import * as crews from "./crews";
import * as ships from "./ships";
import * as planets from "./planets";
import { io } from "./index";

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
      position: getRandomPosition()
    };

    const serverShip: ServerGame.Ship = { pub: ship, key: generateKey() };
    ships.register(serverShip);

    const crewId = getNextId();

    const captain: Game.CrewMember = {
      id: getNextId(),
      name: captainName,
      role: "captain"
    };

    const crew: Game.Crew = {
      id: crewId,
      location: { shipId: ship.id },
      members: { captain }
    };

    const serverCrew: ServerGame.Crew = { pub: crew, key: generateKey() };
    crews.register(serverCrew);
    this.crew = serverCrew;

    this.crewDone();
    callback(null, { crew, ship, crewKey: serverCrew.key, shipKey: serverShip.key });
  };

  private onReturnToCrew = (crewId: string, key: string, callback: Game.ReturnToCrewCallback) => {
    const serverCrew = crews.byId[crewId];
    if (serverCrew == null) { callback("noSuchCrew"); return; }
    if (serverCrew.key !== key) { callback("invalidKey"); return; }

    this.crew = serverCrew;

    const serverShip = ships.byId[serverCrew.pub.location.shipId];
    const ship = serverShip != null ? serverShip.pub : null;

    this.crewDone();
    callback(null, { crew: serverCrew.pub, ship });
  };

  private crewDone() {
    const location = this.crew.pub.location;
    if (location.shipId != null) this.socket.join(`ship:${location.shipId}`);
    else if (location.planetId != null) this.socket.join(`planet:${location.planetId}`);

    this.socket.on("scanPlanets", this.onScanPlanets);
    this.socket.on("setShipCourse", this.onSetShipCourse);
    this.socket.on("landShip", this.onLandShip);
    this.socket.on("leaveShip", this.onLeaveShip);
    this.socket.on("enterShip", this.onEnterShip);
    this.socket.on("takeOffShip", this.onTakeOffShip);

    this.socket.on("shout", this.onShout);
  }

  private onScanPlanets = (callback: Game.ScanPlanetsCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }

    callback(null, planets.getNearbyPlanets(ship.pub.position, 50));
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

    callback(null);
  };

  private onLeaveShip = (callback: Game.LeaveShipCallback) => {
    const ship = ships.byId[this.crew.pub.location.shipId];
    if (ship == null) { callback("notOnShip"); return; }
    if (ship.pub.planetId == null) { callback("shipNotOnPlanet"); return; }

    this.crew.pub.location.shipId = null;
    this.crew.pub.location.planetId = ship.pub.planetId;

    this.socket.leave(`ship:${ship.pub.id}`);
    this.socket.join(`planet:${ship.pub.planetId}`);

    callback(null);
  };

  private onEnterShip = (shipId: string, key: string, callback: Game.EnterShipCallback) => {
    if (this.crew.pub.location.shipId != null) { callback("alreadyOnShip"); return; }
    const ship = ships.byId[shipId];
    if (ship == null) { callback("noSuchShip"); return; }
    if (ship.pub.planetId !== this.crew.pub.location.planetId) { callback("shipNotOnPlanet"); return; }
    if (ship.key !== key) { callback("invalidKey"); return; }

    this.crew.pub.location.planetId = null;
    this.crew.pub.location.shipId = ship.pub.id;

    this.socket.leave(`planet:${ship.pub.planetId}`);
    this.socket.join(`ship:${ship.pub.id}`);

    callback(null);
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
