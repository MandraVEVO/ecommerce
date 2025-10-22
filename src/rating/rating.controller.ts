import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ProveedorResponseDto } from './dto/proveedor-response.dto';
import { Auth } from '../common/decorators/auth.decorator';
import { GetUser } from '../common/decorators/getUser.decorator';
import { UserRoles } from '../common/enums/user-roles.enum';

@ApiTags('Calificaciones y Reseñas')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  /**
   *  CREAR CALIFICACIÓN (Solo Clientes)
   */
  @Auth(UserRoles.CLIENTE)
  @Post('producto/:productoId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: ' Crear calificación para un producto (Solo Clientes)',
    description: 'Los clientes pueden calificar y dejar reseñas en productos'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Calificación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya calificaste este producto' })
  @ApiResponse({ status: 403, description: 'Solo clientes pueden calificar' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  create(
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Body() createRatingDto: CreateRatingDto,
    @GetUser() user: any
  ) {
    return this.ratingService.create(createRatingDto, productoId, user.id);
  }

  /**
   *  VER CALIFICACIONES DE UN PRODUCTO (Público)
   */
  @Get('producto/:productoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Ver todas las calificaciones de un producto (Público)',
    description: 'Obtiene todas las calificaciones, promedio y distribución de estrellas'
  })
  @ApiResponse({ status: 200, description: 'Calificaciones obtenidas exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findByProducto(@Param('productoId', ParseUUIDPipe) productoId: string) {
    return this.ratingService.findByProducto(productoId);
  }

  /**
   * MIS CALIFICACIONES (Cliente autenticado)
   */
  @Auth(UserRoles.CLIENTE)
  @Get('mis-calificaciones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Ver mis calificaciones (Solo Clientes)',
    description: 'Obtiene todas las calificaciones que he realizado'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Calificaciones obtenidas exitosamente' })
  findMyRatings(@GetUser() user: any) {
    return this.ratingService.findMyRatings(user.id);
  }

  /**
   * ACTUALIZAR MI CALIFICACIÓN (Solo el autor)
   */
  @Auth(UserRoles.CLIENTE)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Actualizar mi calificación (Solo Clientes)',
    description: 'Permite editar una calificación existente'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Calificación actualizada exitosamente' })
  @ApiResponse({ status: 403, description: 'Solo puedes editar tus propias calificaciones' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @GetUser() user: any
  ) {
    return this.ratingService.update(id, updateRatingDto, user.id);
  }

  /**
   *  RESPONDER A CALIFICACIÓN (Solo Proveedor o Admin)
   */
  @Auth(UserRoles.PROVEEDOR, UserRoles.ADMIN)
  @Post(':id/responder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Responder a una calificación (Solo Proveedor o Admin)',
    description: 'El proveedor del producto puede responder a las reseñas de sus clientes'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Respuesta agregada exitosamente' })
  @ApiResponse({ status: 403, description: 'Solo el proveedor del producto puede responder' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  respondToRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() proveedorResponseDto: ProveedorResponseDto,
    @GetUser() user: any
  ) {
    return this.ratingService.respondToRating(id, proveedorResponseDto, user.id, user.role);
  }

  /**
   *  ELIMINAR CALIFICACIÓN (Solo el autor o Admin)
   */
  @Auth(UserRoles.CLIENTE, UserRoles.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Eliminar mi calificación (Solo el autor o Admin)',
    description: 'Elimina una calificación (soft delete)'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Calificación eliminada exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para eliminar esta calificación' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: any
  ) {
    return this.ratingService.remove(id, user.id, user.role);
  }
}
