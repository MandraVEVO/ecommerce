import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  CanActivate 
} from '@nestjs/common';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  
  // Store para tokens invalidados (en producción usa Redis)
  private invalidatedTokens = new Set<string>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no encontrado');
    }

    // Verificar si el token está en la blacklist
    if (this.invalidatedTokens.has(token)) {
      throw new UnauthorizedException('Token ha sido invalidado (logout)');
    }

    return true;
  }

  // Método para invalidar token (llamar en logout)
  invalidateToken(token: string): void {
    this.invalidatedTokens.add(token);
  }

  // Método para verificar si un token está invalidado
  isTokenInvalidated(token: string): boolean {
    return this.invalidatedTokens.has(token);
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}