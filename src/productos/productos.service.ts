import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { User } from '../users/entities/user.entity';
import { UserRoles } from '../common/enums/user-roles.enum';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ProductosService {

  constructor(
    @InjectRepository(Producto)    // Index [0] - ProductoRepository
    private readonly productoRepository: Repository<Producto>,
    
    @InjectRepository(User)        // Index [1] - UserRepository (FALTABA)
    private readonly userRepository: Repository<User>,
    
    private readonly firebaseService: FirebaseService,  //  Index [2]
  ) {}

  /**
   *  CREAR PRODUCTO con imagen optimizada
   */
  async create(
    createProductoDto: CreateProductoDto,
    proveedorId: string,
    imageFile?: Express.Multer.File
  ) {
    // 1. Verificar que el proveedor existe y es válido
    const proveedor = await this.userRepository.findOne({
      where: { id: proveedorId }
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (proveedor.role !== UserRoles.PROVEEDOR) {
      throw new ForbiddenException('Solo los proveedores pueden crear productos');
    }

    if (!proveedor.isActive) {
      throw new BadRequestException('Tu cuenta de proveedor está inactiva. Contacta al administrador.');
    }

    // 2. Verificar que el nombre del producto sea único para este proveedor
    const productoExistente = await this.productoRepository.findOne({
      where: { 
        nombre: createProductoDto.nombre,
        proveedorId: proveedorId,
        deletedAt: IsNull(), //  Ignorar productos eliminados
      }
    });

    if (productoExistente) {
      throw new BadRequestException('Ya tienes un producto con este nombre');
    }

    // 3.  Subir imagen optimizada a Firebase Storage si se proporciona
    let imagenUrl: string | undefined;
    if (imageFile) {
      const result = await this.firebaseService.uploadImage(imageFile, 'productos', {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: 'webp',
        thumbnail: true,
      });
      
      imagenUrl = result.url;
      console.log(` Imagen subida para producto: ${imagenUrl}`);
    }

    // 4. Crear el producto
    const producto = this.productoRepository.create({
      ...createProductoDto,
      proveedorId: proveedorId,
      imagen: imagenUrl,
      isApproved: false,
    });

    const savedProducto = await this.productoRepository.save(producto);

    return {
      message: 'Producto creado exitosamente. Pendiente de aprobación por el administrador.',
      producto: {
        id: savedProducto.id,
        nombre: savedProducto.nombre,
        descripcion: savedProducto.descripcion,
        precio: savedProducto.precio,
        imagen: savedProducto.imagen,
        isAvailable: savedProducto.isAvailable,
        isApproved: savedProducto.isApproved,
        proveedorId: savedProducto.proveedorId,
        createdAt: savedProducto.createdAt,
      }
    };
  }

  /**
   * 📋 OBTENER TODOS LOS PRODUCTOS APROBADOS con likes y ratings
   */
  async findAll(userId?: string) {
    const productos = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.proveedor', 'proveedor')
      .leftJoin('producto.ratings', 'ratings', 'ratings.deletedAt IS NULL')
      .leftJoin('producto.likes', 'likes')
      .leftJoin('likes.user', 'likeUser', 'likeUser.id = :userId', { userId: userId || '' })
      .addSelect([
        'COUNT(DISTINCT ratings.id) as totalRatings',
        'COALESCE(AVG(ratings.rating), 0) as averageRating',
        'COUNT(DISTINCT likes.id) as totalLikes',
        'CASE WHEN likeUser.id IS NOT NULL THEN true ELSE false END as isLiked'
      ])
      .where('producto.isApproved = :isApproved', { isApproved: true })
      .andWhere('producto.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('producto.deletedAt IS NULL')
      .groupBy('producto.id')
      .addGroupBy('proveedor.id')
      .addGroupBy('likeUser.id')
      .orderBy('producto.createdAt', 'DESC')
      .getRawAndEntities();

    const productosConEstadisticas = productos.entities.map((producto, index) => ({
      ...producto,
      totalRatings: parseInt(productos.raw[index].totalRatings) || 0,
      averageRating: parseFloat(productos.raw[index].averageRating) || 0,
      totalLikes: parseInt(productos.raw[index].totalLikes) || 0,
      isLiked: productos.raw[index].isLiked === 'true' || productos.raw[index].isLiked === true,
    }));

    return {
      total: productosConEstadisticas.length,
      productos: productosConEstadisticas,
    };
  }

  /**
   *  OBTENER UN PRODUCTO POR ID con estadísticas
   */
  async findOne(id: string, userId?: string) {
    const producto = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.proveedor', 'proveedor')
      .leftJoin('producto.ratings', 'ratings', 'ratings.deletedAt IS NULL')
      .leftJoin('producto.likes', 'likes')
      .leftJoin('likes.user', 'likeUser', 'likeUser.id = :userId', { userId: userId || '' })
      .addSelect([
        'COUNT(DISTINCT ratings.id) as totalRatings',
        'COALESCE(AVG(ratings.rating), 0) as averageRating',
        'COUNT(DISTINCT likes.id) as totalLikes',
        'CASE WHEN likeUser.id IS NOT NULL THEN true ELSE false END as isLiked'
      ])
      .where('producto.id = :id', { id })
      .groupBy('producto.id')
      .addGroupBy('proveedor.id')
      .addGroupBy('likeUser.id')
      .getRawAndEntities();

    if (!producto.entities[0]) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return {
      ...producto.entities[0],
      totalRatings: parseInt(producto.raw[0].totalRatings) || 0,
      averageRating: parseFloat(producto.raw[0].averageRating) || 0,
      totalLikes: parseInt(producto.raw[0].totalLikes) || 0,
      isLiked: producto.raw[0].isLiked === 'true' || producto.raw[0].isLiked === true,
    };
  }

  /**
   *  MIS PRODUCTOS (proveedor autenticado)
   */
  async findMyProducts(proveedorId: string) {
    const productos = await this.productoRepository.find({
      where: { 
        proveedorId,
        deletedAt: IsNull(), //  Corrección
      },
      order: { createdAt: 'DESC' }
    });

    return {
      total: productos.length,
      productos,
    };
  }

  /**
   *  PRODUCTOS DE UN PROVEEDOR ESPECÍFICO (público)
   */
  async findByProveedor(proveedorId: string) {
    const proveedor = await this.userRepository.findOne({
      where: { id: proveedorId }
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const productos = await this.productoRepository.find({
      where: { 
        proveedorId,
        isApproved: true,
        isAvailable: true,
        deletedAt: IsNull(), //  Corrección
      },
      order: { createdAt: 'DESC' }
    });

    return {
      proveedor: {
        id: proveedor.id,
        fullName: proveedor.fullName,
        nombreEmpresa: proveedor.nombreEmpresa,
        direccion: proveedor.direccion,
        telefono: proveedor.telefono,
        wasap: proveedor.wasap,
      },
      total: productos.length,
      productos,
    };
  }

  /**
   * PRODUCTOS PENDIENTES DE APROBACIÓN (solo admin)
   */
  async findPendingApproval() {
    const productos = await this.productoRepository.find({
      where: { 
        isApproved: false,
        deletedAt: IsNull(), // Corrección
      },
      relations: ['proveedor'],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        imagen: true,
        isAvailable: true,
        isApproved: true,
        createdAt: true,
        proveedorId: true, //  Agregar
        proveedor: {
          id: true,
          fullName: true,
          nombreEmpresa: true,
          email: true,
        }
      },
      order: { createdAt: 'DESC' }
    });

    return {
      total: productos.length,
      productos,
    };
  }

  /**
   *  ACTUALIZAR PRODUCTO
   */
  async update(
    id: string,
    updateProductoDto: UpdateProductoDto,
    userId: string,
    userRole: UserRoles,
    imageFile?: Express.Multer.File
  ) {
    // Primero obtener el producto completo sin restricciones de select
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['proveedor'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Verificar permisos
    if (userRole !== UserRoles.ADMIN && producto.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar este producto');
    }

    //  Actualizar imagen si se proporciona una nueva
    let imagenUrl = producto.imagen;
    if (imageFile) {
      const result = await this.firebaseService.updateImage(
        producto.imagen || null, // Manejar caso de undefined
        imageFile,
        'productos',
        {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          format: 'webp',
          thumbnail: true,
        }
      );
      imagenUrl = result.url;
      console.log(` Imagen actualizada para producto ${id}: ${imagenUrl}`);
    }

    // Si un proveedor actualiza, marcar como no aprobado nuevamente
    const updateData = {
      ...updateProductoDto,
      imagen: imagenUrl,
      updatedAt: new Date(),
      ...(userRole === UserRoles.PROVEEDOR && { isApproved: false })
    };

    await this.productoRepository.update(id, updateData);

    // Obtener producto actualizado
    const updatedProducto = await this.productoRepository.findOne({
      where: { id },
      relations: ['proveedor'],
    });

    return {
      message: userRole === UserRoles.PROVEEDOR 
        ? 'Producto actualizado. Pendiente de aprobación por el administrador.'
        : 'Producto actualizado exitosamente',
      producto: updatedProducto
    };
  }

  /**
   *  APROBAR PRODUCTO (solo admin)
   */
  async approveProduct(id: string) {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (producto.isApproved) {
      throw new BadRequestException('Este producto ya está aprobado');
    }

    await this.productoRepository.update(id, {
      isApproved: true,
      updatedAt: new Date()
    });

    return {
      message: 'Producto aprobado exitosamente',
      producto: await this.productoRepository.findOne({
        where: { id },
        relations: ['proveedor']
      })
    };
  }

  /**
   *  RECHAZAR PRODUCTO (solo admin)
   */
  async rejectProduct(id: string, razon?: string) {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    await this.productoRepository.update(id, {
      isApproved: false,
      isAvailable: false,
      updatedAt: new Date()
    });

    return {
      message: 'Producto rechazado',
      razon: razon || 'No cumple con los requisitos',
      productoId: id
    };
  }

  /**
   *  ELIMINAR PRODUCTO (soft delete)
   */
  async remove(id: string, userId: string, userRole: UserRoles) {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (userRole !== UserRoles.ADMIN && producto.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este producto');
    }

    // Eliminar imagen de Firebase Storage
    if (producto.imagen) {
      await this.firebaseService.deleteImage(producto.imagen, true);
      console.log(` Imagen eliminada de Firebase para producto ${id}`);
    }

    // Soft delete
    await this.productoRepository.update(id, {
      deletedAt: new Date(),
      isAvailable: false
    });

    return {
      message: 'Producto eliminado exitosamente',
      productoId: id
    };
  }

  /**
   * ELIMINAR PRODUCTO PERMANENTEMENTE (solo admin)
   */
  async hardRemove(id: string) {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Eliminar imagen de Firebase
    if (producto.imagen) {
      await this.firebaseService.deleteImage(producto.imagen, true);
    }

    // Eliminar de la base de datos
    await this.productoRepository.delete(id);

    return {
      message: 'Producto eliminado permanentemente',
      productoId: id
    };
  }

  /**
   *  CAMBIAR DISPONIBILIDAD
   */
  async toggleAvailability(id: string, userId: string, userRole: UserRoles) {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (userRole !== UserRoles.ADMIN && producto.proveedorId !== userId) {
      throw new ForbiddenException('No tienes permiso para cambiar la disponibilidad');
    }

    const newAvailability = !producto.isAvailable;

    await this.productoRepository.update(id, {
      isAvailable: newAvailability,
      updatedAt: new Date()
    });

    return {
      message: `Producto ${newAvailability ? 'disponible' : 'no disponible'}`,
      isAvailable: newAvailability,
      productoId: id
    };
  }
}
