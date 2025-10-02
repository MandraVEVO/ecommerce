import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';

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

    console.log('🔍 Register data:', {
      email,
      fullName,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    if (!password) {
      throw new UnauthorizedException('La contraseña es requerida');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('🔍 Hashed password:', {
      original: password,
      hashed: hashedPassword.substring(0, 20) + '...',
      hashedLength: hashedPassword.length
    });

    const newUser = await this.usersService.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
    });

    console.log('User created:', {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName
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
}
