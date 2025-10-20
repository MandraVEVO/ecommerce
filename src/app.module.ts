import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from './productos/productos.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
    ssl: process.env.STAGE === 'prod',
    extra: {
      ssl: process.env.STAGE === 'prod'
    ?{ rejectUnauthorized: false}
    :null,
    },
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT!,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    autoLoadEntities: true,
    synchronize: true, //no se usa en produccion
   }),
   
    
    
    AuthModule, UsersModule, ProductosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
