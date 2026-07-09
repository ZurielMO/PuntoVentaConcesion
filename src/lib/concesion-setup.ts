import { UserRole, type Concession, type Sucursal, type User } from "./types";

export type SetupProduct = {
  concesion_id?: string;
  concesionId?: string;
  activo?: boolean;
};

export type SetupStepId =
  | "concesion"
  | "sucursal"
  | "admin"
  | "cajas"
  | "productos"
  | "vendedores";

export type SetupStep = {
  id: SetupStepId;
  title: string;
  description: string;
  done: boolean;
  /** Ruta relativa al dashboard (puede incluir query) */
  href?: string;
  actionLabel?: string;
  optional?: boolean;
};

export type ConcesionSetupStatus = {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  readyForJornada: boolean;
  /** Deep-link a inventarios con la concesión preseleccionada */
  inventariosHref: string;
};

function productConcesionId(p: SetupProduct): string | undefined {
  return p.concesion_id ?? p.concesionId;
}

function isAdminRole(rol?: string): boolean {
  if (!rol) return false;
  const upper = rol.toUpperCase();
  return upper === UserRole.ADMIN || upper === "CONCESION_ADMIN";
}

function buildQuery(params: Record<string, string | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function cajasActivas(s: Sucursal): number {
  return s.cajas?.filter((c) => c.activo !== false).length ?? 0;
}

/** Primera sucursal sin cajas activas, o la primera disponible. */
function pickSucursalForCajas(sucursales: Sucursal[]): string | undefined {
  if (sucursales.length === 0) return undefined;
  const sinCajas = sucursales.find((s) => cajasActivas(s) === 0);
  return (sinCajas ?? sucursales[0]).id;
}

/** Primera sucursal con cajas incompletas de equipo, o la primera con cajas. */
function pickSucursalForEquipo(
  sucursales: Sucursal[],
  vendedoresAsignados: User[],
): string | undefined {
  if (sucursales.length === 0) return undefined;
  const incompleta = sucursales.find((s) => {
    const nCajas = cajasActivas(s);
    if (nCajas === 0) return false;
    const asignados = vendedoresAsignados.filter(
      (v) => v.sucursalId === s.id,
    ).length;
    return asignados < nCajas;
  });
  if (incompleta) return incompleta.id;
  const conCajas = sucursales.find((s) => cajasActivas(s) > 0);
  return (conCajas ?? sucursales[0]).id;
}

export function computeConcesionSetupStatus(input: {
  concesionId: string;
  concession?: Concession | null;
  users: User[];
  products: SetupProduct[];
  sucursales: Sucursal[];
  vendedores: User[];
}): ConcesionSetupStatus {
  const { concesionId, concession, users, products, sucursales, vendedores } =
    input;

  const concessionUsers = users.filter(
    (u) => u.concesionId === concesionId && u.activo !== false,
  );
  const concessionProducts = products.filter(
    (p) => productConcesionId(p) === concesionId && p.activo !== false,
  );
  const concessionSucursales = sucursales.filter(
    (s) => s.concesion_id === concesionId && s.activo !== false,
  );
  const totalCajas = concessionSucursales.reduce(
    (acc, s) => acc + cajasActivas(s),
    0,
  );
  const hasAdmin = concessionUsers.some((u) => isAdminRole(String(u.rol)));
  const vendedoresAsignados = vendedores.filter(
    (v) =>
      v.concesionId === concesionId &&
      v.activo !== false &&
      Boolean(v.sucursalId) &&
      Boolean(v.cajaId),
  );

  const qConcesion = buildQuery({ concesionId });
  const sucursalForCajas = pickSucursalForCajas(concessionSucursales);
  const sucursalForEquipo = pickSucursalForEquipo(
    concessionSucursales,
    vendedoresAsignados,
  );
  const firstSucursalId = concessionSucursales[0]?.id;

  const steps: SetupStep[] = [
    {
      id: "concesion",
      title: "Concesión",
      description: concession?.nombre
        ? `«${concession.nombre}» registrada`
        : "Datos básicos de la concesión",
      done: Boolean(concession && concession.activo !== false),
      href: `/superAdmin/concesiones/${concesionId}`,
      actionLabel: "Ver resumen",
    },
    {
      id: "sucursal",
      title: "Sucursal",
      description:
        concessionSucursales.length > 0
          ? `${concessionSucursales.length} punto(s) de venta`
          : "Crea el primer punto de venta en una zona",
      done: concessionSucursales.length > 0,
      href: `/sucursales${buildQuery({
        concesionId,
        sucursalId: firstSucursalId,
      })}`,
      actionLabel:
        concessionSucursales.length > 0 ? "Ver sucursales" : "Crear sucursal",
    },
    {
      id: "admin",
      title: "Administrador",
      description: hasAdmin
        ? "Admin de concesión asignado"
        : "Crea un usuario con rol Admin para esta concesión",
      done: hasAdmin,
      href: `/superAdmin/usuarios${qConcesion}`,
      actionLabel: hasAdmin ? "Ver usuarios" : "Crear admin",
    },
    {
      id: "cajas",
      title: "Cajas",
      description:
        totalCajas > 0
          ? `${totalCajas} caja(s) activa(s)`
          : "Agrega al menos una caja por sucursal",
      done: totalCajas > 0,
      href: `/sucursales${buildQuery({
        concesionId,
        sucursalId: sucursalForCajas,
        tab: "cajas",
      })}`,
      actionLabel: totalCajas > 0 ? "Gestionar cajas" : "Agregar cajas",
    },
    {
      id: "productos",
      title: "Catálogo",
      description:
        concessionProducts.length > 0
          ? `${concessionProducts.length} producto(s) en catálogo`
          : "Agrega al menos un producto para vender",
      done: concessionProducts.length > 0,
      href: `/products${qConcesion}`,
      actionLabel: concessionProducts.length > 0 ? "Ver productos" : "Agregar producto",
    },
    {
      id: "vendedores",
      title: "Equipo en caja",
      description:
        vendedoresAsignados.length > 0
          ? `${vendedoresAsignados.length} vendedor(es) asignado(s)`
          : "Asigna vendedores a sucursal y caja",
      done: vendedoresAsignados.length > 0,
      href: `/sucursales${buildQuery({
        concesionId,
        sucursalId: sucursalForEquipo,
        tab: "equipo",
      })}`,
      actionLabel: "Asignar vendedor",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const readyForJornada =
    Boolean(concession) &&
    hasAdmin &&
    concessionProducts.length > 0 &&
    concessionSucursales.length > 0 &&
    totalCajas > 0 &&
    vendedoresAsignados.length > 0;

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent,
    readyForJornada,
    inventariosHref: `/inventarios${buildQuery({
      concesionId,
      sucursalId: firstSucursalId,
    })}`,
  };
}

/** Encuentra la primera concesión con setup incompleto (para CTA del dashboard). */
export function findIncompleteConcesion(
  concessions: Concession[],
  getStatus: (concesionId: string) => ConcesionSetupStatus,
): { concession: Concession; status: ConcesionSetupStatus } | null {
  for (const c of concessions) {
    if (c.activo === false) continue;
    const status = getStatus(c.id);
    if (!status.readyForJornada) {
      return { concession: c, status };
    }
  }
  return null;
}
