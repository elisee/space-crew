let nextId = 0;

export function getNextId(): string {
  const id = nextId++;
  return id.toString();
}

