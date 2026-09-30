import { Page, Pagination } from "../../core/http/Pagination";
import { SqlExecutor } from "../../database/SqlExecutor";
import { MapLinkBuilder } from "../../shared/geo/MapLinkBuilder";
import { TimeOfDay } from "../../shared/time/TimeOfDay";
import { RowParser } from "../../shared/utils/RowParser";
import { PlannedRoute, PlanningParameters, PlanObjective, PlanSummary } from "../planning/PlanningTypes";
import { RouteColorPalette } from "../planning/RouteColorPalette";
import {
  DeliveryPlan,
  DeliveryPlanHeader,
  NewPlanRecord,
  PlanListQuery,
  PlanRoute,
  PlanSnapshot,
  PlanStatus,
  PlanStop,
  RouteStatus,
  StopStatus,
} from "./DeliveryPlan";

interface PlanRow {
  id: number;
  delivery_date: string;
  objective: PlanObjective;
  seed: number;
  revision: number;
  status: PlanStatus;
  departure_time: string;
  deadline_time: string;
  settings_snapshot: string;
  summary: string;
  signature: string;
  explored_signatures: string;
  created_at: Date;
  updated_at: Date;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  completed_at: Date | null;
}

interface RouteRow {
  id: number;
  plan_id: number;
  sequence: number;
  job_code: string;
  color: string;
  rider_id: number | null;
  status: RouteStatus;
  order_count: number;
  box_count: number;
  distance_km: number;
  duration_minutes: number;
  rider_fee: number;
  revenue: number;
  food_cost: number;
  profit: number;
  path: string;
  started_at: Date | null;
  completed_at: Date | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_plate: string | null;
}

interface StopRow {
  id: number;
  route_id: number;
  sequence: number;
  order_id: number | null;
  customer_id: number | null;
  customer_name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  boxes: number;
  leg_distance_km: number;
  cumulative_distance_km: number;
  arrival_minutes: number;
  eta: string;
  late: number;
  status: StopStatus;
  delivered_at: Date | null;
}

export interface RouteLocator {
  planId: number;
  routeId: number;
}

export class PlanRepository {
  private static readonly ROUTE_SELECT = `SELECT pr.*, r.name AS rider_name, r.phone AS rider_phone, r.vehicle_plate AS rider_plate
    FROM plan_routes pr LEFT JOIN riders r ON r.id = pr.rider_id`;

  constructor(private readonly db: SqlExecutor) {}

  withExecutor(executor: SqlExecutor): PlanRepository {
    return new PlanRepository(executor);
  }

