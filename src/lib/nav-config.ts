import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Building2,
  ClipboardList,
  IdCard,
  Layers,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import type { PermissionFlags } from "./permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: keyof PermissionFlags;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export function getDashboardNav(perms: PermissionFlags): NavGroup[] {
  const groups: NavGroup[] = [];

  if (perms.isSuperAdmin) {
    groups.push({
      title: "Principal",
      items: [
        {
          href: "/superAdmin/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    });
    groups.push({
      title: "Plataforma",
      items: [
        {
          href: "/superAdmin/concesiones",
          label: "Concesiones",
          icon: Building2,
          permission: "canManageConcessions",
        },
        {
          href: "/superAdmin/usuarios",
          label: "Usuarios",
          icon: Users,
          permission: "canManageUsers",
        },
        {
          href: "/superAdmin/zonas",
          label: "Zonas",
          icon: MapPin,
          permission: "canManageZonas",
        },
        {
          href: "/sucursales",
          label: "Sucursales",
          icon: Store,
          permission: "canManageSucursales",
        },
        {
          href: "/inventarios",
          label: "Inventarios",
          icon: Warehouse,
          permission: "canManageInventario",
        },
        {
          href: "/products",
          label: "Productos",
          icon: Package,
          permission: "canManageProducts",
        },
        {
          href: "/superAdmin/combos",
          label: "Combos",
          icon: Layers,
          permission: "canManageCombos",
        },
        {
          href: "/superAdmin/descuentos",
          label: "Descuentos",
          icon: BadgePercent,
          permission: "canManageDescuentos",
        },
        {
          href: "/superAdmin/trabajadores-club",
          label: "Trabajadores Club",
          icon: IdCard,
          permission: "canManageTrabajadoresClub",
        },
      ],
    });
    groups.push({
      title: "Reportes",
      items: [
        {
          href: "/ventas",
          label: "Ventas",
          icon: ShoppingCart,
          permission: "canViewVentas",
        },
        {
          href: "/cortes",
          label: "Cortes",
          icon: ClipboardList,
          permission: "canViewCortes",
        },
      ],
    });
    return groups;
  }

  if (perms.isAdmin) {
    groups.push({
      title: "Principal",
      items: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    });
    groups.push({
      title: "Gestión",
      items: [
        {
          href: "/products",
          label: "Productos",
          icon: Package,
          permission: "canManageProducts",
        },
      ],
    });
    groups.push({
      title: "Consulta",
      items: [
        {
          href: "/sucursales",
          label: "Sucursales",
          icon: Store,
          permission: "canViewSucursales",
        },
        {
          href: "/inventarios",
          label: "Inventario",
          icon: Warehouse,
          permission: "canViewInventario",
        },
      ],
    });
    groups.push({
      title: "Operación",
      items: [
        {
          href: "/ventas",
          label: "Ventas",
          icon: ShoppingCart,
          permission: "canViewVentas",
        },
        {
          href: "/cortes",
          label: "Cortes",
          icon: ClipboardList,
          permission: "canViewCortes",
        },
      ],
    });
    return groups;
  }

  if (perms.isVendedor) {
    groups.push({
      title: "Operación",
      items: [
        {
          href: "/ventas",
          label: "Ventas",
          icon: ShoppingCart,
          permission: "canManageVentas",
        },
        {
          href: "/inventarios",
          label: "Inventario",
          icon: Warehouse,
          permission: "canViewInventario",
        },
        {
          href: "/cortes",
          label: "Cortes",
          icon: ClipboardList,
          permission: "canManageCortes",
        },
      ],
    });
  }

  return groups;
}

export function filterNavGroups(
  groups: NavGroup[],
  perms: PermissionFlags,
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || Boolean(perms[item.permission]),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
