import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Producto } from './entities/producto.entity';
import { User } from '../users/entities/user.entity'; // Importar User entity
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto, // Repositorio de Producto
      User,     // Repositorio de User (ESTO FALTABA)
    ]),
    FirebaseModule, //  Para FirebaseService
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService, TypeOrmModule],
})
export class ProductosModule {}
