import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET") || "mi-secreto-super-seguro",
      passReqToCallback: true, // Para acceder al request
    });
  }

  async validate(req: any, payload: any) {
    const { sub: id } = payload;

    // Verificar si el token está en blacklist
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException("Token revocado");
      }
    }

    const user = await this.usersService.findById(id);

    if (!user) {
      throw new UnauthorizedException("Token no válido");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Usuario inactivo");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}