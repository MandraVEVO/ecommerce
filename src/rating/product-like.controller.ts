import { 
  Controller, 
  Get, 
  Post, 
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProductLikesService } from './product-like.service';
import { Auth } from '../common/decorators/auth.decorator';
import { GetUser } from '../common/decorators/getUser.decorator';
import { UserRoles } from '../common/enums/user-roles.enum';

@ApiTags(' Likes de Productos')
@Controller('product-likes')
export class ProductLikesController {
  constructor(private readonly productLikesService: ProductLikesService) {}

  /**
   *  DAR/QUITAR LIKE (Toggle)
   */
  @Auth(UserRoles.CLIENTE)
  @Post(':productoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Dar o quitar like a un producto (Solo Clientes)',
    description: 'Toggle: Si no existe el like lo crea, si existe lo elimina'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Like agregado/eliminado exitosamente' })
  @ApiResponse({ status: 403, description: 'Solo clientes pueden dar like' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  toggleLike(
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @GetUser() user: any
  ) {
    return this.productLikesService.toggleLike(productoId, user.id);
  }

  /**
   *  MIS PRODUCTOS FAVORITOS
   */
  @Auth(UserRoles.CLIENTE)
  @Get('mis-favoritos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Ver mis productos favoritos (Solo Clientes)',
    description: 'Obtiene todos los productos a los que he dado like'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Productos favoritos obtenidos exitosamente' })
  getMyLikedProducts(@GetUser() user: any) {
    return this.productLikesService.getMyLikedProducts(user.id);
  }

  /**
   *  VERIFICAR SI DI LIKE A UN PRODUCTO
   */
  @Auth(UserRoles.CLIENTE)
  @Get('check/:productoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Verificar si di like a un producto (Solo Clientes)',
    description: 'Retorna true si el usuario dio like al producto, false si no'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Verificación exitosa' })
  async checkIfLiked(
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @GetUser() user: any
  ) {
    const isLiked = await this.productLikesService.checkIfLiked(productoId, user.id);
    return { isLiked };
  }

  /**
   *  TOTAL DE LIKES DE UN PRODUCTO (Público)
   */
  @Get('total/:productoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Ver total de likes de un producto (Público)',
    description: 'Retorna el número total de likes que tiene un producto'
  })
  @ApiResponse({ status: 200, description: 'Total de likes obtenido exitosamente' })
  async getTotalLikes(@Param('productoId', ParseUUIDPipe) productoId: string) {
    const total = await this.productLikesService.getTotalLikes(productoId);
    return { total };
  }
}