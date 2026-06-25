export function jitterGeometry(geometry, amount) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i);
    const ny = pos.getY(i);
    const nz = pos.getZ(i);
    const bump = (Math.sin(nx * 23.1 + ny * 17.7) * 0.5 + Math.cos(nz * 19.3 - ny * 11.4) * 0.5) * amount;
    const len = Math.hypot(nx, nz) || 1;
    pos.setX(i, nx + (nx / len) * bump);
    pos.setZ(i, nz + (nz / len) * bump);
  }
  geometry.computeVertexNormals();
  return geometry;
}
