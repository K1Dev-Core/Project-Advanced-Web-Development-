export interface RouteEvaluation {
  sequence: number[];
  boxes: number;
  legDistances: number[];
  cumulativeDistances: number[];
  arrivals: number[];
  distanceKm: number;
  durationMinutes: number;
  riderFee: number;
  lateMinutes: number;
  lateStops: number;
  sumArrivalMinutes: number;
  score: number;
}
