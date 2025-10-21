import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { UserRoles } from '../common/enums/user-roles.enum';
import { RefreshToken } from './entities/refreshToken';
import { TokenBlacklist } from './entities/tokenBlacklist';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmailWithPassword(email);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.password) {
      throw new UnauthorizedException('Error interno de autenticación');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Generar access token y refresh token
    return this.generateTokens(user, userAgent, ipAddress);
  }

  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    if (!password) {
      throw new UnauthorizedException('La contraseña es requerida');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await this.usersService.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
    });

    //  Generar access token y refresh token
    return this.generateTokens(newUser, userAgent, ipAddress);
  }

  //  GENERAR ACCESS TOKEN Y REFRESH TOKEN
  private async generateTokens(user: any, userAgent?: string, ipAddress?: string) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };

    // Access token (corta duración - 15 minutos)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m'
    });

    // Refresh token (larga duración - 7 días)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d'
    });

    // Guardar refresh token en base de datos
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.refreshTokenRepository.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: '15m',
      refresh_expires_in: '7d',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      }
    };
  }

  //  REFRESH TOKEN - Obtener nuevo access token
  async refreshAccessToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verificar que el token es válido
      const payload = this.jwtService.verify(refreshToken);

      // Verificar que el refresh token existe en BD y no está revocado
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { 
          token: refreshToken,
          userId: payload.sub,
          isRevoked: false
        }
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      // Verificar que no haya expirado
      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token expirado');
      }

      // Verificar que el usuario existe y está activo
      const user = await this.usersService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      // Generar nuevo access token
      const newPayload = { 
        sub: user.id, 
        email: user.email,
        role: user.role 
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m'
      });

      return {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: '15m',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  //  LOGOUT - Invalidar tokens
  async logout(userId: string, accessToken?: string) {
    // Revocar todos los refresh tokens del usuario
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );

    // Agregar access token a la blacklist si se proporciona
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken);
        
        const expiresAt = new Date(payload.exp * 1000);

        await this.tokenBlacklistRepository.save({
          token: accessToken,
          userId,
          expiresAt,
          reason: 'User logout',
        });
      } catch (error) {
        // Si el token ya expiró, no es necesario agregarlo a blacklist
        console.log('Token ya expirado, no se agrega a blacklist');
      }
    }

    return {
      message: 'Sesión cerrada exitosamente',
      loggedOut: true,
    };
  }

  // LOGOUT DE TODOS LOS DISPOSITIVOS
  async logoutAllDevices(userId: string) {
    // Revocar todos los refresh tokens
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true }
    );

    return {
      message: 'Sesión cerrada en todos los dispositivos',
      loggedOut: true,
    };
  }

  //  VERIFICAR SI UN TOKEN ESTÁ EN BLACKLIST
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.tokenBlacklistRepository.findOne({
      where: { token }
    });

    return !!blacklisted;
  }

  //  OBTENER SESIONES ACTIVAS
  async getActiveSessions(userId: string) {
    const activeSessions = await this.refreshTokenRepository.find({
      where: { 
        userId, 
        isRevoked: false 
      },
      order: { createdAt: 'DESC' }
    });

    return activeSessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    }));
  }

  //  REVOCAR SESIÓN ESPECÍFICA
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.refreshTokenRepository.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    await this.refreshTokenRepository.update(sessionId, { isRevoked: true });

    return {
      message: 'Sesión revocada exitosamente',
      sessionId,
    };
  }

   async updateProveedor(userId: string) {
    // 1. Verificar que el usuario existe
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // 2. Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new BadRequestException('El usuario está inactivo y no puede ser actualizado');
    }

    // 3. Verificar que no sea ya un proveedor
    if (user.role === UserRoles.PROVEEDOR) {
      throw new BadRequestException('El usuario ya tiene rol de proveedor');
    }

    // 4. Verificar que no sea un admin
    if (user.role === UserRoles.ADMIN) {
      throw new BadRequestException('No se puede cambiar el rol de un administrador');
    }

    // 5. Guardar el rol anterior
    const previousRole = user.role;

    // 6. Actualizar usando el método específico de UsersService
    const updatedUser = await this.usersService.updateToProveedor(userId);

    // 7. Retornar respuesta completa
    return {
      message: 'Rol actualizado a proveedor exitosamente',
      previousRole: previousRole,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: new Date().toISOString(),
      }
    };
  }


  async updateToAdmin(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!user.isActive) {
      throw new BadRequestException('El usuario está inactivo y no puede ser actualizado');
    }

    const updatedUser = await this.usersService.updateToAdmin(userId);

    return {
      message: 'Rol actualizado a administrador exitosamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: new Date().toISOString(),
      }
    };
  }
}
