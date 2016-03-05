interface XYZ { x: number; y: number; z: number; }

declare namespace Game {
  interface ScannedObject {
    position: XYZ;
    type: string;
    name: string;
  }

  interface Ship {
    id: string;
    name: string;
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

  interface Crew {
    id: string;
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
  }

  interface CrewMember {
    id: string;
    name: string;
    role: string;
  }

  interface CreateCrewCallback {
    (err: string, result?: { crew: Crew; crewKey: string; ship: Ship; shipKey: string; }): void;
  }

  interface ReturnToCrewCallback {
    (err: string, result?: { crew: Crew; ship: Ship; planet: Planet; }): void;
  }

  interface UseShipScannerCallback {
    (err: string): void;
  }

  interface SetShipCourseCallback {
    (err: string): void;
  }

  interface LandShipCallback {
    (err: string, planet?: Planet): void;
  }

  interface SpaceportExitShipCallback {
    (err: string): void;
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

  interface Town {
    id: string;
    planetId: string;
    name: string;
  }

  interface Planet {
    id: string;
    name: string;
    position: XYZ;
  }
}

declare namespace ServerGame {
  interface SavedCrew {
    pub: Game.Crew;
    priv: {
      key: string;
    };
  }

  interface Crew extends SavedCrew {
  }

  interface SavedShip {
    pub: Game.Ship;
    priv: {
      key: string;
    };
  }

  interface Ship extends SavedShip {
    crew: Crew;
  }

  interface SavedPlanet {
    pub: Game.Planet;
    priv: {};
  }

  interface Planet extends SavedPlanet {
  }

  interface Save {
    time: number;
    crews: SavedCrew[];
    ships: SavedShip[];
    planets: SavedPlanet[];
  }
}
