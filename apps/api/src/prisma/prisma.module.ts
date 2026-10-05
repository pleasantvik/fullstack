import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

// Deliberately NOT global, unlike ConfigModule.
//
// Config is used by nearly every module, including ones that touch no data, so
// requiring an explicit import there would be twenty lines of noise. Database
// access is different: it will be auth, tasks and health, and no more. A module
// importing PrismaModule is declaring "I touch the database" - information
// worth keeping visible.
@Module({
  providers: [PrismaService], // this module can construct it
  exports: [PrismaService], // and will lend it to modules that import this one
})
export class PrismaModule {}
