import { HttpError } from "../../core/errors/HttpError";
import { TransactionRunner } from "../../database/TransactionRunner";
import { MapLinkBuilder } from "../../shared/geo/MapLinkBuilder";
import { OrderRepository } from "../orders/OrderRepository";
import { DeliveryPlan, PlanRoute } from "../plans/DeliveryPlan";
import { PlanRepository } from "../plans/PlanRepository";
import { JobSheet } from "./JobSheet";

interface LoadedJob {
  plan: DeliveryPlan;
  route: PlanRoute;
}

export class JobService {
  constructor(
    private readonly plans: PlanRepository,
    private readonly orders: OrderRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async get(jobCode: string): Promise<JobSheet> {
    const { plan, route } = await this.load(jobCode);
    return this.toSheet(plan, route);
  }

  async start(jobCode: string): Promise<JobSheet> {
    const { route } = await this.load(jobCode);
    if (route.status === "pending") {
      await this.plans.setRouteStatus(route.id, "in_progress");
    }
    return this.get(jobCode);
  }

  async deliver(jobCode: string, stopId: number): Promise<JobSheet> {
    const { plan, route } = await this.load(jobCode);
    const stop = route.stops.find((item) => item.id === stopId);
    if (!stop) {
      throw HttpError.notFound(`Stop ${stopId} is not part of job ${jobCode}`, "STOP_NOT_FOUND");
    }
    if (stop.status === "delivered") {
      return this.toSheet(plan, route);
    }

    await this.transactions.transaction(async (executor) => {
      const plans = this.plans.withExecutor(executor);
      await plans.setStopStatus(stop.id, "delivered");
      if (stop.orderId !== null) {
        await this.orders.withExecutor(executor).markDelivered(stop.orderId);
      }

      const routeDone = route.stops.every((item) => item.id === stop.id || item.status === "delivered");
      await plans.setRouteStatus(route.id, routeDone ? "completed" : "in_progress");

      const planDone =
        routeDone && plan.routes.every((item) => item.id === route.id || item.status === "completed");
      if (planDone) {
        await plans.setStatus(plan.id, "completed");
      }
    });

    return this.get(jobCode);
  }

  async undoDelivery(jobCode: string, stopId: number): Promise<JobSheet> {
    const { plan, route } = await this.load(jobCode);
    const stop = route.stops.find((item) => item.id === stopId);
    if (!stop) {
      throw HttpError.notFound(`Stop ${stopId} is not part of job ${jobCode}`, "STOP_NOT_FOUND");
    }
    if (stop.status !== "delivered") {
      return this.toSheet(plan, route);
    }

    await this.transactions.transaction(async (executor) => {
      const plans = this.plans.withExecutor(executor);
      await plans.setStopStatus(stop.id, "pending");
      if (stop.orderId !== null) {
        await this.orders.withExecutor(executor).update(stop.orderId, { status: "assigned" });
      }
      await plans.setRouteStatus(route.id, "in_progress");
      if (plan.status === "completed") {
        await plans.setStatus(plan.id, "confirmed");
      }
    });

    return this.get(jobCode);
  }

  private async load(jobCode: string): Promise<LoadedJob> {
    const code = jobCode.trim().toUpperCase();
    const locator = await this.plans.findLocatorByJobCode(code);
    const plan = locator ? await this.plans.findById(locator.planId) : null;
    const route = plan?.routes.find((item) => item.id === locator?.routeId);
    if (!plan || !route) {
      throw HttpError.notFound(`Job ${code} was not found`, "JOB_NOT_FOUND");
    }
    if (plan.status === "draft" || plan.status === "cancelled") {
      throw HttpError.conflict(
        plan.status === "draft" ? "This job has not been confirmed by the shop yet" : "This job was cancelled by the shop",
        "JOB_NOT_AVAILABLE",
        { planStatus: plan.status },
      );
    }
    return { plan, route };
  }

  private toSheet(plan: DeliveryPlan, route: PlanRoute): JobSheet {
    const delivered = route.stops.filter((stop) => stop.status === "delivered").length;
    const instructions = [
      `หยิบข้าวกล่องทั้งหมด ${route.boxCount} กล่อง (${route.orderCount} ออเดอร์) ออกจากร้านเวลา ${plan.departureTime}`,
      ...route.stops.map(
        (stop) =>
          `จุดที่ ${stop.sequence}: ส่งบ้านคุณ ${stop.customerName} จำนวน ${stop.boxes} กล่อง ถึงประมาณ ${stop.eta}`,
      ),
      `ต้องส่งครบทุกจุดก่อน ${plan.deadlineTime}`,
    ];

    return {
      jobCode: route.jobCode,
      planId: plan.id,
      planStatus: plan.status,
      deliveryDate: plan.deliveryDate,
      riderNumber: route.sequence,
      color: route.color,
      colorName: route.colorName,
      rider: route.rider,
      status: route.status,
      shop: {
        name: plan.shop.name,
        location: plan.shop.location,
        mapUrl: MapLinkBuilder.place(plan.shop.location),
      },
      departureTime: plan.departureTime,
      deadlineTime: plan.deadlineTime,
      finishTime: route.finishTime,
      totalOrders: route.orderCount,
      totalBoxes: route.boxCount,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      riderFee: route.riderFee,
      deliveredStops: delivered,
      remainingStops: route.stops.length - delivered,
      instructions,
      navigationUrl: route.navigationUrl,
      path: route.path,
      stops: route.stops.map((stop) => ({
        id: stop.id,
        sequence: stop.sequence,
        label: `จุดที่ ${stop.sequence}`,
        orderId: stop.orderId,
        customerName: stop.customerName,
        phone: stop.phone,
        callUrl: `tel:${stop.phone.replace(/[^0-9+]/g, "")}`,
        address: stop.address,
        location: stop.location,
        boxes: stop.boxes,
        eta: stop.eta,
        legDistanceKm: stop.legDistanceKm,
        late: stop.late,
        status: stop.status,
        deliveredAt: stop.deliveredAt,
        mapUrl: stop.mapUrl,
      })),
      startedAt: route.startedAt,
      completedAt: route.completedAt,
    };
  }
}
