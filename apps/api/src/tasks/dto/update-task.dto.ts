import { PartialType } from "@nestjs/swagger";
import { CreateTaskDto } from "./create-task.dto.js";

// Every field of CreateTaskDto, all optional, validators inherited. Restating
// them would mean two places to change a bound and one of them going stale.
//
// From @nestjs/swagger rather than @nestjs/mapped-types so the OpenAPI schema
// is derived too - the same class does both jobs.
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
