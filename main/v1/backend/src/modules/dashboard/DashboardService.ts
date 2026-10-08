import { BusinessCalendar } from "../../shared/time/BusinessCalendar";
import { TimeOfDay } from "../../shared/time/TimeOfDay";
import { CustomerRepository } from "../customers/CustomerRepository";
import { OrderRepository } from "../orders/OrderRepository";
import { PlanRepository } from "../plans/PlanRepository";
import { RiderRepository } from "../riders/RiderRepository";
import { SettingsService } from "../settings/SettingsService";

export class DashboardService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly orders: OrderRepository,
    private readonly riders: RiderRepository,
    private readonly plans: PlanRepository,
    private readonly settings: SettingsService,
    private readonly calendar: BusinessCalendar,
  ) {}

  async overview(deliveryDate?: string) {
    const date = this.calendar.resolve(deliveryDate);
    const settings = await this.settings.get();
    const [customerCount, riderPage, orderSummary, plans] = await Promise.all([
      this.customers.count(),
      this.riders.findPage({ active: true, page: 1, limit: 1 }),
      this.orders.summarize(date),
      this.plans.findPage({ deliveryDate: date, page: 1, limit: 20 }),
    ]);

    const departure = TimeOfDay.parse(settings.departureTime);
    const activePlan =
      plans.items.find((plan) => plan.status === "confirmed" || plan.status === "completed") ??
      plans.items.find((plan) => plan.status === "draft") ??
      null;

    return {
      deliveryDate: date,
      shop: {
        name: settings.shopName,
        address: settings.shopAddress,
        location: settings.shopLocation,
        departureTime: departure.toString(),
        deadlineTime: departure.addMinutes(settings.deliveryWindowMinutes).toString(),
      },
      customers: { total: customerCount },
      riders: { active: riderPage.total },
      orders: orderSummary,
      plans: {
        total: plans.total,
        byStatus: plans.items.reduce<Record<string, number>>((acc, plan) => {
          acc[plan.status] = (acc[plan.status] ?? 0) + 1;
          return acc;
        }, {}),
        active: activePlan,
      },
    };
  }
}
