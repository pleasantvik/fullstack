import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import type { EnvironmentVariables } from './config/env.validation.js'

async function bootstrap() {
  // Two things happen here.
  //
  // If the environment is invalid, this line throws: nothing below it runs and
  // no port is ever bound - the van does not leave the depot.
  //
  // bufferLogs holds everything logged during startup in memory until useLogger
  // runs below. Without it, every line Nest emits while building the module
  // tree - including PrismaService connecting - comes out in Nest's own text
  // format, and only later lines are JSON.
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  // Replaces Nest's built-in logger with pino. Configuring LoggerModule is not
  // enough on its own: without this line pino is wired up and ignored, and
  // framework logs keep their old format.
  app.useLogger(app.get(Logger))

  // Validates incoming request bodies against DTOs. Inert until 1.5, because
  // there are no DTOs yet. Here because it is bootstrap configuration rather
  // than a feature.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no decorator on the DTO
      transform: true, // same string-to-type conversion as the config above
    }),
  )

  // Nest does not listen for process signals unless told to. This makes
  // SIGTERM and SIGINT run onModuleDestroy on every provider - which is what
  // calls PrismaService.$disconnect() and returns the connections.
  //
  // Without it, a container killed during a deploy in 1.10 dies still holding
  // its pool, and the replacement container opens its own alongside.
  app.enableShutdownHooks()

  const config: ConfigService<EnvironmentVariables, true> = app.get(ConfigService)

  await app.listen(config.get('PORT', { infer: true }))
}

await bootstrap()
