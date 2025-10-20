import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { UserRoles } from '../common/enums/user-roles.enum';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmailWithPassword(email);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    

    if (!user.password) {
      console.error('Password is null/undefined for user:', user.email);
      throw new UnauthorizedException('Error interno de autenticación');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return this.generateJwt(user);
  }

  async register(registerDto: RegisterDto) {
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

    

    return this.generateJwt(newUser);
  }

  private generateJwt(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '4h',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      }
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token inválido');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
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

    // 6. ✅ Actualizar usando el método específico de UsersService
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
