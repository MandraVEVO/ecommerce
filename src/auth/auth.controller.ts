import { 
  Controller, 
  Post, 
  Body, 
  Get,
  Patch,
  Param, 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { Auth } from '../common/decorators/auth.decorator'; // ✅ Agregar este import
import { GetUser } from '../common/decorators/getUser.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRoles } from '../common/enums/user-roles.enum'; // ✅ Agregar este import

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario',
    description: 'Crear una nueva cuenta de usuario con email, nombre completo y contraseña'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario registrado exitosamente :)',
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        token_type: "Bearer",
        expires_in: "4h",
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez González",
          role: "cliente",
          isActive: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Email ya registrado',
    schema: {
      example: {
        statusCode: 401,
        message: "El email ya está registrado",
        error: "Unauthorized"
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autenticar usuario con email y contraseña para obtener token JWT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login hecho papu',
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        token_type: "Bearer",
        expires_in: "4h",
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez González",
          role: "cliente",
          isActive: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas',
    schema: {
      example: {
        statusCode: 401,
        message: "Credenciales inválidas",
        error: "Unauthorized"
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Auth(UserRoles.ADMIN)
  @Patch('update-role-to-proveedor/:userId')
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
    @Param('userId') userId: string,
    
  ) {
    return this.authService.updateProveedor(userId);
  }


  @Patch('update-role-to-admin/:userId')
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
    @Param('userId') userId: string
  ) {
    return this.authService.updateToAdmin(userId);
  }

  


}
