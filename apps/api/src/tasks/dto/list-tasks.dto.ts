import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { TaskPriority, TaskStatus } from "../../generated/prisma/enums.js";

// Query parameters for GET /tasks. 1.5c adds filtering here.
export class ListTasksDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  // Max(100) is the one that matters: without a ceiling, ?limit=1000000 is a
  // one-request way to make the database read the whole table.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // NOT @Type(() => Boolean). Query values are strings, and Boolean("false")
  // is true - so ?overdue=false would filter for overdue tasks.
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  overdue?: boolean;
}
