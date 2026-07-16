import type {
  CorteFilterKey,
  CorteRole,
  CorteSection,
} from "./contracts";

export type CorteAccessModel = {
  role: CorteRole;
  defaultSection: CorteSection;
  sections: readonly CorteSection[];
  editableFilters: readonly CorteFilterKey[];
};

const ACCESS_BY_ROLE: Record<CorteRole, CorteAccessModel> = {
  VENDEDOR: {
    role: "VENDEDOR",
    defaultSection: "caja-actual",
    sections: [
      "caja-actual",
      "reporte",
      "inventario",
      "historial",
      "incidencias",
    ],
    editableFilters: ["jornadaId", "inventarioId"],
  },
  ADMIN: {
    role: "ADMIN",
    defaultSection: "resumen",
    sections: [
      "resumen",
      "caja-actual",
      "reporte",
      "inventario",
      "historial",
      "incidencias",
    ],
    editableFilters: [
      "jornadaId",
      "sucursalId",
      "cajaId",
      "idUser",
      "inventarioId",
    ],
  },
  SUPERADMIN: {
    role: "SUPERADMIN",
    defaultSection: "resumen",
    sections: [
      "resumen",
      "reporte",
      "inventario",
      "historial",
      "incidencias",
    ],
    editableFilters: [
      "jornadaId",
      "concesionId",
      "sucursalId",
      "cajaId",
      "idUser",
      "inventarioId",
    ],
  },
};

export function getCorteAccessModel(
  role?: string | null,
): CorteAccessModel | null {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized.includes("SUPERADMIN")) return ACCESS_BY_ROLE.SUPERADMIN;
  if (normalized.includes("ADMIN")) return ACCESS_BY_ROLE.ADMIN;
  if (
    normalized.includes("VENDEDOR") ||
    normalized === "EMPLEADO"
  ) {
    return ACCESS_BY_ROLE.VENDEDOR;
  }
  return null;
}

export function canAccessCorteSection(
  access: CorteAccessModel,
  section: CorteSection,
): boolean {
  return access.sections.includes(section);
}

export function canEditCorteFilter(
  access: CorteAccessModel,
  filter: CorteFilterKey,
): boolean {
  return access.editableFilters.includes(filter);
}
