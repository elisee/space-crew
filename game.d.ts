interface XYZ { x: number; y: number; z: number; }

declare namespace Game {
  interface CrewInfo {
    id: string;
    captainName: string;
  }

  interface Crew {
    info: CrewInfo;

    location: {
      // Only one of those can be set
      shipId?: string;

      planet?: {
        id: string;
        place: string;
      }
    };

    members: {
      captain: CrewMember;
      pilot: CrewMember;
      weapon: CrewMember;
      mechanic: CrewMember;
      cook: CrewMember;
    };

    credits: number;
  }

  interface CrewMember {
    id: string;
    name: string;
    role: string;
  }

  interface ScannedObject {
    position: XYZ;
    type: string;
    name: string;
  }

  interface ShipInfo {
    id: string;
    model: string;
    name: string;
  }

  interface Ship {
    info: ShipInfo;

    health: number;

    planetId: string;
    position: XYZ;

    scanner: {
      timer: number;
      data: ScannedObject[];
    };

    course?: {
      target: XYZ;
    };
  }

  interface CreateCrewCallback {
    (err: string, result?: { crew: Crew; crewKey: string; ship: Ship; shipKey: string; }): void;
  }

  interface ReturnToCrewCallback {
    (err: string, result?: { crew: Crew; ship: Ship; planet: Planet; place: Place; }): void;
  }

  interface UseShipScannerCallback {
    (err: string): void;
  }

  interface SetShipCourseCallback {
    (err: string): void;
  }

  interface LandShipCallback {
    (err: string, planet?: Planet, spaceport?: Spaceport): void;
  }

  interface SpaceportExitShipCallback {
    (err: string, spaceport?: Spaceport): void;
  }

  interface SpaceportEnterShipCallback {
    (err: string, ship?: Ship): void;
  }

  interface TakeOffShipCallback {
    (err: string): void;
  }

  interface ShoutCallback {
    (err: string): void;
  }


  interface Planet {
    id: string;
    name: string;
    position: XYZ;
  }

  // Places
  interface Place {
    planetId: string;
    crews: CrewInfo[];
  }

  interface Spaceport extends Place {
    ships: ShipInfo[];
  }

  interface Mine {
    mineralType: string;
  }
}

declare namespace ServerGame {
  interface Save {
    time: number;
    crews: SavedCrew[];
    ships: SavedShip[];
    planets: SavedPlanet[];
    spaceports: SavedSpaceport[];
  }

  interface SavedCrew {
    pub: Game.Crew;
    key: string;
  }

  interface Crew {
    pub: Game.Crew;
    key: string;
  }

  interface SavedShip {
    pub: Game.Ship;
    key: string;
  }

  interface Ship {
    pub: Game.Ship;
    key: string;
    crew: Crew;
  }

  interface SavedPlanet {
    pub: Game.Planet;
  }

  interface Planet {
    pub: Game.Planet;
    spaceport: Spaceport;
  }

  // Places
  interface SavedSpaceport {
    planetId: string;
  }

  interface Spaceport {
    pub: Game.Spaceport;
  }

  interface SavedMine {
    pub: Game.Mine;
  }

  interface Mine {
    pub: Game.Mine;
  }
}
