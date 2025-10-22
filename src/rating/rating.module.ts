import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { ProductLikesService } from './product-like.service';
import { ProductLikesController } from './product-like.controller';
import { Rating } from './entities/rating.entity';
import { ProductLike } from './entities/product-like.entity';
import { Producto } from '../productos/entities/producto.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      ProductLike,
      Producto,
      User,
    ]),
  ],
  controllers: [
    RatingController,
    ProductLikesController,
  ],
  providers: [
    RatingService,
    ProductLikesService,
  ],
  exports: [
    RatingService,
    ProductLikesService,
    TypeOrmModule,
  ],
})
export class RatingModule {}
