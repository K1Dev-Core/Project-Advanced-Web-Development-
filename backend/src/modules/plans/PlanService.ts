import { HttpError } from "../../core/errors/HttpError";
import { Page } from "../../core/http/Pagination";
import { TransactionRunner } from "../../database/TransactionRunner";
import { SeededRandom } from "../../shared/random/SeededRandom";
import { BusinessCalendar } from "../../shared/time/BusinessCalendar";
import { JobCodeGenerator } from "../../shared/utils/JobCodeGenerator";
import { Order } from "../orders/Order";
import { OrderRepository } from "../orders/OrderRepository";
import { DeliveryPlanner } from "../planning/DeliveryPlanner";
import { DistanceMatrix } from "../planning/DistanceMatrix";
import { ObjectiveFactory } from "../planning/objectives/ObjectiveFactory";
import { PlanningParametersFactory } from "../planning/PlanningParametersFactory";
import {
  DeliveryRequest,
  PlanningOptions,
  PlanningParameters,
  PlanObjective,
  PlanProposal,
} from "../planning/PlanningTypes";
import { RiderRepository } from "../riders/RiderRepository";
import { RoutingService } from "../routing/RoutingService";
import { SettingsService } from "../settings/SettingsService";
import { DeliveryPlan, DeliveryPlanHeader, PlanListQuery, PlanStatus } from "./DeliveryPlan";
import { PlanRepository } from "./PlanRepository";

export interface GeneratePlanRequest {
  deliveryDate?: string;
  objective: PlanObjective;
  seed?: number;
  alternatives: number;
  alternativeIndex: number;
  orderIds?: number[];
}

export interface RecalculatePlanRequest {
  objective?: PlanObjective;
  seed?: number;
  includeNewOrders: boolean;
}

export interface PlanPreview {
  deliveryDate: string;
  orderCount: number;
  boxCount: number;
  parameters: PlanningParameters;
  proposals: PlanProposal[];
}

export interface RecalculateResult {
  plan: DeliveryPlan;
  exhausted: boolean;
}

interface PlanningContext {
  deliveryDate: string;
  requests: DeliveryRequest[];
  parameters: PlanningParameters;
  shopName: string;
}

export class PlanService {
  constructor(
    private readonly plans: PlanRepository,
    private readonly orders: OrderRepository,
    private readonly riders: RiderRepository,
    private readonly settings: SettingsService,
    private readonly planner: DeliveryPlanner,
    private readonly routing: RoutingService,
    private readonly jobCodes: JobCodeGenerator,
    private readonly calendar: BusinessCalendar,
    private readonly transactions: TransactionRunner,
  ) {}

  objectives(): { key: PlanObjective; label: string; description: string }[] {
    return ObjectiveFactory.all().map(({ key, label, description }) => ({ key, label, description }));
  }

  list(query: PlanListQuery): Promise<Page<DeliveryPlanHeader>> {
    return this.plans.findPage(query);
  }

  async get(id: number): Promise<DeliveryPlan> {
    const plan = await this.plans.findById(id);
    if (!plan) {
      throw HttpError.notFound(`Delivery plan ${id} was not found`, "PLAN_NOT_FOUND");
    }
    return plan;
  }

  async latest(deliveryDate?: string): Promise<DeliveryPlan> {
    const date = this.calendar.resolve(deliveryDate);
    const plan =
      (await this.plans.findLatest(date, ["confirmed", "completed"])) ?? (await this.plans.findLatest(date, ["draft"]));
    if (!plan) {
      throw HttpError.notFound(`No delivery plan exists for ${date}`, "PLAN_NOT_FOUND");
    }
    return plan;
  }

  async preview(request: GeneratePlanRequest): Promise<PlanPreview> {
    const context = await this.buildContext(request.deliveryDate, request.orderIds);
    const seed = request.seed ?? SeededRandom.randomSeed();
    const proposals = await this.propose(context, {
      objective: request.objective,
      seed,
      alternatives: request.alternatives,
    });
    return {
      deliveryDate: context.deliveryDate,
      orderCount: context.requests.length,
      boxCount: context.requests.reduce((sum, item) => sum + item.boxes, 0),
      parameters: context.parameters,
      proposals,
    };
  }

