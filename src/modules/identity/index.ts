/**
 * Public, framework-free API of the identity module. Safe to import from
 * anywhere, including client components. Server-only functions (sessions,
 * sign-in) live in `@/modules/identity/server`.
 */
export { ROLES, isRole, type Actor, type Role } from "./domain/roles";
export {
  can,
  type Permission,
  type PermissionArgs,
  type PermissionChecks,
} from "./domain/permissions";
export {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "./domain/credentials";
