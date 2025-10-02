import { 
  BadRequestException, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  Injectable 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRoles } from '../../enums/user-roles.enum';

export const META_ROLES = 'roles';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const validRoles: UserRoles[] = this.reflector.get(META_ROLES, context.getHandler());

    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new BadRequestException('User not found in request');
    }

   

    const userRole = user.role; // 'usuario', 'empresa', 'admin'
    
    if (!userRole) {
      console.log('No se encontró rol en el usuario');
      throw new ForbiddenException('Usuario sin rol asignado');
    }

    const hasValidRole = validRoles.includes(userRole as UserRoles);
    
    if (hasValidRole) {
      console.log('Acceso permitido - Rol válido:', userRole);
      return true;
    }

    throw new ForbiddenException(
      `Usuario ${user.nombre || user.email} necesita uno de estos roles: [${validRoles.join(', ')}]. Rol actual: ${userRole}`
    );
  }
}