const nameRegex = /^[A-Za-z][A-Za-z0-9]{1,29}$/;

export function isValidName(name: string) {
  if (typeof name !== "string") return false;
  return nameRegex.test(name);
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
