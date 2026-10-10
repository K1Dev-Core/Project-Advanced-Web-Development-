import { GeoMath } from "../../shared/geo/GeoPoint";
import { MapLinkBuilder } from "../../shared/geo/MapLinkBuilder";
import { TimeOfDay } from "../../shared/time/TimeOfDay";
import { Money } from "../../shared/utils/Money";
import {
  DeliveryRequest,
  PlanningParameters,
  PlannedRoute,
  PlannedStop,
  PlanObjective,
  PlanProposal,
  PlanSummary,
} from "./PlanningTypes";
import { DistanceSource } from "../routing/RoutingProvider";
import { RouteColorPalette } from "./RouteColorPalette";
import { RouteEvaluation } from "./RouteEvaluation";

export class PlanBuilder {
  constructor(
    private readonly requests: DeliveryRequest[],
    private readonly params: PlanningParameters,
    private readonly distanceSource: DistanceSource,
  ) {}

  build(evaluations: RouteEvaluation[], objective: PlanObjective, seed: number, score: number): PlanProposal {
    const ordered = [...evaluations].sort((a, b) => this.bearing(a) - this.bearing(b));
    const routes = ordered.map((evaluation, index) => this.buildRoute(evaluation, index));
    return {
      objective,
      seed,
      score: Money.round(score),
      signature: PlanBuilder.signature(routes.map((route) => route.stops.map((stop) => stop.orderId))),
      summary: PlanBuilder.summarize(routes, this.params, this.distanceSource),
      routes,
    };
  }

  static signature(routes: number[][]): string {
    return routes
      .map((route) => [...route].sort((a, b) => a - b).join("-"))
      .sort()
      .join("|");
  }

  static summarize(routes: PlannedRoute[], params: PlanningParameters, distanceSource: DistanceSource): PlanSummary {
    const stops = routes.flatMap((route) => route.stops);
    const boxCount = routes.reduce((sum, route) => sum + route.boxCount, 0);
    const revenue = Money.round(boxCount * params.boxPrice);
    const foodCost = Money.round(boxCount * params.boxCost);
    const totalRiderFee = Money.sum(routes.map((route) => route.riderFee));
    const grossProfit = Money.round(revenue - foodCost);
    const netProfit = Money.round(grossProfit - totalRiderFee);
    const latestArrivalMinutes = stops.reduce((max, stop) => Math.max(max, stop.arrivalMinutes), 0);
    const averageArrivalMinutes =
      stops.length > 0 ? stops.reduce((sum, stop) => sum + stop.arrivalMinutes, 0) / stops.length : 0;
    const lateStops = stops.filter((stop) => stop.late).length;
    const departure = TimeOfDay.parse(params.departureTime);

    return {
      distanceSource,
      riderCount: routes.length,
      orderCount: stops.length,
      boxCount,
      totalDistanceKm: GeoMath.round(routes.reduce((sum, route) => sum + route.distanceKm, 0), 2),
      totalRiderFee,
      revenue,
      foodCost,
      grossProfit,
      netProfit,
      profitMarginPercent: revenue > 0 ? GeoMath.round((netProfit / revenue) * 100, 2) : 0,
      isProfitable: netProfit > 0,
      riderFeePerBox: boxCount > 0 ? Money.round(totalRiderFee / boxCount) : 0,
      departureTime: departure.toString(),
      deadlineTime: departure.addMinutes(params.deliveryWindowMinutes).toString(),
      latestArrivalTime: departure.addMinutes(Math.ceil(latestArrivalMinutes)).toString(),
      latestArrivalMinutes: GeoMath.round(latestArrivalMinutes, 1),
      averageArrivalMinutes: GeoMath.round(averageArrivalMinutes, 1),
      longestRouteMinutes: GeoMath.round(routes.reduce((max, route) => Math.max(max, route.durationMinutes), 0), 1),
      lateStops,
      onTime: lateStops === 0,
    };
  }

  private buildRoute(evaluation: RouteEvaluation, index: number): PlannedRoute {
    const color = RouteColorPalette.at(index);
    const departure = TimeOfDay.parse(this.params.departureTime);
    const stops: PlannedStop[] = evaluation.sequence.map((orderIndex, position) => {
      const request = this.requests[orderIndex];
      const arrival = evaluation.arrivals[position];
      return {
        sequence: position + 1,
        orderId: request.orderId,
        customerId: request.customerId,
        customerName: request.customerName,
        phone: request.phone,
        address: request.address,
        location: request.location,
        boxes: request.boxes,
        legDistanceKm: GeoMath.round(evaluation.legDistances[position], 3),
        cumulativeDistanceKm: GeoMath.round(evaluation.cumulativeDistances[position], 3),
        arrivalMinutes: GeoMath.round(arrival, 1),
        eta: departure.addMinutes(Math.ceil(arrival)).toString(),
        late: arrival > this.params.deliveryWindowMinutes + 1e-9,
        mapUrl: MapLinkBuilder.navigate(request.location),
      };
    });

    const revenue = Money.round(evaluation.boxes * this.params.boxPrice);
    const foodCost = Money.round(evaluation.boxes * this.params.boxCost);
    const riderFee = Money.round(evaluation.riderFee);
    const locations = stops.map((stop) => stop.location);

    return {
      sequence: index + 1,
      color: color.hex,
      colorName: color.name,
      orderCount: stops.length,
      boxCount: evaluation.boxes,
      distanceKm: GeoMath.round(evaluation.distanceKm, 3),
      durationMinutes: GeoMath.round(evaluation.durationMinutes, 1),
      finishTime: departure.addMinutes(Math.ceil(evaluation.durationMinutes)).toString(),
      riderFee,
      revenue,
      foodCost,
      profit: Money.round(revenue - foodCost - riderFee),
      lateStops: evaluation.lateStops,
      stops,
      path: [this.params.depot, ...locations],
      geometry: [this.params.depot, ...locations],
      navigationUrl: MapLinkBuilder.route(this.params.depot, locations),
    };
  }

  private bearing(evaluation: RouteEvaluation): number {
    const points = evaluation.sequence.map((orderIndex) => this.requests[orderIndex].location);
    const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
    const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
    const angle = Math.atan2(latitude - this.params.depot.latitude, longitude - this.params.depot.longitude);
    return (Math.PI / 2 - angle + 2 * Math.PI) % (2 * Math.PI);
  }
}
