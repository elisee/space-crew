export const byId: { [crewId: string]: ServerGame.Crew } = {};
export const all: ServerGame.Crew[] = [];

export function register(crew: ServerGame.Crew) {
  byId[crew.pub.id] = crew;
  all.push(crew);
}
