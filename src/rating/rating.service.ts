import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ProveedorResponseDto } from './dto/proveedor-response.dto';
import { Rating } from './entities/rating.entity';
import { Producto } from '../productos/entities/producto.entity';
import { User } from '../users/entities/user.entity';
import { UserRoles } from '../common/enums/user-roles.enum';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * CREAR CALIFICACIÓN (solo clientes)
   */
  async create(createRatingDto: CreateRatingDto, productoId: string, userId: string) {
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
      throw new ForbiddenException('Solo los clientes pueden calificar productos');
    }

    // Verificar si ya calificó este producto
    const existingRating = await this.ratingRepository.findOne({
      where: { 
        userId, 
        productoId,
        deletedAt: IsNull()
      }
    });

    if (existingRating) {
      throw new BadRequestException('Ya has calificado este producto. Puedes editar tu calificación existente.');
    }

    // Crear calificación
    const rating = this.ratingRepository.create({
      ...createRatingDto,
      userId,
      productoId,
    });

    const savedRating = await this.ratingRepository.save(rating);

    return {
      message: 'Calificación creada exitosamente',
      rating: savedRating
    };
  }

  /**
   * OBTENER CALIFICACIONES DE UN PRODUCTO
   */
  async findByProducto(productoId: string) {
    const producto = await this.productoRepository.findOne({
      where: { id: productoId }
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const ratings = await this.ratingRepository.find({
      where: { 
        productoId,
        deletedAt: IsNull()
      },
      relations: ['user'],
      select: {
        id: true,
        rating: true,
        review: true,
        proveedorResponse: true,
        proveedorRespondedAt: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true,
        }
      },
      order: { createdAt: 'DESC' }
    });

    // Calcular estadísticas
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length,
    };

    return {
      totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      ratings
    };
  }

  /**
   * MIS CALIFICACIONES (cliente)
   */
  async findMyRatings(userId: string) {
    const ratings = await this.ratingRepository.find({
      where: { 
        userId,
        deletedAt: IsNull()
      },
      relations: ['producto'],
      order: { createdAt: 'DESC' }
    });

    return {
      total: ratings.length,
      ratings
    };
  }

  /**
   * ACTUALIZAR CALIFICACIÓN (solo el autor)
   */
  async update(id: string, updateRatingDto: UpdateRatingDto, userId: string) {
    const rating = await this.ratingRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    if (rating.userId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias calificaciones');
    }

    await this.ratingRepository.update(id, {
      ...updateRatingDto,
      updatedAt: new Date()
    });

    const updatedRating = await this.ratingRepository.findOne({
      where: { id },
      relations: ['producto', 'user']
    });

    return {
      message: 'Calificación actualizada exitosamente',
      rating: updatedRating
    };
  }

  /**
   * RESPONDER A CALIFICACIÓN (solo proveedor del producto)
   */
  async respondToRating(
    ratingId: string, 
    proveedorResponseDto: ProveedorResponseDto,
    userId: string,
    userRole: UserRoles
  ) {
    const rating = await this.ratingRepository.findOne({
      where: { id: ratingId, deletedAt: IsNull() },
      relations: ['producto']
    });

    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Verificar que es el proveedor del producto
    if (userRole !== UserRoles.ADMIN && rating.producto.proveedorId !== userId) {
      throw new ForbiddenException('Solo el proveedor del producto puede responder');
    }

    await this.ratingRepository.update(ratingId, {
      proveedorResponse: proveedorResponseDto.response,
      proveedorRespondedAt: new Date(),
      updatedAt: new Date()
    });

    const updatedRating = await this.ratingRepository.findOne({
      where: { id: ratingId },
      relations: ['producto', 'user']
    });

    return {
      message: 'Respuesta agregada exitosamente',
      rating: updatedRating
    };
  }

  /**
   * ELIMINAR CALIFICACIÓN
   */
  async remove(id: string, userId: string, userRole: UserRoles) {
    const rating = await this.ratingRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Solo el autor o admin pueden eliminar
    if (userRole !== UserRoles.ADMIN && rating.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta calificación');
    }

    await this.ratingRepository.update(id, {
      deletedAt: new Date()
    });

    return {
      message: 'Calificación eliminada exitosamente',
      ratingId: id
    };
  }
}
