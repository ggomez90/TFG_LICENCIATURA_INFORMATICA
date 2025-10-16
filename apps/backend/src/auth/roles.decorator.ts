// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = 'ADMIN' | 'OPERARIO' | 'CLIENTE';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
