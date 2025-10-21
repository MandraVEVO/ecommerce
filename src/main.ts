import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference'; // Documentación estilo Scalar

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('aplicacion jalando');

  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  // Configurar OpenAPI/Swagger (base para Scalar)
  const config = new DocumentBuilder()
    .setTitle('E-commerce Negocios API')
    .setDescription('API para plataforma de e-commerce con gestión de usuarios, autenticación y negocios')
    .setVersion('1.0')
    .addTag('Authentication', 'Endpoints para registro, login y gestión de autenticación')
    .addTag('Users', 'Gestión de usuarios y perfiles')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Servidor de desarrollo')
    .addServer('https://api.tudominio.com', 'Servidor de producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/api/docs',
    apiReference({
      theme: 'purple', 
      spec: {
        content: document,
      },
      configuration: {
        authentication: {
          apiKey: {
            token: 'your-api-key-here'
          }
        }
      }
    }),
  );

  SwaggerModule.setup('api/swagger', app, document, {
    customSiteTitle: 'E-commerce API Docs (Swagger)',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Scalar documentation: http://localhost:${port}/api/docs`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/swagger`);
}
bootstrap();
