import { Request } from "express";
import { HttpError } from "../../core/errors/HttpError";
import { BaseController } from "../../core/http/BaseController";
import { JobService } from "./JobService";

export class JobController extends BaseController {
  readonly basePath = "/jobs";

  constructor(private readonly service: JobService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/:code",
      this.action(async (req, res) => {
        this.ok(res, await this.service.get(this.code(req)));
      }),
    );

    this.router.post(
      "/:code/start",
      this.action(async (req, res) => {
        this.ok(res, await this.service.start(this.code(req)));
      }),
    );

    this.router.post(
      "/:code/stops/:stopId/deliver",
      this.action(async (req, res) => {
        this.ok(res, await this.service.deliver(this.code(req), this.idParam(req, "stopId")));
      }),
    );

    this.router.post(
      "/:code/stops/:stopId/undo",
      this.action(async (req, res) => {
        this.ok(res, await this.service.undoDelivery(this.code(req), this.idParam(req, "stopId")));
      }),
    );
  }

  private code(req: Request): string {
    const code = String(req.params.code ?? "").trim();
    if (!/^[A-Za-z0-9]{4,20}$/.test(code)) {
      throw HttpError.badRequest("Job code must contain 4-20 letters or digits", "INVALID_JOB_CODE");
    }
    return code;
  }
}
