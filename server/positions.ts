export function getRandomPosition() {
  const x = Math.floor(Math.random() * 101) - 50;
  const y = Math.floor(Math.random() * 101) - 50;
  const z = Math.floor(Math.random() * 101) - 50;

  return { x, y, z };
}

export function getPositionString(pos: XYZ) {
  return `${pos.x}_${pos.y}_${pos.z}`;
}

export function isSamePosition(pos1: XYZ, pos2: XYZ) {
  return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z;
}

export function distanceBetween(pos1: XYZ, pos2: XYZ) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2));
}

export function moveTowards(pos: XYZ, target: XYZ) {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dz = target.z - pos.z;

  const sx = sign(dx);
  const sy = sign(dy);
  const sz = sign(dz);

  // Compute the new distances for each potential axis move
  const rx = distanceBetween({ x: pos.x + sx, y: pos.y, z: pos.z }, target);
  const ry = distanceBetween({ x: pos.x, y: pos.y + sy, z: pos.z }, target);
  const rz = distanceBetween({ x: pos.x, y: pos.y, z: pos.z + sz }, target);

  // Pick the new shortest distance
  if (rx < ry) {
    if (rx < rz) pos.x += sx;
    else pos.z += sz;
  } else {
    if (ry < rz) pos.y += sy;
    else pos.z += sz;
  }
}

function sign(v: number) {
  if (v < 0) return -1;
  else if (v > 0) return 1;
  return 0;
}
