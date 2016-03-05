import * as crew from "./crew";
import * as ship from "./ship";
import * as planet from "./planet";
export { crew, ship, planet };

export function getPane(name: string) { return document.querySelector(`body > main > .${name}`) as HTMLDivElement; }
export function getButton(name: string) { return document.querySelector(`button.${name}`) as HTMLButtonElement; }
export function getInput(name: string) { return (document.querySelector(`input.${name}`) as HTMLInputElement); }
export function getValue(name: string) { return (document.querySelector(`input.${name}`) as HTMLInputElement).value; }

export function getReadablePosition(pos: XYZ) {
  return `(${pos.x},${pos.y},${pos.z})`;
}
