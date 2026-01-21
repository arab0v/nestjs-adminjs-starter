import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const rootModule = await AppModule.forRoot();
  const app = await NestFactory.create(rootModule);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
