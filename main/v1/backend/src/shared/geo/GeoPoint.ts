export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export class GeoMath {
  static readonly EARTH_RADIUS_KM = 6371.0088;

  static haversineKm(from: GeoPoint, to: GeoPoint): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLng = toRadians(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * GeoMath.EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  static offset(origin: GeoPoint, distanceKm: number, bearingRadians: number): GeoPoint {
    const angular = distanceKm / GeoMath.EARTH_RADIUS_KM;
    const lat1 = (origin.latitude * Math.PI) / 180;
    const lng1 = (origin.longitude * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRadians),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearingRadians) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      );
    return {
      latitude: GeoMath.round((lat2 * 180) / Math.PI, 6),
      longitude: GeoMath.round((lng2 * 180) / Math.PI, 6),
    };
  }

  static round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  static sqlDistanceExpression(latColumn: string, lngColumn: string): string {
    return `(${GeoMath.EARTH_RADIUS_KM} * 2 * ASIN(LEAST(1, SQRT(POWER(SIN(RADIANS(${latColumn} - ?) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(${latColumn})) * POWER(SIN(RADIANS(${lngColumn} - ?) / 2), 2)))))`;
  }
}
