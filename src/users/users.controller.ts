import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { User } from './entities/user.entity';
import { UserRoles } from 'src/common/enums/user-roles.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/getUser.decorator';
import { UpdateProveedorDto } from './dto/updateProveedor.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Public() // Endpoint público para que cualquiera vea proveedores
  @Get()
  @ApiOperation({ 
    summary: ' Listar todos los proveedores activos',
    description: 'Obtener lista completa de proveedores activos disponibles en la plataforma. No requiere autenticación.'
  })
  @ApiResponse({ 
    status: 200, 
    description: ' Lista de proveedores obtenida exitosamente',
    schema: {
      example: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "proveedor1@example.com",
          fullName: "Empresa ABC S.A.",
          role: "proveedor",
          isActive: true,
          createdAt: "2025-02-10T10:00:00.000Z"
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          email: "proveedor2@example.com",
          fullName: "Comercial XYZ Ltda.",
          role: "proveedor",
          isActive: true,
          createdAt: "2025-02-09T15:30:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: ' Lista vacía si no hay proveedores',
    schema: {
      example: []
    }
  })
  findAll() {
    return this.usersService.findAllProveedores();
  }
  ///clientes 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }



  @Auth(UserRoles.PROVEEDOR, UserRoles.ADMIN)
  @Patch('proveedor/:id')
  @ApiOperation({ 
    summary: ' Actualizar perfil completo de proveedor',
    description: 'Actualizar toda la información del perfil de un proveedor.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ 
    name: 'id', 
    description: 'UUID del proveedor',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil de proveedor actualizado exitosamente'
  })
  async updateProveedorProfile(
    @Param('id') id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
    @GetUser() currentUser: any
  ) {
    // Los proveedores solo pueden actualizar su propio perfil
    if (currentUser.role !== UserRoles.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Solo puedes actualizar tu propio perfil');
    }

    return this.usersService.updateProveedor(id, updateProveedorDto);
  }

   @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProveedor(id, updateUserDto);
  }

  @Auth(UserRoles.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.softRemove(id);
  }
}
