import { Page, Pagination } from "../../core/http/Pagination";
import { SqlExecutor } from "../../database/SqlExecutor";
import { RowParser } from "../../shared/utils/RowParser";
import { Rider, RiderInput, RiderQuery } from "./Rider";

interface RiderRow {
  id: number;
  name: string;
  phone: string;
  vehicle_plate: string;
  active: number;
  created_at: Date;
  updated_at: Date;
}

export class RiderRepository {
  constructor(private readonly db: SqlExecutor) {}

  async findPage(query: RiderQuery): Promise<Page<Rider>> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.search) {
      const like = `%${query.search}%`;
      where.push("(name LIKE ? OR phone LIKE ? OR vehicle_plate LIKE ?)");
      params.push(like, like, like);
    }
    if (query.active !== undefined) {
      where.push("active = ?");
      params.push(query.active ? 1 : 0);
    }
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [countRow] = await this.db.query<{ total: number }>(`SELECT COUNT(*) AS total FROM riders ${clause}`, params);
    const rows = await this.db.query<RiderRow>(`SELECT * FROM riders ${clause} ORDER BY id ASC LIMIT ? OFFSET ?`, [
      ...params,
      query.limit,
      Pagination.offset(query),
    ]);

    return {
      items: rows.map((row) => this.map(row)),
      total: Number(countRow?.total ?? 0),
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: number): Promise<Rider | null> {
    const rows = await this.db.query<RiderRow>("SELECT * FROM riders WHERE id = ?", [id]);
    return rows.length > 0 ? this.map(rows[0]) : null;
  }

  async create(input: RiderInput): Promise<number> {
    const result = await this.db.execute(
      "INSERT INTO riders (name, phone, vehicle_plate, active) VALUES (?, ?, ?, ?)",
      [input.name, input.phone, input.vehiclePlate, input.active ? 1 : 0],
    );
    return result.insertId;
  }

  async update(id: number, input: RiderInput): Promise<void> {
    await this.db.execute("UPDATE riders SET name = ?, phone = ?, vehicle_plate = ?, active = ? WHERE id = ?", [
      input.name,
      input.phone,
      input.vehiclePlate,
      input.active ? 1 : 0,
      id,
    ]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM riders WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async deleteAll(): Promise<number> {
    const result = await this.db.execute("DELETE FROM riders");
    return result.affectedRows;
  }

  withExecutor(executor: SqlExecutor): RiderRepository {
    return new RiderRepository(executor);
  }

  private map(row: RiderRow): Rider {
    return {
      id: Number(row.id),
      name: row.name,
      phone: row.phone,
      vehiclePlate: row.vehicle_plate,
      active: RowParser.bool(row.active),
      createdAt: RowParser.date(row.created_at),
      updatedAt: RowParser.date(row.updated_at),
    };
  }
}
