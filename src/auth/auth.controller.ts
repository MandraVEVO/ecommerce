import { 
  Controller, 
  Post, 
  Body, 
  Get,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { GetUser } from '../common/decorators/getUser.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Authentication')
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

 
  

  
}
