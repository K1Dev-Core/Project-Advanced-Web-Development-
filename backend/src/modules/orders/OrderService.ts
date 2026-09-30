import { HttpError } from "../../core/errors/HttpError";
import { Page } from "../../core/http/Pagination";
import { TransactionRunner } from "../../database/TransactionRunner";
import { GeoPoint } from "../../shared/geo/GeoPoint";
import { BusinessCalendar } from "../../shared/time/BusinessCalendar";
import { CustomerRepository } from "../customers/CustomerRepository";
import { PlanRepository } from "../plans/PlanRepository";
import { SettingsService } from "../settings/SettingsService";
import { Order, OrderFilter, OrderQuery, OrderStatus, OrderSummary, OrderUpdateInput, OrderWithDistance } from "./Order";
import { OrderRepository } from "./OrderRepository";

export interface OrderCreateRequest {
  customerId: number;
  boxes: number;
  deliveryDate?: string;
  note: string;
}

export interface ClearOrdersResult {
  deletedOrders: number;
  deletedPlans: number;
}

export class OrderService {
  private static readonly MANUAL_STATUSES: OrderStatus[] = ["pending", "cancelled", "delivered"];

  constructor(
    private readonly orders: OrderRepository,
    private readonly customers: CustomerRepository,
    private readonly plans: PlanRepository,
    private readonly settings: SettingsService,
    private readonly calendar: BusinessCalendar,
    private readonly transactions: TransactionRunner,
  ) {}

  list(query: OrderQuery): Promise<Page<Order>> {
    return this.orders.findPage(query);
  }

  async get(id: number): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw HttpError.notFound(`Order ${id} was not found`, "ORDER_NOT_FOUND");
    }
    return order;
  }

  nearby(center: GeoPoint, radiusKm: number, filter: OrderFilter): Promise<OrderWithDistance[]> {
    return this.orders.findNearby(center, radiusKm, filter);
  }

  summary(deliveryDate?: string): Promise<OrderSummary> {
    return this.orders.summarize(deliveryDate);
  }

  async create(request: OrderCreateRequest): Promise<Order> {
    const settings = await this.settings.get();
    await this.ensureCustomer(request.customerId);
    this.ensureBoxes(request.boxes, settings.maxBoxesPerOrder);

    const id = await this.orders.create({
      customerId: request.customerId,
      boxes: request.boxes,
      deliveryDate: this.calendar.resolve(request.deliveryDate),
      unitPrice: settings.boxPrice,
      note: request.note,
    });
    return this.get(id);
  }

  async update(id: number, changes: OrderUpdateInput): Promise<Order> {
    const order = await this.get(id);
    const settings = await this.settings.get();

    if (changes.status === "assigned") {
      throw HttpError.badRequest("Orders become assigned only by confirming a delivery plan", "INVALID_STATUS");
    }
    if (changes.status && !OrderService.MANUAL_STATUSES.includes(changes.status)) {
      throw HttpError.badRequest(`Status "${changes.status}" cannot be set manually`, "INVALID_STATUS");
    }

    const touchesRouting =
      changes.boxes !== undefined || changes.customerId !== undefined || changes.deliveryDate !== undefined;
    if (order.status === "assigned" && (touchesRouting || (changes.status && changes.status !== "delivered"))) {
      throw HttpError.conflict(
        "Order is assigned to a confirmed delivery plan. Cancel the plan before changing it.",
        "ORDER_LOCKED",
        { planId: order.planId },
      );
    }
    if (order.status === "delivered" && touchesRouting) {
      throw HttpError.conflict("Delivered orders cannot be changed", "ORDER_LOCKED");
    }

    if (changes.customerId !== undefined) {
      await this.ensureCustomer(changes.customerId);
    }
    if (changes.boxes !== undefined) {
      this.ensureBoxes(changes.boxes, settings.maxBoxesPerOrder);
    }

    await this.orders.update(id, changes);
    return this.get(id);
  }

  async changeBoxes(id: number, change: { boxes: number } | { change: number }): Promise<Order> {
    const order = await this.get(id);
    const boxes = "boxes" in change ? change.boxes : order.boxes + change.change;
    if (boxes < 1) {
      throw HttpError.badRequest("An order must contain at least 1 box. Delete the order instead.", "INVALID_BOXES");
    }
    return this.update(id, { boxes });
  }

  async remove(id: number): Promise<{ id: number }> {
    const order = await this.get(id);
    if (order.status === "assigned") {
      throw HttpError.conflict(
        "Order is assigned to a confirmed delivery plan. Cancel the plan before deleting it.",
        "ORDER_LOCKED",
        { planId: order.planId },
      );
    }
    await this.orders.delete(id);
    return { id };
  }

  async clear(filter: OrderFilter): Promise<ClearOrdersResult> {
    if (filter.status === "assigned") {
      throw HttpError.conflict("Assigned orders are cleared together with their plans. Omit the status filter.", "ORDER_LOCKED");
    }

    return this.transactions.transaction(async (executor) => {
      const orders = this.orders.withExecutor(executor);
      const plans = this.plans.withExecutor(executor);

      const affectedPlans = await plans.findIdsReferencingOrders(filter);
      await orders.releaseFromPlans(affectedPlans);
      let deletedPlans = await plans.deleteMany(affectedPlans);

      if (!filter.status && filter.simulated === undefined) {
        deletedPlans += await plans.deleteByDate(filter.deliveryDate);
      }

      const deletedOrders = await orders.deleteByFilter(filter);
      return { deletedOrders, deletedPlans };
    });
  }

  private async ensureCustomer(customerId: number): Promise<void> {
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw HttpError.unprocessable(`Customer ${customerId} does not exist`, "CUSTOMER_NOT_FOUND");
    }
  }

  private ensureBoxes(boxes: number, max: number): void {
    if (boxes < 1 || boxes > max) {
      throw HttpError.unprocessable(`Boxes per order must be between 1 and ${max}`, "INVALID_BOXES", { max });
    }
  }
}
