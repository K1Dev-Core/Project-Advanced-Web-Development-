import { GeoPoint } from "./GeoPoint";

export class MapLinkBuilder {
  private static readonly BASE = "https://www.google.com/maps";

  static place(point: GeoPoint): string {
    return `${MapLinkBuilder.BASE}/search/?api=1&query=${MapLinkBuilder.format(point)}`;
  }

  static navigate(destination: GeoPoint): string {
    return `${MapLinkBuilder.BASE}/dir/?api=1&destination=${MapLinkBuilder.format(destination)}&travelmode=driving`;
  }

  static route(origin: GeoPoint, stops: GeoPoint[]): string {
    if (stops.length === 0) {
      return MapLinkBuilder.place(origin);
    }
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(0, -1).map(MapLinkBuilder.format).join("|");
    const params = [
      "api=1",
      `origin=${MapLinkBuilder.format(origin)}`,
      `destination=${MapLinkBuilder.format(destination)}`,
      "travelmode=driving",
    ];
    if (waypoints) {
      params.push(`waypoints=${encodeURIComponent(waypoints)}`);
    }
    return `${MapLinkBuilder.BASE}/dir/?${params.join("&")}`;
  }

  private static format(point: GeoPoint): string {
    return `${point.latitude},${point.longitude}`;
  }
}
