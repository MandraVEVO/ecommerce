import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProductLike } from './entities/product-like.entity';
import { Producto } from '../productos/entities/producto.entity';
import { User } from '../users/entities/user.entity';
import { UserRoles } from '../common/enums/user-roles.enum';

@Injectable()
export class ProductLikesService {
  constructor(
    @InjectRepository(ProductLike)
    private readonly productLikeRepository: Repository<ProductLike>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   *  DAR LIKE A UN PRODUCTO
   */
  async toggleLike(productoId: string, userId: string) {
    // Verificar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { id: productoId, deletedAt: IsNull() }
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar que el usuario es cliente
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user || user.role !== UserRoles.CLIENTE) {
      throw new ForbiddenException('Solo los clientes pueden dar like a productos');
    }

    // Buscar si ya existe el like
    const existingLike = await this.productLikeRepository.findOne({
      where: { userId, productoId }
    });

    if (existingLike) {
      // Si existe, eliminar (toggle off)
      await this.productLikeRepository.remove(existingLike);
      return {
        message: 'Like eliminado',
        isLiked: false
      };
    } else {
      // Si no existe, crear (toggle on)
      const like = this.productLikeRepository.create({
        userId,
        productoId
      });
      await this.productLikeRepository.save(like);
      return {
        message: 'Like agregado',
        isLiked: true
      };
    }
  }

  /**
   *  OBTENER MIS PRODUCTOS FAVORITOS
   */
  async getMyLikedProducts(userId: string) {
    const likes = await this.productLikeRepository.find({
      where: { userId },
      relations: ['producto', 'producto.proveedor'],
      order: { createdAt: 'DESC' }
    });

    const productos = likes.map(like => ({
      ...like.producto,
      isLiked: true,
      likedAt: like.createdAt
    }));

    return {
      total: productos.length,
      productos
    };
  }

  /**
   * VERIFICAR SI DI LIKE A UN PRODUCTO
   */
  async checkIfLiked(productoId: string, userId: string): Promise<boolean> {
    const like = await this.productLikeRepository.findOne({
      where: { userId, productoId }
    });
    return !!like;
  }

  /**
   * OBTENER TOTAL DE LIKES DE UN PRODUCTO
   */
  async getTotalLikes(productoId: string): Promise<number> {
    return await this.productLikeRepository.count({
      where: { productoId }
    });
  }
}