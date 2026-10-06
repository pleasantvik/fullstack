import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { TaskPriority, TaskStatus } from "../../generated/prisma/enums.js";

// No userId. It comes from the guard, never the caller - and because it is
// absent here, whitelist: true strips it from any body that tries to send one.
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // @Type converts the JSON string to a Date before @IsDate checks it; the
  // global pipe's transform: true is what runs it.
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}
