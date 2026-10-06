import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { TaskStatus } from "../generated/prisma/enums.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateTaskDto } from "./dto/create-task.dto.js";
import type { ListTasksDto } from "./dto/list-tasks.dto.js";
import type { UpdateTaskDto } from "./dto/update-task.dto.js";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // userId is a separate parameter, not a field on the dto, so there is no
  // shape in which a request body could supply it. It is spread last for the
  // same reason.
  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...dto, userId },
    });
  }

  // Ownership lives in the where clause, not in an `if` after the query. A task
  // belonging to someone else is not rejected - it is never selected.
  async findAll(userId: string, query: ListTasksDto) {
    const where: Prisma.TaskWhereInput = {
      userId,

      // Prisma ignores an undefined value in a where clause, so an absent
      // filter simply does not narrow anything. That is the same behaviour
      // that makes an undefined userId return every row - convenient here,
      // dangerous one line up, and worth knowing it is the same rule.
      status: query.status,
      priority: query.priority,

      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      }),

      // NOT, rather than another `status` key, because an object cannot have
      // two. Asking for status=DONE and overdue=true therefore returns nothing,
      // which is the honest answer.
      ...(query.overdue && {
        dueDate: { lt: new Date() },
        NOT: { status: TaskStatus.DONE },
      }),
    };

    // One round trip for both. Without the transaction the count could be taken
    // after an insert the page did not include, and the totals would disagree
    // with the rows.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    };
  }

  // findFirst, not findUnique. findUnique only accepts unique fields in its
  // where clause, so it cannot take userId - reaching for it quietly drops
  // ownership from the query and hands any task to anyone who knows its id.
  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });

    // 404, not 403. "Exists but is not yours" and "does not exist" are the same
    // answer on purpose: a 403 would confirm the id is real.
    if (!task) {
      throw new NotFoundException();
    }

    return task;
  }

  // updateMany, for the same reason findOne uses findFirst: update() takes only
  // a unique where clause, so scoping it to the owner is impossible. The count
  // tells us whether anything matched, which is the ownership check.
  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const { count } = await this.prisma.task.updateMany({
      where: { id, userId },
      data: dto,
    });

    if (count === 0) {
      throw new NotFoundException();
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.task.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      throw new NotFoundException();
    }
  }
}
