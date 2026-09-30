import { Page, Pagination } from "../../core/http/Pagination";
import { SqlExecutor } from "../../database/SqlExecutor";
import { GeoMath, GeoPoint } from "../../shared/geo/GeoPoint";
import { Money } from "../../shared/utils/Money";
import { RowParser } from "../../shared/utils/RowParser";
import {
  Order,
  ORDER_STATUSES,
  OrderCreateInput,
  OrderFilter,
  OrderQuery,
  OrderStatus,
  OrderSummary,
  OrderUpdateInput,
  OrderWithDistance,
} from "./Order";

interface OrderRow {
  id: number;
  customer_id: number;
  delivery_date: string;
  boxes: number;
  unit_price: number;
  status: OrderStatus;
  note: string;
  is_simulated: number;
  plan_id: number | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export class OrderRepository {
  private static readonly SELECT = `SELECT o.*, c.first_name, c.last_name, c.phone, c.address, c.latitude, c.longitude
    FROM orders o INNER JOIN customers c ON c.id = o.customer_id`;

  private static readonly UPDATE_COLUMNS: Record<keyof OrderUpdateInput, string> = {
    customerId: "customer_id",
    deliveryDate: "delivery_date",
    boxes: "boxes",
    note: "note",
    status: "status",
  };

  constructor(private readonly db: SqlExecutor) {}

  withExecutor(executor: SqlExecutor): OrderRepository {
    return new OrderRepository(executor);
  }

  async findPage(query: OrderQuery): Promise<Page<Order>> {
    const { where, params } = this.buildWhere(query);
    if (query.customerId) {
      where.push("o.customer_id = ?");
      params.push(query.customerId);
    }
    if (query.search) {
      const like = `%${query.search}%`;
      where.push("(c.first_name LIKE ? OR c.last_name LIKE ? OR CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.phone LIKE ?)");
      params.push(like, like, like, like);
    }
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [countRow] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM orders o INNER JOIN customers c ON c.id = o.customer_id ${clause}`,
      params,
    );
    const rows = await this.db.query<OrderRow>(
      `${OrderRepository.SELECT} ${clause} ORDER BY o.delivery_date DESC, o.id ASC LIMIT ? OFFSET ?`,
      [...params, query.limit, Pagination.offset(query)],
    );

    return {
      items: rows.map((row) => this.map(row)),
      total: Number(countRow?.total ?? 0),
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: number): Promise<Order | null> {
    const rows = await this.db.query<OrderRow>(`${OrderRepository.SELECT} WHERE o.id = ?`, [id]);
    return rows.length > 0 ? this.map(rows[0]) : null;
  }

  async findByIds(ids: number[]): Promise<Order[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db.query<OrderRow>(`${OrderRepository.SELECT} WHERE o.id IN (?) ORDER BY o.id ASC`, [ids]);
    return rows.map((row) => this.map(row));
  }

  async findByFilter(filter: OrderFilter): Promise<Order[]> {
    const { where, params } = this.buildWhere(filter);
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await this.db.query<OrderRow>(`${OrderRepository.SELECT} ${clause} ORDER BY o.id ASC`, params);
    return rows.map((row) => this.map(row));
  }

  async findNearby(center: GeoPoint, radiusKm: number, filter: OrderFilter): Promise<OrderWithDistance[]> {
    const { where, params } = this.buildWhere(filter);
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const distance = GeoMath.sqlDistanceExpression("c.latitude", "c.longitude");
    const rows = await this.db.query<OrderRow>(
      `SELECT * FROM (
         SELECT o.*, c.first_name, c.last_name, c.phone, c.address, c.latitude, c.longitude, ${distance} AS distance_km
         FROM orders o INNER JOIN customers c ON c.id = o.customer_id ${clause}
       ) AS ranked WHERE distance_km <= ? ORDER BY distance_km ASC, id ASC`,
      [center.latitude, center.latitude, center.longitude, ...params, radiusKm],
    );
    return rows.map((row) => ({ ...this.map(row), distanceKm: GeoMath.round(Number(row.distance_km), 3) }));
  }

  async countByCustomer(customerId: number, statuses?: OrderStatus[]): Promise<number> {
    const params: unknown[] = [customerId];
    let sql = "SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?";
    if (statuses && statuses.length > 0) {
      sql += " AND status IN (?)";
      params.push(statuses);
    }
    const [row] = await this.db.query<{ total: number }>(sql, params);
    return Number(row?.total ?? 0);
  }

  async create(input: OrderCreateInput): Promise<number> {
    const result = await this.db.execute(
      "INSERT INTO orders (customer_id, delivery_date, boxes, unit_price, note, is_simulated) VALUES (?, ?, ?, ?, ?, ?)",
      [input.customerId, input.deliveryDate, input.boxes, input.unitPrice, input.note, input.simulated ? 1 : 0],
    );
    return result.insertId;
  }

  async createMany(inputs: OrderCreateInput[]): Promise<number> {
    if (inputs.length === 0) {
      return 0;
    }
    const result = await this.db.execute(
      "INSERT INTO orders (customer_id, delivery_date, boxes, unit_price, note, is_simulated) VALUES ?",
      [
        inputs.map((input) => [
          input.customerId,
          input.deliveryDate,
          input.boxes,
          input.unitPrice,
          input.note,
          input.simulated ? 1 : 0,
        ]),
      ],
    );
    return result.affectedRows;
  }

  async update(id: number, changes: OrderUpdateInput): Promise<void> {
    const assignments: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(OrderRepository.UPDATE_COLUMNS)) {
      const value = changes[key as keyof OrderUpdateInput];
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value);
      }
    }
    if (changes.status && changes.status !== "delivered") {
      assignments.push("delivered_at = NULL");
    }
    if (changes.status === "delivered") {
      assignments.push("delivered_at = COALESCE(delivered_at, UTC_TIMESTAMP())");
    }
    if (assignments.length === 0) {
      return;
    }
    await this.db.execute(`UPDATE orders SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
  }

  async assignToPlan(ids: number[], planId: number): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await this.db.execute(
      "UPDATE orders SET status = 'assigned', plan_id = ? WHERE id IN (?) AND status = 'pending'",
      [planId, ids],
    );
    return result.affectedRows;
  }

