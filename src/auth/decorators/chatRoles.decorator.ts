import { SetMetadata } from "@nestjs/common"
import { $Enums } from "prisma/src/generated/prisma/client"

export const ROLES_KEY = 'roles'

export const ChatRoles = (...roles: $Enums.ChatRole[]) => SetMetadata(ROLES_KEY, roles)