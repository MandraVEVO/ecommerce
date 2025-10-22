import { 
  Controller, 
  Post, 
  Body, 
  Get,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { Auth } from '../common/decorators/auth.decorator';
import { GetUser } from '../common/decorators/getUser.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRoles } from '../common/enums/user-roles.enum';

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: ' Registrar nuevo usuario',
    description: 'Crear una nueva cuenta de usuario con email, nombre completo y contraseña'
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.register(registerDto, userAgent, ipAddress);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Iniciar sesión',
    description: 'Autenticar usuario y obtener access token y refresh token'
  })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  //  REFRESH TOKEN
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: ' Refrescar access token',
    description: 'Obtener un nuevo access token usando el refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Access token renovado exitosamente',
    schema: {
      example: {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        token_type: "Bearer",
        expires_in: "15m",
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          fullName: "Juan Pérez",
          role: "cliente",
          isActive: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token inválido o expirado',
    schema: {
      example: {
        statusCode: 401,
        message: "Refresh token inválido o revocado",
        error: "Unauthorized"
      }
    }
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto);
  }

  //  LOGOUT
  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cerrar sesión',
    description: 'Cerrar sesión del usuario actual (revoca refresh tokens)'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión cerrada exitosamente',
    schema: {
      example: {
        message: "Sesión cerrada exitosamente",
        loggedOut: true
      }
    }
  })
  async logout(@GetUser() user: any, @Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  // LOGOUT DE TODOS LOS DISPOSITIVOS
  @Auth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cerrar sesión en todos los dispositivos',
    description: 'Revocar todas las sesiones activas del usuario'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Sesiones cerradas en todos los dispositivos' 
  })
  async logoutAll(@GetUser() user: any) {
    return this.authService.logoutAllDevices(user.id);
  }

  // VER SESIONES ACTIVAS
  @Auth()
  @Get('sessions')
  @ApiOperation({ 
    summary: 'Ver sesiones activas',
    description: 'Obtener lista de sesiones activas del usuario'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sesiones activas',
    schema: {
      example: [
        {
          id: "session-uuid",
          createdAt: "2025-02-10T10:00:00.000Z",
          expiresAt: "2025-02-17T10:00:00.000Z",
          userAgent: "Mozilla/5.0...",
          ipAddress: "192.168.1.1"
        }
      ]
    }
  })
  async getSessions(@GetUser() user: any) {
    return this.authService.getActiveSessions(user.id);
  }

  // REVOCAR SESIÓN ESPECÍFICA
  @Auth()
  @Delete('sessions/:sessionId')
  @ApiOperation({ 
    summary: ' Revocar sesión específica',
    description: 'Cerrar sesión en un dispositivo específico'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión revocada exitosamente' 
  })
  async revokeSession(
    @GetUser() user: any,
    @Param('sessionId') sessionId: string
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }




  // @Patch('update-role-to-admin/:userId')
  // @ApiOperation({ 
  //   summary: ' Actualizar rol a admin',
  //   description: 'Cambiar el rol de un usuario a admin'
  // })
  // @ApiBearerAuth('JWT-auth')
  // @ApiResponse({ 
  //   status: 200, 
  //   description: 'Rol actualizado exitosamente',
  //   schema: {
  //     example: {
  //       message: "Rol actualizado a admin exitosamente",
  //       user: {
  //         id: "550e8400-e29b-41d4-a716-446655440000",
  //         email: "user@example.com",
  //         fullName: "Juan Pérez",
  //         role: "admin",
  //         isActive: true
  //       }
  //     }
  //   }
  // })
 
  // @ApiResponse({ 
  //   status: 404, 
  //   description: 'Usuario no encontrado',
  //   schema: {
  //     example: {
  //       statusCode: 404,
  //       message: "Usuario no encontrado",
  //       error: "Not Found"
  //     }
  //   }
  // })
  // @ApiResponse({ 
  //   status: 400, 
  //   description: 'Usuario ya es admin o no puede ser actualizado',
  //   schema: {
  //     example: {
  //       statusCode: 404,
  //       message: "Usuario no encontrado",
  //       error: "Not Found"
  //     }
  //   }
  // })
  // async updateRoleToAdmin(
  //   @Param('userId') userId: string
  // ) {
  //   return this.authService.updateToAdmin(userId);
  // }

  


}
