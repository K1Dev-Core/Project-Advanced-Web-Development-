import { HttpError } from "../../core/errors/HttpError";
import { Page } from "../../core/http/Pagination";
import { GeoPoint } from "../../shared/geo/GeoPoint";
import { OrderRepository } from "../orders/OrderRepository";
import { Customer, CustomerInput, CustomerQuery, CustomerWithDistance } from "./Customer";
import { CustomerRepository } from "./CustomerRepository";

export class CustomerService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly orders: OrderRepository,
  ) {}

  list(query: CustomerQuery): Promise<Page<Customer>> {
    return this.customers.findPage(query);
  }

  async get(id: number): Promise<Customer> {
    const customer = await this.customers.findById(id);
    if (!customer) {
      throw HttpError.notFound(`Customer ${id} was not found`, "CUSTOMER_NOT_FOUND");
    }
    return customer;
  }

  nearby(center: GeoPoint, radiusKm: number): Promise<CustomerWithDistance[]> {
    return this.customers.findNearby(center, radiusKm);
  }

  async create(input: CustomerInput): Promise<Customer> {
    const id = await this.customers.create(input);
    return this.get(id);
  }

  async update(id: number, changes: Partial<CustomerInput>): Promise<Customer> {
    const current = await this.get(id);
    const merged: CustomerInput = {
      firstName: changes.firstName ?? current.firstName,
      lastName: changes.lastName ?? current.lastName,
      phone: changes.phone ?? current.phone,
      address: changes.address ?? current.address,
      location: changes.location ?? current.location,
      note: changes.note ?? current.note,
      simulated: current.simulated,
    };
    await this.customers.update(id, merged);
    return this.get(id);
  }

  async remove(id: number, force: boolean): Promise<{ id: number; deletedOrders: number }> {
    await this.get(id);

    const locked = await this.orders.countByCustomer(id, ["assigned"]);
    if (locked > 0) {
      throw HttpError.conflict(
        "Customer has orders assigned to a confirmed delivery plan. Cancel the plan first.",
        "CUSTOMER_HAS_ASSIGNED_ORDERS",
        { assignedOrders: locked },
      );
    }

    const total = await this.orders.countByCustomer(id);
    if (total > 0 && !force) {
      throw HttpError.conflict(
        "Customer still has orders. Retry with force=true to delete the customer together with the orders.",
        "CUSTOMER_HAS_ORDERS",
        { orders: total },
      );
    }

    const deletedOrders = total > 0 ? await this.orders.deleteByCustomer(id) : 0;
    await this.customers.delete(id);
    return { id, deletedOrders };
  }
}
