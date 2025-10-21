import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; 

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from './entities/refreshToken';
import { TokenBlacklist } from './entities/tokenBlacklist';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
  imports: [
    // IMPORTANTE: Importar ConfigModule
    ConfigModule,
    
    // Importar entidades de TypeORM
    TypeOrmModule.forFeature([RefreshToken, TokenBlacklist]),
    
    // Importar UsersModule para tener UsersService disponible
    UsersModule,
    
    //Configurar Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    //Configurar JWT con ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // IMPORTANTE: ConfigModule también aquí
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'mi-secreto-super-seguro',
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  exports: [
    JwtStrategy,
    PassportModule,
    JwtModule,
    AuthService, // Exportar AuthService para usar en JwtStrategy
  ],
})
export class AuthModule {}