  async releaseFromPlans(planIds: number[]): Promise<number> {
    if (planIds.length === 0) {
      return 0;
    }
    const result = await this.db.execute(
      "UPDATE orders SET status = 'pending', plan_id = NULL WHERE plan_id IN (?) AND status = 'assigned'",
      [planIds],
    );
    return result.affectedRows;
  }

  async releaseFromPlan(planId: number): Promise<number> {
    const result = await this.db.execute(
      "UPDATE orders SET status = 'pending', plan_id = NULL WHERE plan_id = ? AND status = 'assigned'",
      [planId],
    );
    return result.affectedRows;
  }

  async markDelivered(id: number): Promise<void> {
    await this.db.execute(
      "UPDATE orders SET status = 'delivered', delivered_at = UTC_TIMESTAMP() WHERE id = ? AND status <> 'cancelled'",
      [id],
    );
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM orders WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async deleteByFilter(filter: OrderFilter): Promise<number> {
    const { where, params } = OrderRepository.filterSql(filter, "orders");
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const result = await this.db.execute(`DELETE FROM orders ${clause}`, params);
    return result.affectedRows;
  }

  async deleteByCustomer(customerId: number): Promise<number> {
    const result = await this.db.execute("DELETE FROM orders WHERE customer_id = ?", [customerId]);
    return result.affectedRows;
  }

  async summarize(deliveryDate?: string): Promise<OrderSummary> {
    const params: unknown[] = [];
    let clause = "";
    if (deliveryDate) {
      clause = "WHERE delivery_date = ?";
      params.push(deliveryDate);
    }
    const rows = await this.db.query<{ status: OrderStatus; orders: number; boxes: number; revenue: number }>(
      `SELECT status, COUNT(*) AS orders, COALESCE(SUM(boxes), 0) AS boxes, COALESCE(SUM(boxes * unit_price), 0) AS revenue
       FROM orders ${clause} GROUP BY status`,
      params,
    );

    const byStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, { orders: 0, boxes: 0 }])) as OrderSummary["byStatus"];
    let totalOrders = 0;
    let totalBoxes = 0;
    let totalRevenue = 0;
    for (const row of rows) {
      const orders = Number(row.orders);
      const boxes = Number(row.boxes);
      if (byStatus[row.status]) {
        byStatus[row.status] = { orders, boxes };
      }
      if (row.status !== "cancelled") {
        totalOrders += orders;
        totalBoxes += boxes;
        totalRevenue += Number(row.revenue);
      }
    }

    return {
      deliveryDate: deliveryDate ?? null,
      totalOrders,
      totalBoxes,
      totalRevenue: Money.round(totalRevenue),
      byStatus,
    };
  }

  static filterSql(filter: OrderFilter, alias: string): { where: string[]; params: unknown[] } {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.deliveryDate) {
      where.push(`${alias}.delivery_date = ?`);
      params.push(filter.deliveryDate);
    }
    if (filter.status) {
      where.push(`${alias}.status = ?`);
      params.push(filter.status);
    }
    if (filter.simulated !== undefined) {
      where.push(`${alias}.is_simulated = ?`);
      params.push(filter.simulated ? 1 : 0);
    }
    return { where, params };
  }

  private buildWhere(filter: OrderFilter): { where: string[]; params: unknown[] } {
    return OrderRepository.filterSql(filter, "o");
  }

  private map(row: OrderRow): Order {
    const boxes = Number(row.boxes);
    const unitPrice = Number(row.unit_price);
    return {
      id: Number(row.id),
      customerId: Number(row.customer_id),
      customer: {
        id: Number(row.customer_id),
        fullName: `${row.first_name} ${row.last_name}`.trim(),
        phone: row.phone,
        address: row.address,
        location: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
      },
      deliveryDate: String(row.delivery_date),
      boxes,
      unitPrice,
      totalPrice: Money.round(boxes * unitPrice),
      status: row.status,
      note: row.note,
      simulated: RowParser.bool(row.is_simulated),
      planId: row.plan_id === null ? null : Number(row.plan_id),
      deliveredAt: RowParser.date(row.delivered_at),
      createdAt: RowParser.date(row.created_at),
      updatedAt: RowParser.date(row.updated_at),
    };
  }
}
