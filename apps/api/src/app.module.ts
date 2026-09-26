import { Module } from '@nestjs/common'

// The root of the module tree. Every other module in the application will be
// listed in `imports` here, or imported by something that is.
//
// Empty on purpose. A module declares three things:
//   controllers - classes that handle incoming HTTP requests
//   providers   - classes the container can create and hand to whoever asks
//   imports     - other modules whose exported providers this one may use
//
// Nothing qualifies yet. ConfigModule arrives in 1.3b, PrismaService in 1.3c.
@Module({})
export class AppModule {}
