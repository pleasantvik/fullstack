import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCookieAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/guards/jwt-auth.guard.js";
import { CreateTaskDto } from "./dto/create-task.dto.js";
import { ListTasksDto } from "./dto/list-tasks.dto.js";
import { UpdateTaskDto } from "./dto/update-task.dto.js";
import { TasksService } from "./tasks.service.js";

// No @Public anywhere: the guard registered in 1.4c protects every route by
// default, so these are already closed.
@ApiTags("tasks")
@ApiCookieAuth()
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTasksDto,
  ) {
    return this.tasks.findAll(user.id, query);
  }

  // ParseUUIDPipe turns a malformed id into a 400 here, rather than a Prisma
  // error and a 500 three layers down.
  @Get(":id")
  @ApiResponse({
    status: 404,
    description: "No such task, or it belongs to someone else - deliberately the same answer.",
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.tasks.findOne(user.id, id);
  }

  @Patch(":id")
  @ApiResponse({ status: 400, description: "Unknown field, invalid value, or nothing to update." })
  @ApiResponse({ status: 404, description: "No such task, or not yours." })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    // Here, not in the service: whether a request is well-formed is the HTTP
    // layer's question. Values, not keys - with target ES2023 every declared
    // DTO field is an own property set to undefined, so Object.keys(dto) is
    // never empty.
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException("Send at least one field to update.");
    }
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 404, description: "No such task, or not yours." })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.tasks.remove(user.id, id);
  }
}
