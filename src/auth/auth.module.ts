import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; //IMPORTANTE: Importar ConfigModule

// Services y Controllers
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// Modules
import { UsersModule } from '../users/users.module';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Necesita UsersService y ConfigService
  ],
  imports: [
    ConfigModule,
    
    UsersModule,
    
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    JwtModule.registerAsync({
      imports: [ConfigModule], //ConfigModule también aquí
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'mi-secreto-super-seguro',
        signOptions: {
          expiresIn: '4h',
        },
      }),
    }),
  ],
  exports: [
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
