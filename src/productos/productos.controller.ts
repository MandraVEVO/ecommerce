import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Auth } from '../common/decorators/auth.decorator';
import { GetUser } from '../common/decorators/getUser.decorator';
import { UserRoles } from '../common/enums/user-roles.enum';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('🛍️ Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // CREAR PRODUCTO con imagen
  @Auth(UserRoles.PROVEEDOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen')) //  'imagen' debe coincidir con el campo del FormData
  @ApiOperation({ 
    summary: ' Crear producto con imagen (Solo Proveedores)',
    description: 'Crear un nuevo producto con imagen optimizada'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Carne de Res' },
        descripcion: { type: 'string', example: 'Carne de res fresquita' },
        precio: { type: 'number', example: 250 }, // Aunque viene como string, se convierte
        isAvailable: { type: 'boolean', example: true },
        imagen: { 
          type: 'string', 
          format: 'binary', 
          description: 'Archivo de imagen (JPEG, PNG, WEBP, GIF)'
        },
      },
      required: ['nombre', 'precio']
    }
  })
  @ApiBearerAuth('JWT-auth')
  create(
    @Body() createProductoDto: CreateProductoDto, // NestJS parseará automáticamente el FormData
    @GetUser() user: any,
    @UploadedFile() imagen?: Express.Multer.File
  ) {
    console.log(' DTO Recibido:', createProductoDto);
    console.log('  Imagen:', imagen?.originalname);
    return this.productosService.create(createProductoDto, user.id, imagen);
  }

  //  LISTAR TODOS LOS PRODUCTOS APROBADOS (público)
  @Public()
  @Get()
  @ApiOperation({ 
    summary: ' Listar todos los productos aprobados',
    description: 'Obtener lista de productos aprobados y disponibles. No requiere autenticación.'
  })
  @ApiResponse({ status: 200, description: ' Lista de productos' })
  findAll() {
    return this.productosService.findAll();
  }

  // MIS PRODUCTOS (proveedor autenticado)
  @Auth(UserRoles.PROVEEDOR)
  @Get('mis-productos')
  @ApiOperation({ 
    summary: ' Mis productos (Solo Proveedor)',
    description: 'Obtener todos mis productos como proveedor (aprobados y pendientes).'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: ' Lista de mis productos' })
  findMyProducts(@GetUser() user: any) {
    return this.productosService.findMyProducts(user.id);
  }

  // PRODUCTOS PENDIENTES (solo admin)
  @Auth(UserRoles.ADMIN)
  @Get('pendientes')
  @ApiOperation({ 
    summary: ' Productos pendientes de aprobación (Solo Admin)',
    description: 'Obtener productos pendientes de aprobación por el administrador.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Lista de productos pendientes' })
  findPending() {
    return this.productosService.findPendingApproval();
  }

  // PRODUCTOS DE UN PROVEEDOR ESPECÍFICO (público)
  @Public()
  @Get('proveedor/:proveedorId')
  @ApiOperation({ 
    summary: ' Productos de un proveedor',
    description: 'Obtener todos los productos aprobados de un proveedor específico.'
  })
  @ApiParam({ name: 'proveedorId', description: 'UUID del proveedor' })
  @ApiResponse({ status: 200, description: 'Productos del proveedor' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  findByProveedor(@Param('proveedorId', ParseUUIDPipe) proveedorId: string) {
    return this.productosService.findByProveedor(proveedorId);
  }

  //  VER UN PRODUCTO
  @Public()
  @Get(':id')
  @ApiOperation({ 
    summary: ' Ver producto',
    description: 'Obtener detalles completos de un producto específico.'
  })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Detalles del producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOne(id);
  }

  //  APROBAR PRODUCTO (solo admin)
  @Auth(UserRoles.ADMIN)
  @Patch(':id/aprobar')
  @ApiOperation({ 
    summary: ' Aprobar producto (Solo Admin)',
    description: 'Aprobar un producto para que sea visible públicamente.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: ' Producto aprobado' })
  @ApiResponse({ status: 400, description: ' Producto ya aprobado' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.approveProduct(id);
  }

  //  RECHAZAR PRODUCTO (solo admin)
  @Auth(UserRoles.ADMIN)
  @Patch(':id/rechazar')
  @ApiOperation({ 
    summary: ' Rechazar producto (Solo Admin)',
    description: 'Rechazar un producto y marcarlo como no disponible.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        razon: { type: 'string', example: 'Imagen no adecuada' }
      }
    }
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('razon') razon?: string
  ) {
    return this.productosService.rejectProduct(id, razon);
  }

  //  CAMBIAR DISPONIBILIDAD
  @Auth(UserRoles.PROVEEDOR, UserRoles.ADMIN)
  @Patch(':id/disponibilidad')
  @ApiOperation({ 
    summary: ' Cambiar disponibilidad',
    description: 'Activar/desactivar la disponibilidad del producto.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  toggleAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: any
  ) {
    return this.productosService.toggleAvailability(id, user.id, user.role);
  }

  //  ACTUALIZAR PRODUCTO
  @Auth(UserRoles.PROVEEDOR, UserRoles.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen'))
  @ApiOperation({ 
    summary: ' Actualizar producto',
    description: 'Actualizar un producto con opción de cambiar la imagen. Solo el proveedor dueño o admin.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        precio: { type: 'number' },
        isAvailable: { type: 'boolean' },
        imagen: { type: 'string', format: 'binary' },
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: ' Producto actualizado' })
  @ApiResponse({ status: 403, description: ' No autorizado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @GetUser() user: any,
    @UploadedFile() imagen?: Express.Multer.File
  ) {
    return this.productosService.update(id, updateProductoDto, user.id, user.role, imagen);
  }

  // ELIMINAR PRODUCTO (soft delete)
  @Auth(UserRoles.PROVEEDOR, UserRoles.ADMIN)
  @Delete(':id')
  @ApiOperation({ 
    summary: ' Eliminar producto',
    description: 'Eliminar un producto (soft delete). Solo el proveedor dueño o admin.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: ' Producto eliminado' })
  @ApiResponse({ status: 403, description: ' No autorizado' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: any
  ) {
    return this.productosService.remove(id, user.id, user.role);
  }

  // ELIMINAR PERMANENTEMENTE (solo admin)
  @Auth(UserRoles.ADMIN)
  @Delete(':id/permanente')
  @ApiOperation({ 
    summary: ' Eliminar permanentemente (Solo Admin)',
    description: 'Eliminar un producto de forma permanente de la base de datos.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.hardRemove(id);
  }
}
