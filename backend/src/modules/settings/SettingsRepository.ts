import { SqlExecutor } from "../../database/SqlExecutor";
import { RowParser } from "../../shared/utils/RowParser";
import { ShopSettings, ShopSettingsUpdate } from "./ShopSettings";

interface SettingsRow {
  shop_name: string;
  shop_address: string;
  shop_latitude: number;
  shop_longitude: number;
  box_price: number;
  box_cost: number;
  rider_base_fee: number;
  rider_fee_per_km_per_box: number;
  rider_speed_kmh: number;
  max_orders_per_rider: number;
  max_boxes_per_order: number;
  departure_time: string;
  delivery_window_minutes: number;
  service_minutes_per_stop: number;
  road_distance_factor: number;
  service_radius_km: number;
  updated_at: Date;
}

export class SettingsRepository {
  private static readonly COLUMN_MAP: Record<string, string> = {
    shopName: "shop_name",
    shopAddress: "shop_address",
    boxPrice: "box_price",
    boxCost: "box_cost",
    riderBaseFee: "rider_base_fee",
    riderFeePerKmPerBox: "rider_fee_per_km_per_box",
    riderSpeedKmh: "rider_speed_kmh",
    maxOrdersPerRider: "max_orders_per_rider",
    maxBoxesPerOrder: "max_boxes_per_order",
    departureTime: "departure_time",
    deliveryWindowMinutes: "delivery_window_minutes",
    serviceMinutesPerStop: "service_minutes_per_stop",
    roadDistanceFactor: "road_distance_factor",
    serviceRadiusKm: "service_radius_km",
  };

  constructor(private readonly db: SqlExecutor) {}

  async get(): Promise<ShopSettings | null> {
    const rows = await this.db.query<SettingsRow>("SELECT * FROM settings WHERE id = 1");
    return rows.length > 0 ? this.map(rows[0]) : null;
  }

  async ensureExists(): Promise<void> {
    await this.db.execute("INSERT IGNORE INTO settings (id) VALUES (1)");
  }

  async update(changes: ShopSettingsUpdate): Promise<void> {
    const assignments: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(SettingsRepository.COLUMN_MAP)) {
      const value = changes[key as keyof ShopSettingsUpdate];
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value);
      }
    }

    if (changes.shopLocation) {
      assignments.push("shop_latitude = ?", "shop_longitude = ?");
      values.push(changes.shopLocation.latitude, changes.shopLocation.longitude);
    }

    if (assignments.length === 0) {
      return;
    }

    await this.db.execute(`UPDATE settings SET ${assignments.join(", ")} WHERE id = 1`, values);
  }

  private map(row: SettingsRow): ShopSettings {
    return {
      shopName: row.shop_name,
      shopAddress: row.shop_address,
      shopLocation: { latitude: Number(row.shop_latitude), longitude: Number(row.shop_longitude) },
      boxPrice: Number(row.box_price),
      boxCost: Number(row.box_cost),
      riderBaseFee: Number(row.rider_base_fee),
      riderFeePerKmPerBox: Number(row.rider_fee_per_km_per_box),
      riderSpeedKmh: Number(row.rider_speed_kmh),
      maxOrdersPerRider: Number(row.max_orders_per_rider),
      maxBoxesPerOrder: Number(row.max_boxes_per_order),
      departureTime: row.departure_time,
      deliveryWindowMinutes: Number(row.delivery_window_minutes),
      serviceMinutesPerStop: Number(row.service_minutes_per_stop),
      roadDistanceFactor: Number(row.road_distance_factor),
      serviceRadiusKm: Number(row.service_radius_km),
      updatedAt: RowParser.date(row.updated_at),
    };
  }
}
