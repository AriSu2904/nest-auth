import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptions/httpException.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap().catch((err) => console.log(err));