  async create(request: GeneratePlanRequest): Promise<DeliveryPlan> {
    const context = await this.buildContext(request.deliveryDate, request.orderIds);
    const seed = request.seed ?? SeededRandom.randomSeed();
    const proposals = await this.propose(context, {
      objective: request.objective,
      seed,
      alternatives: request.alternativeIndex + 1,
    });
    const proposal = proposals[Math.min(request.alternativeIndex, proposals.length - 1)];

    const planId = await this.transactions.transaction(async (executor) => {
      const plans = this.plans.withExecutor(executor);
      const id = await plans.insertPlan({
        deliveryDate: context.deliveryDate,
        objective: request.objective,
        seed,
        revision: 1,
        status: "draft",
        departureTime: proposal.summary.departureTime,
        deadlineTime: proposal.summary.deadlineTime,
        snapshot: { parameters: context.parameters, shopName: context.shopName },
        summary: proposal.summary,
        signature: proposal.signature,
        exploredSignatures: [proposal.signature],
      });
      await plans.insertRoutes(id, proposal.routes, await this.allocateJobCodes(plans, proposal.routes.length));
      return id;
    });

    return this.get(planId);
  }

  async recalculate(id: number, request: RecalculatePlanRequest): Promise<RecalculateResult> {
    const plan = await this.get(id);
    this.ensureStatus(plan, ["draft"], "Only draft plans can be recalculated");

    const orderIds = request.includeNewOrders
      ? undefined
      : plan.routes.flatMap((route) => route.stops.map((stop) => stop.orderId)).filter((value): value is number => value !== null);
    const context = await this.buildContext(plan.deliveryDate, orderIds, true);
    const explored = await this.plans.findExploredSignatures(id);
    const objective = request.objective ?? plan.objective;
    const seed = request.seed ?? SeededRandom.randomSeed();

    const [proposal] = await this.propose(context, {
      objective,
      seed,
      alternatives: 1,
      excludeSignatures: explored,
    });
    const exhausted = explored.includes(proposal.signature);

    await this.transactions.transaction(async (executor) => {
      const plans = this.plans.withExecutor(executor);
      await plans.replacePlanResult(id, {
        deliveryDate: plan.deliveryDate,
        objective,
        seed,
        revision: plan.revision + 1,
        status: "draft",
        departureTime: proposal.summary.departureTime,
        deadlineTime: proposal.summary.deadlineTime,
        snapshot: { parameters: context.parameters, shopName: context.shopName },
        summary: proposal.summary,
        signature: proposal.signature,
        exploredSignatures: exhausted ? explored : [...explored, proposal.signature],
      });
      await plans.insertRoutes(id, proposal.routes, await this.allocateJobCodes(plans, proposal.routes.length));
    });

    return { plan: await this.get(id), exhausted };
  }

  async confirm(id: number): Promise<DeliveryPlan> {
    await this.transactions.transaction(async (executor) => {
      const plans = this.plans.withExecutor(executor);
      const orders = this.orders.withExecutor(executor);
      const plan = await plans.findById(id);
      if (!plan) {
        throw HttpError.notFound(`Delivery plan ${id} was not found`, "PLAN_NOT_FOUND");
      }
      this.ensureStatus(plan, ["draft"], "Only draft plans can be confirmed");

      const stops = plan.routes.flatMap((route) => route.stops);
      const orderIds = stops.map((stop) => stop.orderId).filter((value): value is number => value !== null);
      const current = new Map((await orders.findByIds(orderIds)).map((order) => [order.id, order]));
      const problems = stops
        .map((stop) => {
          const order = stop.orderId === null ? undefined : current.get(stop.orderId);
          if (!order) {
            return { orderId: stop.orderId, reason: "ORDER_DELETED" };
          }
          if (order.status !== "pending") {
            return { orderId: order.id, reason: "ORDER_NOT_PENDING", status: order.status };
          }
          if (order.boxes !== stop.boxes || order.customerId !== stop.customerId) {
            return { orderId: order.id, reason: "ORDER_CHANGED" };
          }
          return null;
        })
        .filter((problem) => problem !== null);

      if (problems.length > 0) {
        throw HttpError.conflict(
          "Orders changed after this plan was calculated. Recalculate the plan before confirming.",
          "PLAN_STALE",
          problems,
        );
      }

      const assigned = await orders.assignToPlan(orderIds, id);
      if (assigned !== orderIds.length) {
        throw HttpError.conflict("Some orders could not be assigned. Recalculate the plan.", "PLAN_STALE");
      }
      await plans.setStatus(id, "confirmed");
      await plans.cancelMany(await plans.findDraftIdsByDate(plan.deliveryDate, id));
    });

    return this.get(id);
  }

  async cancel(id: number): Promise<DeliveryPlan> {
    const plan = await this.get(id);
    this.ensureStatus(plan, ["draft", "confirmed"], "Only draft or confirmed plans can be cancelled");
    await this.transactions.transaction(async (executor) => {
      if (plan.status === "confirmed") {
        await this.orders.withExecutor(executor).releaseFromPlan(id);
      }
      await this.plans.withExecutor(executor).setStatus(id, "cancelled");
    });
    return this.get(id);
  }

