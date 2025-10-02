import { applyDecorators, UseGuards } from "@nestjs/common";
import { UserRoles } from "../enums/user-roles.enum";
import { RoleProtectedDecoratorsTs } from "./role-protected.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { UserRoleGuard } from "../guards/user-role/user-role.guard";


export function Auth(...roles: UserRoles[]) {
    return applyDecorators(
        RoleProtectedDecoratorsTs(...roles),
        UseGuards(JwtAuthGuard, UserRoleGuard),
        // ApiBearerAuth('JWT-auth'),
        // ApiUnauthorizedResponse({ description: 'No autorizado' }),
    );
}