/**
 * Geometry for draw-to-search: the buyer draws a shape, and the map answers
 * with what is inside it.
 *
 * Why this file exists separately from the map: `GET /v1/search/map` takes a
 * BOUNDING BOX and nothing else — there is no polygon parameter and inventing
 * one would mean shipping a control that cannot be honoured. So the split is:
 * the server narrows to the drawn shape's box, which it genuinely supports,
 * and the precise inside/outside test happens here, on points the server
 * already returned. Same answer, no API fiction.
 *
 * Everything here is pure and framework-free so it can be tested exhaustively —
 * which matters more than usual, because the map itself cannot be rendered in
 * this environment to look at.
 */

export type GeoPoint = { lat: number; lng: number };

/** A drawn area. Never fewer than three non-degenerate corners — see `isUsableArea`. */
export type GeoArea = GeoPoint[];

/** The box `GET /v1/search/map` actually understands. */
export type GeoBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** A shape with under three corners encloses nothing, so it is not a filter. */
export const MIN_AREA_POINTS = 3;

// Twice the polygon area in degree² must clear floating-point dust. At Cairo's
// latitude this rejects a sub-metre accidental line while remaining far below
// any area a finger can deliberately draw at the supported map zooms.
const MIN_DOUBLE_AREA = 1e-12;

function isFiniteLatLng(p: GeoPoint | undefined): p is GeoPoint {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

/**
 * Is this shape something we can actually search with?
 *
 * Three finite corners minimum, and the shoelace area must be non-zero. Merely
 * asking whether one point differs from the first accepts A-B-A and three
 * collinear taps; neither encloses anything, and treating either as an area
 * silently returns zero results and looks like a broken filter.
 */
export function isUsableArea(area: unknown): area is GeoArea {
  if (!Array.isArray(area) || area.length < MIN_AREA_POINTS) return false;
  if (!area.every(isFiniteLatLng)) return false;
  let doubleArea = 0;
  for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
    const a = area[j] as GeoPoint;
    const b = area[i] as GeoPoint;
    doubleArea += a.lng * b.lat - b.lng * a.lat;
  }
  return Math.abs(doubleArea) > MIN_DOUBLE_AREA;
}

/** The tightest box containing the shape — what the server gets asked for. */
export function areaBounds(area: GeoArea): GeoBounds {
  let north = area[0].lat;
  let south = area[0].lat;
  let east = area[0].lng;
  let west = area[0].lng;
  for (const p of area) {
    if (p.lat > north) north = p.lat;
    if (p.lat < south) south = p.lat;
    if (p.lng > east) east = p.lng;
    if (p.lng < west) west = p.lng;
  }
  return { north, south, east, west };
}

/**
 * Ray casting, counting crossings of a horizontal ray to the east.
 *
 * Two details that decide whether this is correct rather than nearly correct:
 *
 * The half-open latitude test `(a.lat > lat) !== (b.lat > lat)` treats each
 * edge as containing its lower endpoint and not its upper one. That is what
 * stops a ray passing exactly through a shared vertex from counting the same
 * crossing twice and flipping the answer inside-out — the classic failure of
 * a naive implementation, and one that only shows up on real data.
 *
 * The comparison is `<` on the x of the crossing, so a point sitting exactly
 * on a vertical edge resolves consistently instead of by floating-point luck.
 *
 * Longitude is treated as a plain number. The shapes here are drawn by a thumb
 * on one screen of a city — they do not wrap the antimeridian, and pretending
 * to handle a case the UI cannot produce would be untested code either way.
 */
export function isPointInArea(point: GeoPoint, area: GeoArea): boolean {
  if (!isFiniteLatLng(point)) return false;
  const { lat, lng } = point;
  let inside = false;
  for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
    const a = area[i];
    const b = area[j];
    const straddles = a.lat > lat !== b.lat > lat;
    if (!straddles) continue;
    const x = ((b.lng - a.lng) * (lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (lng < x) inside = !inside;
  }
  return inside;
}

/**
 * Keep only what falls inside the shape.
 *
 * Generic over the marker type on purpose: the map plots several shapes of
 * thing and none of them should have to know about this file.
 */
export function filterByArea<T extends GeoPoint>(
  points: readonly T[],
  area: GeoArea | null | undefined,
): T[] {
  if (!area || !isUsableArea(area)) return [...points];
  return points.filter((p) => isPointInArea(p, area));
}

/**
 * How many listings can HONESTLY be claimed for a drawn shape.
 *
 * A cluster is one dot standing for many listings, and the server places it at
 * the centroid of what it holds. A cluster whose centre lands inside the shape
 * can still contain listings outside it, so adding cluster counts up would
 * produce a number nothing can prove — the exact class of claim the honesty
 * guards in this repo exist to stop.
 *
 * So the count is only exact when every marker inside the shape is a single
 * listing. Otherwise `exact` is false and the caller must say "at least",
 * never a bare number. Zooming in resolves clusters into single pins, which is
 * what makes the honest number reachable rather than merely withheld.
 */
export function areaCount<T extends GeoPoint & { count?: number }>(
  markers: readonly T[],
  area: GeoArea | null | undefined,
): { total: number; exact: boolean } {
  const inside = filterByArea(markers, area);
  let total = 0;
  let exact = true;
  for (const m of inside) {
    const c = typeof m.count === "number" && m.count > 0 ? m.count : 1;
    if (c > 1) exact = false;
    total += c;
  }
  return { total, exact };
}
