import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptions/httpException.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap().catch((err) => console.log(err));
