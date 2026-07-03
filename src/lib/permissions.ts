import { PosUser, UserRole } from "./types";

export const normalizeRole = (rol?: string): UserRole | undefined => {
  if (!rol) return undefined;
  const upper = rol.toUpperCase();
  if (upper === "EMPLEADO" || upper === "CONCESION_VENDEDOR") {
    return UserRole.VENDEDOR;
  }
  if (upper === UserRole.SUPERADMIN || upper === "CONCESION_SUPERADMIN") {
    return UserRole.SUPERADMIN;
  }
  if (upper === UserRole.ADMIN || upper === "CONCESION_ADMIN") {
    return UserRole.ADMIN;
  }
  if (upper === UserRole.VENDEDOR) return UserRole.VENDEDOR;
  return undefined;
};

export type PermissionFlags = {
  role: UserRole | undefined;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
  concesionId?: string | null;
  sucursalId?: string | null;
  cajaId?: string | null;
  canAccessSuperAdmin: boolean;
  canManageConcessions: boolean;
  canManageUsers: boolean;
  canManageZonas: boolean;
  canManageProducts: boolean;
  canManageSucursales: boolean;
  canManageEquipo: boolean;
  canManageInventario: boolean;
  canManageCombos: boolean;
  canManageDescuentos: boolean;
  canManageVentas: boolean;
  canManageCortes: boolean;
  canViewProducts: boolean;
  canViewInventario: boolean;
  canViewVentas: boolean;
  canViewCortes: boolean;
  canViewSucursales: boolean;
};

export const getPermissions = (posUser: PosUser | null | undefined): PermissionFlags => {
  const role = normalizeRole(
    typeof posUser?.rol === "string" ? posUser.rol : undefined,
  );
  const isSuperAdmin =
    role === UserRole.SUPERADMIN ||
    posUser?.admin === true ||
    posUser?.isAdmin === true;
  const isAdmin = role === UserRole.ADMIN;
  const isVendedor = role === UserRole.VENDEDOR;
  const concesionId = (posUser?.concesionId as string | null | undefined) ?? null;
  const sucursalId = (posUser?.sucursalId as string | null | undefined) ?? null;
  const cajaId = (posUser?.cajaId as string | null | undefined) ?? null;

  return {
    role,
    isSuperAdmin,
    isAdmin,
    isVendedor,
    concesionId,
    sucursalId,
    cajaId,
    canAccessSuperAdmin: isSuperAdmin,
    canManageConcessions: isSuperAdmin,
    canManageUsers: isSuperAdmin,
    canManageZonas: isSuperAdmin,
    canManageProducts: isAdmin || isSuperAdmin,
    canManageSucursales: isSuperAdmin,
    canManageEquipo: isSuperAdmin,
    canManageInventario: isSuperAdmin,
    canManageCombos: isSuperAdmin,
    canManageDescuentos: isSuperAdmin,
    canManageVentas: isAdmin || isVendedor,
    canManageCortes: isAdmin || isVendedor,
    canViewProducts: isSuperAdmin || isAdmin || isVendedor,
    canViewInventario: isSuperAdmin || isAdmin || isVendedor,
    canViewVentas: isSuperAdmin || isAdmin || isVendedor,
    canViewCortes: isSuperAdmin || isAdmin || isVendedor,
    canViewSucursales: isSuperAdmin || isAdmin,
  };
};

export const getDefaultRouteForRole = (posUser: PosUser | null | undefined): string => {
  const perms = getPermissions(posUser);
  if (perms.isSuperAdmin) return "/superAdmin/dashboard";
  if (perms.isAdmin) return "/admin/dashboard";
  if (perms.isVendedor) return "/inventarios";
  return "/login";
};
