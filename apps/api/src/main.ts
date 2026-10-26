import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { API_PREFIX } from './api-prefix.js'
import { AppModule } from './app.module.js'
import { NodeEnv, type EnvironmentVariables } from './config/env.validation.js'

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

  // Validates every body and query string against its DTO. Bootstrap
  // configuration rather than a feature, so it lives here.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // properties with no decorator on the DTO are not allowed...
      // ...and are rejected rather than stripped (ADR 0009). Stripping turned a
      // misnamed field into a silent no-op: PATCH { "done": true } answered 200
      // and changed nothing. Applies to query strings too - no ad-hoc params.
      forbidNonWhitelisted: true,
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

  // Every route under /api: the web app reaches the API through a proxy on its
  // own origin (ADR 0010). The API owns its public path - a proxy that stripped
  // the prefix would leave cookie paths pointing at addresses the browser never
  // requests. Health stays unprefixed: the proxy forwards only /api/*, so these
  // are reachable inside the Docker network but not from the public origin.
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health', 'health/ready'] })

  // One explicit origin. Never `origin: true`, which reflects whatever Origin
  // the request sends: it reads like an allow-list and behaves like "*" - and
  // unlike "*", browsers permit it alongside credentials.
  // Populates req.cookies. Without it the auth cookies arrive and nothing can
  // read them.
  app.use(cookieParser())

  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    // Without this the browser silently discards Set-Cookie on a cross-origin
    // response, and never sends cookies on one. Only legal because origin is a
    // single explicit value - browsers reject credentials alongside "*".
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    // No Authorization: the token travels in a cookie now. A side effect is
    // that plain GETs become simple requests and are no longer preflighted.
    allowedHeaders: ['Content-Type'],
    // Cross-origin JavaScript can read only a small safelisted set of response
    // headers. Without this, the frontend cannot see the request id from 1.3d.
    exposedHeaders: ['X-Request-Id'],
    // JSON bodies are still preflighted. Chromium caps this cache at 2 hours.
    maxAge: 7200,
  })

  // Not in production: a deployed API need not hand over a map of itself.
  if (config.get('NODE_ENV', { infer: true }) !== NodeEnv.Production) {
    const openApi = new DocumentBuilder()
      .setTitle('Task Manager API')
      .setDescription('Auth and task management. See docs/ in the repo.')
      .setVersion('1.0')
      // The name matters: with no argument it documents Express-session's
      // `connect.sid`, a cookie this API never sets.
      .addCookieAuth('access_token')
      .build()

    SwaggerModule.setup('docs', app, () =>
      SwaggerModule.createDocument(app, openApi),
    )
  }

  await app.listen(config.get('PORT', { infer: true }))
}

await bootstrap()
