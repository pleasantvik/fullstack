import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { PrismaService } from "../prisma/prisma.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness: can this process respond at all? No I/O, no dependencies.
  // A failure here means restart me. Wire a restarter to /health/ready instead
  // and a database outage becomes a restart loop that cannot fix itself.
  @Public()
  @Get()
  live() {
    return { status: "ok" };
  }

  // Readiness: can I serve a real request right now? A failure here means take
  // me out of rotation and leave me alone.
  @Public()
  @Get("ready")
  async ready() {
    try {
      // SELECT 1 proves the connection and the credentials without depending
      // on any table existing or having rows in it.
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // No detail in the response. These endpoints are scraped constantly and
      // are often the only part of an API an outsider can reach.
      throw new ServiceUnavailableException({ status: "unavailable" });
    }

    return { status: "ok" };
  }
}