  async remove(id: number): Promise<{ id: number }> {
    const plan = await this.get(id);
    if (plan.status === "confirmed") {
      throw HttpError.conflict("Cancel the confirmed plan before deleting it", "PLAN_ACTIVE");
    }
    await this.plans.delete(id);
    return { id };
  }

  async assignRider(planId: number, routeId: number, riderId: number | null): Promise<DeliveryPlan> {
    const plan = await this.get(planId);
    this.ensureStatus(plan, ["draft", "confirmed"], "Riders can only be assigned to draft or confirmed plans");
    if (!plan.routes.some((route) => route.id === routeId)) {
      throw HttpError.notFound(`Route ${routeId} does not belong to plan ${planId}`, "ROUTE_NOT_FOUND");
    }
    if (riderId !== null) {
      const rider = await this.riders.findById(riderId);
      if (!rider) {
        throw HttpError.unprocessable(`Rider ${riderId} does not exist`, "RIDER_NOT_FOUND");
      }
      if (!rider.active) {
        throw HttpError.unprocessable(`Rider ${riderId} is not active`, "RIDER_INACTIVE");
      }
    }
    await this.plans.assignRider(routeId, riderId);
    return this.get(planId);
  }

  private async propose(context: PlanningContext, options: PlanningOptions): Promise<PlanProposal[]> {
    const factor = context.parameters.roadDistanceFactor;
    const table = await this.routing.table(
      [context.parameters.depot, ...context.requests.map((request) => request.location)],
      factor,
    );
    const matrix = new DistanceMatrix(table.distancesKm, table.source);
    const proposals = this.planner.plan(context.requests, context.parameters, options, matrix);

    const routes = proposals.flatMap((proposal) => proposal.routes);
    const paths = await this.routing.paths(
      routes.map((route) => route.path),
      factor,
    );
    routes.forEach((route, index) => {
      route.geometry = paths[index].geometry;
    });
    return proposals;
  }

  private async buildContext(deliveryDate: string | undefined, orderIds?: number[], allowPartial = false): Promise<PlanningContext> {
    const settings = await this.settings.get();
    const parameters = PlanningParametersFactory.fromSettings(settings);
    let orders: Order[];
    let date: string;

    if (orderIds && orderIds.length > 0) {
      const found = await this.orders.findByIds([...new Set(orderIds)]);
      orders = found.filter((order) => order.status === "pending");
      if (!allowPartial) {
        const foundIds = new Set(found.map((order) => order.id));
        const missing = orderIds.filter((orderId) => !foundIds.has(orderId));
        const notPending = found.filter((order) => order.status !== "pending").map((order) => order.id);
        if (missing.length > 0 || notPending.length > 0) {
          throw HttpError.unprocessable("Some orders cannot be planned", "ORDERS_NOT_PLANNABLE", { missing, notPending });
        }
      }
      const dates = [...new Set(orders.map((order) => order.deliveryDate))];
      if (dates.length > 1) {
        throw HttpError.unprocessable("All orders in a plan must share one delivery date", "MIXED_DELIVERY_DATES", { dates });
      }
      date = dates[0] ?? this.calendar.resolve(deliveryDate);
    } else {
      date = this.calendar.resolve(deliveryDate);
      orders = await this.orders.findByFilter({ deliveryDate: date, status: "pending" });
    }

    if (orders.length === 0) {
      throw HttpError.unprocessable(`There are no pending orders to plan for ${date}`, "NO_PENDING_ORDERS");
    }

    const oversized = orders.filter((order) => order.boxes > settings.maxBoxesPerOrder).map((order) => order.id);
    if (oversized.length > 0) {
      throw HttpError.unprocessable(
        `Some orders exceed ${settings.maxBoxesPerOrder} boxes`,
        "ORDERS_EXCEED_BOX_LIMIT",
        { orderIds: oversized },
      );
    }

    return {
      deliveryDate: date,
      parameters,
      shopName: settings.shopName,
      requests: orders.map((order) => ({
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customer.fullName,
        phone: order.customer.phone,
        address: order.customer.address,
        location: order.customer.location,
        boxes: order.boxes,
      })),
    };
  }

  private async allocateJobCodes(plans: PlanRepository, count: number): Promise<string[]> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const codes = this.jobCodes.generateUnique(count);
      const taken = await plans.findTakenJobCodes(codes);
      if (taken.size === 0) {
        return codes;
      }
    }
    throw HttpError.serviceUnavailable("Could not allocate unique job codes", "JOB_CODE_EXHAUSTED");
  }

  private ensureStatus(plan: DeliveryPlanHeader, allowed: PlanStatus[], message: string): void {
    if (!allowed.includes(plan.status)) {
      throw HttpError.conflict(message, "INVALID_PLAN_STATUS", { status: plan.status, allowed });
    }
  }
}
