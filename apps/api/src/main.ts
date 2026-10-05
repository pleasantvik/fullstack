import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'
import type { EnvironmentVariables } from './config/env.validation.js'

async function bootstrap() {
  // If the environment is invalid, this line throws. Nothing below it runs and
  // no port is ever bound - the van does not leave the depot.
  const app = await NestFactory.create(AppModule)

  // Validates incoming request bodies against DTOs. Inert until 1.5, because
  // there are no DTOs yet. Here because it is bootstrap configuration rather
  // than a feature.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no decorator on the DTO
      transform: true, // same string-to-type conversion as the config above
    }),
  )

  const config: ConfigService<EnvironmentVariables, true> = app.get(ConfigService)

  await app.listen(config.get('PORT', { infer: true }))
}

await bootstrap()