  async insertPlan(record: NewPlanRecord): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO delivery_plans
        (delivery_date, objective, seed, revision, status, departure_time, deadline_time, settings_snapshot, summary, signature, explored_signatures)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.deliveryDate,
        record.objective,
        record.seed,
        record.revision,
        record.status,
        record.departureTime,
        record.deadlineTime,
        JSON.stringify(record.snapshot),
        JSON.stringify(record.summary),
        record.signature,
        JSON.stringify(record.exploredSignatures),
      ],
    );
    return result.insertId;
  }

  async replacePlanResult(id: number, record: NewPlanRecord): Promise<void> {
    await this.db.execute(
      `UPDATE delivery_plans SET objective = ?, seed = ?, revision = ?, departure_time = ?, deadline_time = ?,
        settings_snapshot = ?, summary = ?, signature = ?, explored_signatures = ? WHERE id = ?`,
      [
        record.objective,
        record.seed,
        record.revision,
        record.departureTime,
        record.deadlineTime,
        JSON.stringify(record.snapshot),
        JSON.stringify(record.summary),
        record.signature,
        JSON.stringify(record.exploredSignatures),
        id,
      ],
    );
    await this.db.execute("DELETE FROM plan_routes WHERE plan_id = ?", [id]);
  }

  async insertRoutes(planId: number, routes: PlannedRoute[], jobCodes: string[]): Promise<void> {
    for (const [index, route] of routes.entries()) {
      const result = await this.db.execute(
        `INSERT INTO plan_routes
          (plan_id, sequence, job_code, color, order_count, box_count, distance_km, duration_minutes, rider_fee, revenue, food_cost, profit, path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          planId,
          route.sequence,
          jobCodes[index],
          route.color,
          route.orderCount,
          route.boxCount,
          route.distanceKm,
          route.durationMinutes,
          route.riderFee,
          route.revenue,
          route.foodCost,
          route.profit,
          JSON.stringify(route.path),
        ],
      );
      if (route.stops.length === 0) {
        continue;
      }
      await this.db.execute(
        `INSERT INTO plan_stops
          (route_id, sequence, order_id, customer_id, customer_name, phone, address, latitude, longitude, boxes,
           leg_distance_km, cumulative_distance_km, arrival_minutes, eta, late)
         VALUES ?`,
        [
          route.stops.map((stop) => [
            result.insertId,
            stop.sequence,
            stop.orderId,
            stop.customerId,
            stop.customerName,
            stop.phone,
            stop.address,
            stop.location.latitude,
            stop.location.longitude,
            stop.boxes,
            stop.legDistanceKm,
            stop.cumulativeDistanceKm,
            stop.arrivalMinutes,
            stop.eta,
            stop.late ? 1 : 0,
          ]),
        ],
      );
    }
  }

  async findTakenJobCodes(codes: string[]): Promise<Set<string>> {
    if (codes.length === 0) {
      return new Set();
    }
    const rows = await this.db.query<{ job_code: string }>("SELECT job_code FROM plan_routes WHERE job_code IN (?)", [codes]);
    return new Set(rows.map((row) => row.job_code));
  }

  async findPage(query: PlanListQuery): Promise<Page<DeliveryPlanHeader>> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.deliveryDate) {
      where.push("delivery_date = ?");
      params.push(query.deliveryDate);
    }
    if (query.status) {
      where.push("status = ?");
      params.push(query.status);
    }
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const [countRow] = await this.db.query<{ total: number }>(`SELECT COUNT(*) AS total FROM delivery_plans ${clause}`, params);
    const rows = await this.db.query<PlanRow>(
      `SELECT * FROM delivery_plans ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, query.limit, Pagination.offset(query)],
    );
    return {
      items: rows.map((row) => this.mapHeader(row)),
      total: Number(countRow?.total ?? 0),
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: number): Promise<DeliveryPlan | null> {
    const rows = await this.db.query<PlanRow>("SELECT * FROM delivery_plans WHERE id = ?", [id]);
    if (rows.length === 0) {
      return null;
    }
    const routeRows = await this.db.query<RouteRow>(
      `${PlanRepository.ROUTE_SELECT} WHERE pr.plan_id = ? ORDER BY pr.sequence ASC`,
      [id],
    );
    return this.assemble(rows[0], routeRows);
  }

  async findLatest(deliveryDate: string, statuses: PlanStatus[]): Promise<DeliveryPlan | null> {
    const rows = await this.db.query<{ id: number }>(
      "SELECT id FROM delivery_plans WHERE delivery_date = ? AND status IN (?) ORDER BY id DESC LIMIT 1",
      [deliveryDate, statuses],
    );
    return rows.length > 0 ? this.findById(Number(rows[0].id)) : null;
  }

  async findExploredSignatures(id: number): Promise<string[]> {
    const rows = await this.db.query<{ explored_signatures: string }>(
      "SELECT explored_signatures FROM delivery_plans WHERE id = ?",
      [id],
    );
    return rows.length > 0 ? RowParser.json<string[]>(rows[0].explored_signatures, []) : [];
  }

  async findLocatorByJobCode(jobCode: string): Promise<RouteLocator | null> {
    const rows = await this.db.query<{ id: number; plan_id: number }>(
      "SELECT id, plan_id FROM plan_routes WHERE job_code = ?",
      [jobCode],
    );
    return rows.length > 0 ? { planId: Number(rows[0].plan_id), routeId: Number(rows[0].id) } : null;
  }

  async findDraftIdsByDate(deliveryDate: string, excludeId: number): Promise<number[]> {
    const rows = await this.db.query<{ id: number }>(
      "SELECT id FROM delivery_plans WHERE delivery_date = ? AND status = 'draft' AND id <> ?",
      [deliveryDate, excludeId],
    );
    return rows.map((row) => Number(row.id));
  }

  async setStatus(id: number, status: PlanStatus): Promise<void> {
    const timestampColumn: Partial<Record<PlanStatus, string>> = {
      confirmed: "confirmed_at",
      cancelled: "cancelled_at",
      completed: "completed_at",
    };
    const column = timestampColumn[status];
    const extra = column ? `, ${column} = UTC_TIMESTAMP()` : "";
    await this.db.execute(`UPDATE delivery_plans SET status = ?${extra} WHERE id = ?`, [status, id]);
  }

  async cancelMany(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.db.execute(
      "UPDATE delivery_plans SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP() WHERE id IN (?)",
      [ids],
    );
  }

  async assignRider(routeId: number, riderId: number | null): Promise<void> {
    await this.db.execute("UPDATE plan_routes SET rider_id = ? WHERE id = ?", [riderId, routeId]);
  }

  async setRouteStatus(routeId: number, status: RouteStatus): Promise<void> {
    const extra =
      status === "in_progress"
        ? ", started_at = COALESCE(started_at, UTC_TIMESTAMP())"
        : status === "completed"
          ? ", started_at = COALESCE(started_at, UTC_TIMESTAMP()), completed_at = UTC_TIMESTAMP()"
          : ", started_at = NULL, completed_at = NULL";
    await this.db.execute(`UPDATE plan_routes SET status = ?${extra} WHERE id = ?`, [status, routeId]);
  }

  async setStopStatus(stopId: number, status: StopStatus): Promise<void> {
    const extra = status === "delivered" ? "UTC_TIMESTAMP()" : "NULL";
    await this.db.execute(`UPDATE plan_stops SET status = ?, delivered_at = ${extra} WHERE id = ?`, [status, stopId]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM delivery_plans WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async deleteByDate(deliveryDate?: string): Promise<number> {
    const result = deliveryDate
      ? await this.db.execute("DELETE FROM delivery_plans WHERE delivery_date = ?", [deliveryDate])
      : await this.db.execute("DELETE FROM delivery_plans");
    return result.affectedRows;
  }

  private async assemble(row: PlanRow, routeRows: RouteRow[]): Promise<DeliveryPlan> {
    const header = this.mapHeader(row);
    const snapshot = RowParser.json<PlanSnapshot>(row.settings_snapshot, {} as PlanSnapshot);
    const routeIds = routeRows.map((route) => Number(route.id));
    const stopRows =
      routeIds.length > 0
        ? await this.db.query<StopRow>("SELECT * FROM plan_stops WHERE route_id IN (?) ORDER BY route_id ASC, sequence ASC", [
            routeIds,
          ])
        : [];

    const stopsByRoute = new Map<number, StopRow[]>();
    for (const stop of stopRows) {
      const list = stopsByRoute.get(Number(stop.route_id)) ?? [];
      list.push(stop);
      stopsByRoute.set(Number(stop.route_id), list);
    }

    return {
      ...header,
      parameters: snapshot.parameters,
      routes: routeRows.map((route) =>
        this.mapRoute(route, stopsByRoute.get(Number(route.id)) ?? [], snapshot.parameters),
      ),
    };
  }

  private mapHeader(row: PlanRow): DeliveryPlanHeader {
    const snapshot = RowParser.json<PlanSnapshot>(row.settings_snapshot, {} as PlanSnapshot);
    return {
      id: Number(row.id),
      deliveryDate: String(row.delivery_date),
      objective: row.objective,
      seed: Number(row.seed),
      revision: Number(row.revision),
      status: row.status,
      departureTime: row.departure_time,
      deadlineTime: row.deadline_time,
      signature: row.signature,
      summary: RowParser.json<PlanSummary>(row.summary, {} as PlanSummary),
      shop: { name: snapshot.shopName, location: snapshot.parameters?.depot },
      createdAt: RowParser.date(row.created_at),
      updatedAt: RowParser.date(row.updated_at),
      confirmedAt: RowParser.date(row.confirmed_at),
      cancelledAt: RowParser.date(row.cancelled_at),
      completedAt: RowParser.date(row.completed_at),
    };
  }

  private mapRoute(row: RouteRow, stopRows: StopRow[], params: PlanningParameters): PlanRoute {
    const sequence = Number(row.sequence);
    const durationMinutes = Number(row.duration_minutes);
    const stops = stopRows.map((stop) => this.mapStop(stop));
    return {
      id: Number(row.id),
      planId: Number(row.plan_id),
      sequence,
      jobCode: row.job_code,
      color: row.color,
      colorName: RouteColorPalette.at(sequence - 1).name,
      status: row.status,
      rider:
        row.rider_id === null
          ? null
          : {
              id: Number(row.rider_id),
              name: row.rider_name ?? "",
              phone: row.rider_phone ?? "",
              vehiclePlate: row.rider_plate ?? "",
            },
      orderCount: Number(row.order_count),
      boxCount: Number(row.box_count),
      distanceKm: Number(row.distance_km),
      durationMinutes,
      finishTime: TimeOfDay.parse(params.departureTime).addMinutes(Math.ceil(durationMinutes)).toString(),
      riderFee: Number(row.rider_fee),
      revenue: Number(row.revenue),
      foodCost: Number(row.food_cost),
      profit: Number(row.profit),
      lateStops: stops.filter((stop) => stop.late).length,
      stops,
      path: RowParser.json(row.path, []),
      navigationUrl: MapLinkBuilder.route(
        params.depot,
        stops.map((stop) => stop.location),
      ),
      startedAt: RowParser.date(row.started_at),
      completedAt: RowParser.date(row.completed_at),
    };
  }

  private mapStop(row: StopRow): PlanStop {
    const location = { latitude: Number(row.latitude), longitude: Number(row.longitude) };
    return {
      id: Number(row.id),
      sequence: Number(row.sequence),
      orderId: row.order_id === null ? null : Number(row.order_id),
      customerId: row.customer_id === null ? null : Number(row.customer_id),
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      location,
      boxes: Number(row.boxes),
      legDistanceKm: Number(row.leg_distance_km),
      cumulativeDistanceKm: Number(row.cumulative_distance_km),
      arrivalMinutes: Number(row.arrival_minutes),
      eta: row.eta,
      late: RowParser.bool(row.late),
      mapUrl: MapLinkBuilder.navigate(location),
      status: row.status,
      deliveredAt: RowParser.date(row.delivered_at),
    };
  }
}
