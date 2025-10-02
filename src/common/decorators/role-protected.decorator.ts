import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '../enums/user-roles.enum';

export const META_ROLES = 'roles';

export const RoleProtectedDecoratorsTs = (...args: UserRoles[]) => {
    return SetMetadata(META_ROLES, args);
};