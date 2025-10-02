import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        private usersService: UsersService,
        configService: ConfigService,
    ){
         super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'mi-secreto-super-seguro',
        });
    }

    async validate(payload: any) { 
        const { sub: id } = payload;
        
        const user = await this.usersService.findOne(id);
        
        if (!user) {
            throw new UnauthorizedException('Token no válido');
        }

        if (!user.isActive) { 
            throw new UnauthorizedException('Usuario inactivo');
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