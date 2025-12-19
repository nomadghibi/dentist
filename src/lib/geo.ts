export interface Coordinates {
  lat: number;
  lng: number;
}

export const CITY_COORDINATES: Record<string, Coordinates> = {
  "palm-bay": { lat: 28.0345, lng: -80.5887 },
  "melbourne": { lat: 28.0836, lng: -80.6081 },
  "space-coast": { lat: 28.2639, lng: -80.7214 },
};

export function haversineDistanceMiles(a: Coordinates, b: Coordinates): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat +
          sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2)
      )
    );

  return R * c;
}

export function parseCoordinates(lat?: string | null, lng?: string | null): Coordinates | undefined {
  const parsedLat = lat ? Number.parseFloat(lat) : undefined;
  const parsedLng = lng ? Number.parseFloat(lng) : undefined;

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return undefined;
  }

  return { lat: parsedLat as number, lng: parsedLng as number };
}
