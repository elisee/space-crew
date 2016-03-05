export function isValidName(name: string) {
  if (typeof name !== "string") return false;
  if (name.length < 2) return false;
  if (name.length > 30) return false;

  return true;
}

const digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const planetNameHalfLength = 3;

export function generatePlanetName() {
  let name = "";

  for (let i = 0; i < planetNameHalfLength; i++) name += digits[Math.floor(Math.random() * digits.length)];
  name += "-";
  for (let i = 0; i < planetNameHalfLength; i++) name += digits[Math.floor(Math.random() * digits.length)];

  return name;
}
