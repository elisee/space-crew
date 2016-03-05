export const byId: { [crewId: string]: ServerGame.Crew } = {};

export function register(crew: ServerGame.Crew) {
  byId[crew.pub.id] = crew;
}
