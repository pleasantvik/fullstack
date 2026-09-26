import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

// The only place in the codebase that says "start".
//
// The `.js` on the import is not a mistake. Under Node's ESM resolution you
// import the path that will exist after compilation, so TypeScript source
// refers to the JavaScript it becomes.
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Hardcoded for now, deliberately. Reading this from validated configuration
  // is the whole subject of 1.3b - it earns its own slice rather than being
  // smuggled in here.
  await app.listen(3000)
}

await bootstrap()
