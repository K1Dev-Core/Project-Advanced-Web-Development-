import { Page, Pagination } from "../../core/http/Pagination";
import { SqlExecutor } from "../../database/SqlExecutor";
import { GeoMath, GeoPoint } from "../../shared/geo/GeoPoint";
import { RowParser } from "../../shared/utils/RowParser";
import { Customer, CustomerInput, CustomerQuery, CustomerSortField, CustomerWithDistance } from "./Customer";

interface CustomerRow {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  note: string;
  is_simulated: number;
  created_at: Date;
  updated_at: Date;
  distance_km?: number;
}

export class CustomerRepository {
  private static readonly SORT_COLUMNS: Record<CustomerSortField, string> = {
    id: "id",
    name: "first_name, last_name",
    createdAt: "created_at",
  };

  constructor(private readonly db: SqlExecutor) {}

  withExecutor(executor: SqlExecutor): CustomerRepository {
    return new CustomerRepository(executor);
  }

  async findPage(query: CustomerQuery): Promise<Page<Customer>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.search) {
      const like = `%${query.search}%`;
      conditions.push(
        "(first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ? OR phone LIKE ? OR address LIKE ?)",
      );
      params.push(like, like, like, like, like);
    }
    if (query.firstName) {
      conditions.push("first_name LIKE ?");
      params.push(`%${query.firstName}%`);
    }
    if (query.lastName) {
      conditions.push("last_name LIKE ?");
      params.push(`%${query.lastName}%`);
    }
    if (query.simulated !== undefined) {
      conditions.push("is_simulated = ?");
      params.push(query.simulated ? 1 : 0);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const direction = query.order === "desc" ? "DESC" : "ASC";
    const orderBy = CustomerRepository.SORT_COLUMNS[query.sort]
      .split(",")
      .map((column) => `${column.trim()} ${direction}`)
      .join(", ");

    const [countRow] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM customers ${where}`,
      params,
    );
    const rows = await this.db.query<CustomerRow>(
      `SELECT * FROM customers ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, query.limit, Pagination.offset(query)],
    );

    return {
      items: rows.map((row) => this.map(row)),
      total: Number(countRow?.total ?? 0),
      page: query.page,
      limit: query.limit,
    };
  }

  async findAll(): Promise<Customer[]> {
    const rows = await this.db.query<CustomerRow>("SELECT * FROM customers ORDER BY id ASC");
    return rows.map((row) => this.map(row));
  }

  async findById(id: number): Promise<Customer | null> {
    const rows = await this.db.query<CustomerRow>("SELECT * FROM customers WHERE id = ?", [id]);
    return rows.length > 0 ? this.map(rows[0]) : null;
  }

  async findNearby(center: GeoPoint, radiusKm: number): Promise<CustomerWithDistance[]> {
    const distance = GeoMath.sqlDistanceExpression("latitude", "longitude");
    const rows = await this.db.query<CustomerRow>(
      `SELECT * FROM (SELECT customers.*, ${distance} AS distance_km FROM customers) AS ranked
       WHERE distance_km <= ? ORDER BY distance_km ASC`,
      [center.latitude, center.latitude, center.longitude, radiusKm],
    );
    return rows.map((row) => ({ ...this.map(row), distanceKm: GeoMath.round(Number(row.distance_km), 3) }));
  }

  async count(): Promise<number> {
    const [row] = await this.db.query<{ total: number }>("SELECT COUNT(*) AS total FROM customers");
    return Number(row?.total ?? 0);
  }

  async create(input: CustomerInput): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO customers (first_name, last_name, phone, address, latitude, longitude, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.firstName,
        input.lastName,
        input.phone,
        input.address,
        input.location.latitude,
        input.location.longitude,
        input.note,
      ],
    );
    return result.insertId;
  }

  async createMany(inputs: CustomerInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }
    await this.db.execute(
      "INSERT INTO customers (first_name, last_name, phone, address, latitude, longitude, note, is_simulated) VALUES ?",
      [
        inputs.map((input) => [
          input.firstName,
          input.lastName,
          input.phone,
          input.address,
          input.location.latitude,
          input.location.longitude,
          input.note,
          input.simulated ? 1 : 0,
        ]),
      ],
    );
  }

  async update(id: number, input: CustomerInput): Promise<boolean> {
    const result = await this.db.execute(
      `UPDATE customers SET first_name = ?, last_name = ?, phone = ?, address = ?, latitude = ?, longitude = ?, note = ?
       WHERE id = ?`,
      [
        input.firstName,
        input.lastName,
        input.phone,
        input.address,
        input.location.latitude,
        input.location.longitude,
        input.note,
        id,
      ],
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM customers WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async deleteSimulatedWithoutOrders(): Promise<number> {
    const result = await this.db.execute(
      `DELETE FROM customers WHERE is_simulated = 1
       AND NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id)`,
    );
    return result.affectedRows;
  }

  async deleteAll(): Promise<number> {
    const result = await this.db.execute("DELETE FROM customers");
    return result.affectedRows;
  }

  private map(row: CustomerRow): Customer {
    const firstName = row.first_name;
    const lastName = row.last_name;
    return {
      id: Number(row.id),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      phone: row.phone,
      address: row.address,
      location: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
      note: row.note,
      simulated: RowParser.bool(row.is_simulated),
      createdAt: RowParser.date(row.created_at),
      updatedAt: RowParser.date(row.updated_at),
    };
  }
}
