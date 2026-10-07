import { HttpError } from "../../core/errors/HttpError";
import { Page } from "../../core/http/Pagination";
import { Rider, RiderInput, RiderQuery } from "./Rider";
import { RiderRepository } from "./RiderRepository";

export class RiderService {
  constructor(private readonly riders: RiderRepository) {}

  list(query: RiderQuery): Promise<Page<Rider>> {
    return this.riders.findPage(query);
  }

  async get(id: number): Promise<Rider> {
    const rider = await this.riders.findById(id);
    if (!rider) {
      throw HttpError.notFound(`Rider ${id} was not found`, "RIDER_NOT_FOUND");
    }
    return rider;
  }

  async create(input: RiderInput): Promise<Rider> {
    const id = await this.riders.create(input);
    return this.get(id);
  }

  async update(id: number, changes: Partial<RiderInput>): Promise<Rider> {
    const current = await this.get(id);
    await this.riders.update(id, {
      name: changes.name ?? current.name,
      phone: changes.phone ?? current.phone,
      vehiclePlate: changes.vehiclePlate ?? current.vehiclePlate,
      active: changes.active ?? current.active,
    });
    return this.get(id);
  }

  async remove(id: number): Promise<{ id: number }> {
    await this.get(id);
    await this.riders.delete(id);
    return { id };
  }
}
