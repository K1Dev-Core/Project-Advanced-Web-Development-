import { HttpError } from "../../core/errors/HttpError";
import { SqlExecutor } from "../../database/SqlExecutor";
import { OrderRepository } from "../orders/OrderRepository";
import { SettingsService } from "../settings/SettingsService";
import { RowParser } from "../../shared/utils/RowParser";

export interface TrackingSnapshot {
  reference: string;
  status: string;
  boxes: number;
  deliveryDate: string;
  updatedAt: string | null;
  deliveredAt: string | null;
  recipient: {
    displayName: string;
    location: { latitude: number; longitude: number };
  };
  origin: { name: string; location: { latitude: number; longitude: number } };
  schedule: {
    eta: string | null;
    departureTime: string | null;
    deadlineTime: string | null;
    late: boolean;
  };
  routeStatus: string | null;
  riderName: string | null;
}
export class TrackingService {
  constructor(
    private readonly database: SqlExecutor,
    private readonly orders: Pick<OrderRepository, "findByTrackingCode">,
    private readonly settings: Pick<SettingsService, "get">,
  ) {}
  async get(code: string): Promise<TrackingSnapshot> {
    if (!/^[a-f0-9]{48}$/.test(code))
      throw HttpError.notFound("ไม่พบลิงก์ติดตามนี้", "TRACKING_NOT_FOUND");
    const order = await this.orders.findByTrackingCode(code);
    if (!order)
      throw HttpError.notFound("ไม่พบลิงก์ติดตามนี้", "TRACKING_NOT_FOUND");
    const settings = await this.settings.get();
    const rows = order.planId
      ? await this.database.query<{
          eta: string;
          late: number;
          departure_time: string;
          deadline_time: string;
          route_status: string;
          rider_name: string | null;
        }>(
          `SELECT ps.eta,ps.late,p.departure_time,p.deadline_time,pr.status AS route_status,r.name AS rider_name
    FROM plan_stops ps INNER JOIN plan_routes pr ON pr.id=ps.route_id
    INNER JOIN delivery_plans p ON p.id=pr.plan_id LEFT JOIN riders r ON r.id=pr.rider_id
    WHERE ps.order_id=? AND p.id=? AND p.status IN ('confirmed','completed') LIMIT 1`,
          [order.id, order.planId],
        )
      : [];
    const route = rows[0];
    return {
      reference: `SS${order.id}`,
      status: order.status,
      boxes: order.boxes,
      deliveryDate: order.deliveryDate,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      recipient: {
        displayName: "คุณ" + order.customer.fullName.split(" ")[0],
        location: order.customer.location,
      },
      origin: { name: settings.shopName, location: settings.shopLocation },
      schedule: {
        eta: route?.eta || null,
        departureTime: route?.departure_time || null,
        deadlineTime: route?.deadline_time || null,
        late: route ? RowParser.bool(route.late) : false,
      },
      routeStatus: route?.route_status || null,
      riderName: route?.rider_name || null,
    };
  }
}
