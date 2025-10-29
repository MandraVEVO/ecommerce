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
  findAllProveedoresActivos() {
    return this.usersService.findAllProveedores();
  }


  @Auth(UserRoles.ADMIN)
  @Get('inactivos')
  @ApiOperation({ 
    summary: ' Listar todos los proveedores inactivos',
    description: 'Obtener lista completa de proveedores inactivos disponibles solo lo puede visualizar el admin'
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
          isActive: false,
          createdAt: "2025-02-10T10:00:00.000Z"
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          email: "proveedor2@example.com",
          fullName: "Comercial XYZ Ltda.",
          role: "proveedor",
          isActive: false,
          createdAt: "2025-02-09T15:30:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: ' Lista vacía si no hay proveedores inactivos',
    schema: {
      example: []
    }
  })
  findAllProveedoresInactivos(){
    return this.usersService.findAllProveedoresInactivos();
  }



  @Auth(UserRoles.ADMIN,UserRoles.CLIENTE)
  @Patch('proveedor/:id')
  @ApiOperation({ 
    summary: ' Actualizar perfil completo de proveedor',
    description: 'Actualizar toda la información del perfil de un proveedor, esto para solicitar al admin porque lo pondra en inactivo.'
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



  @Auth(UserRoles.CLIENTE,UserRoles.PROVEEDOR)
  @Delete('delete/:id')
  @ApiOperation({ 
    summary: ' Eliminar (soft) de perfil ',
    description: 'Eliminacion (soft) de un perfil de provedor por su ID, esto lo puede hacer cliente y proveedor'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ 
    name: 'id', 
    description: 'UUID ',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil eliminado actualizado exitosamente'
  })
  remove(@Param('id') id: string) {
    return this.usersService.softRemove(id);
  }

  @Auth(UserRoles.ADMIN)
  @Delete('deleteadmin/:id')
  @ApiOperation({ 
    summary: ' Eliminar perfil de forma permanente (Solo Admin)',
    description: 'Eliminacion (permanente) de un perfil de provedor por su ID, esto lo puede hacer solo un admin'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ 
    name: 'id', 
    description: 'UUID ',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil eliminado actualizado exitosamente'
  })
  removebyadmin(@Param('id') id: string) {
    return this.usersService.hardRemove(id);
  }

  @Auth(UserRoles.ADMIN)
  @Patch('update-role-to-proveedor/:id')
  @ApiOperation({ 
    summary: ' Actualizar rol a proveedor (Solo Admin)',
    description: 'Cambiar el rol de un usuario a proveedor. Solo disponible para administradores.'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        message: "Rol actualizado a proveedor exitosamente",
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez",
          role: "proveedor",
          isActive: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Acceso denegado - Solo administradores',
    schema: {
      example: {
        statusCode: 403,
        message: "Usuario test@example.com necesita uno de estos roles: [admin]. Rol actual: cliente",
        error: "Forbidden"
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: "Usuario no encontrado",
        error: "Not Found"
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Usuario ya es proveedor o no puede ser actualizado',
    schema: {
      example: {
        statusCode: 404,
        message: "Usuario no encontrado",
        error: "Not Found"
      }
    }
  })
  async updateRoleToProveedor(
    @Param('id') userId: string,
    
  ) {
    return this.usersService.updateProveedorActive(userId);
  }


  @Patch('update-role-to-admin/:id')
  @ApiOperation({ 
    summary: ' Actualizar rol a admin',
    description: 'Cambiar el rol de un usuario a admin'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        message: "Rol actualizado a admin exitosamente",
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez",
          role: "admin",
          isActive: true
        }
      }
    }
  })
 
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: "Usuario no encontrado",
        error: "Not Found"
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Usuario ya es admin o no puede ser actualizado',
    schema: {
      example: {
        statusCode: 404,
        message: "Usuario no encontrado",
        error: "Not Found"
      }
    }
  })
  async updateRoleToAdmin(
    @Param('id') userId: string
  ) {
    return this.usersService.updateToAdmin(userId);
  }


  @Auth(UserRoles.ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los usuarios',
    schema: {
      example: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez",
          role: "cliente",
          isActive: true
        }
      ]
    }
  })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

}
