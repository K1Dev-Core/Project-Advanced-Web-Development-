import { HttpError } from "../../core/errors/HttpError";
import { SettingsRepository } from "./SettingsRepository";
import { ShopSettings, ShopSettingsUpdate } from "./ShopSettings";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get(): Promise<ShopSettings> {
    let settings = await this.repository.get();
    if (!settings) {
      await this.repository.ensureExists();
      settings = await this.repository.get();
    }
    if (!settings) {
      throw HttpError.serviceUnavailable("Shop settings are not available", "SETTINGS_UNAVAILABLE");
    }
    return settings;
  }

  async update(changes: ShopSettingsUpdate): Promise<ShopSettings> {
    await this.get();
    await this.repository.update(changes);
    return this.get();
  }
}
