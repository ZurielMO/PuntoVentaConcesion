"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Package,
  Settings2,
  Store,
  Users,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { SetupChecklist } from "@/components/setup/setup-checklist";
import { useConcesionSetup } from "@/hooks/use-concesion-setup";
import { useActiveConcesion } from "@/hooks/use-active-concesion";
import { firstStoredImage } from "@/lib/image-url";
import "@/styles/wizard-alta.css";

export default function ConcesionHubPage() {
  const params = useParams();
  const pathname = usePathname();
  const concesionId = useMemo(() => {
    const fromParams = typeof params.id === "string" ? params.id : "";
    if (fromParams && fromParams !== "_") return fromParams;
    const parts = (pathname ?? "").split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    return last && last !== "_" ? last : "";
  }, [params.id, pathname]);
  const { setActiveConcesionId } = useActiveConcesion();
  const { concession, status, loading } = useConcesionSetup(concesionId);

  useEffect(() => {
    if (concesionId) {
      setActiveConcesionId(concesionId);
    }
  }, [concesionId, setActiveConcesionId]);

  const logo = firstStoredImage(concession?.imagenes);
  const activa = concession?.activo !== false;
  const qConcesion = `?concesionId=${encodeURIComponent(concesionId)}`;

  const sucursalesHref =
    status?.steps.find((s) => s.id === "sucursal")?.href ??
    `/sucursales${qConcesion}`;
  const productosHref = `/products${qConcesion}`;
  const usuariosHref = `/superAdmin/usuarios${qConcesion}`;

  return (
    <RequireRole superAdminOnly>
      <div className="wizard-alta wizard-alta__shell wizard-alta__shell--fill">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>
                {loading
                  ? "Cargando…"
                  : concession
                    ? `Configurar · ${concession.nombre}`
                    : "Configurar"}
              </h1>
              <p>
                Completa cada paso para dejar la concesión lista para operar en
                jornada.
              </p>
            </div>
            <div className="wizard-alta__hero-actions">
              <Link
                href="/superAdmin/concesiones"
                className="wizard-alta__exit"
              >
                <ArrowLeft className="size-4" />
                Volver
              </Link>
              {concession && (
                <Link
                  href={`/superAdmin/concesiones/nueva?resume=${concesionId}`}
                  className="wizard-alta__exit"
                >
                  <Settings2 className="size-4" />
                  Asistente
                </Link>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="wizard-alta__layout">
            <aside className="wizard-alta__sidebar">
              <p className="wizard-alta__empty">Cargando concesión…</p>
            </aside>
            <div className="wizard-alta__panel">
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__empty">Cargando pasos…</p>
              </div>
            </div>
          </div>
        ) : !concession ? (
          <div className="wizard-alta__layout">
            <div className="wizard-alta__panel" style={{ gridColumn: "1 / -1" }}>
              <div className="wizard-alta__panel-body">
                <p className="wizard-alta__hint">
                  No encontramos esta concesión. Vuelve al listado e inténtalo
                  de nuevo.
                </p>
                <p className="wizard-alta__empty">Concesión no encontrada.</p>
                <Link
                  href="/superAdmin/concesiones"
                  className="wizard-alta__btn wizard-alta__btn--primary mt-3"
                >
                  Ver concesiones
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="wizard-alta__layout">
            <aside className="wizard-alta__sidebar">
              <div className="wizard-alta__setup-identity">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    className="wizard-alta__setup-logo"
                  />
                ) : (
                  <div className="wizard-alta__setup-logo wizard-alta__setup-logo--placeholder">
                    {concession.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="wizard-alta__sidebar-item-name">
                    {concession.nombre}
                  </p>
                  <span
                    className={`wizard-alta__status-pill mt-1 ${
                      activa
                        ? "wizard-alta__status-pill--on"
                        : "wizard-alta__status-pill--off"
                    }`}
                  >
                    {activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              {status && (
                <p className="wizard-alta__hint mt-3">
                  {status.readyForJornada
                    ? "Lista para jornada. Revisa inventarios cuando abra el partido."
                    : `${status.completedCount} de ${status.totalCount} pasos listos. Sigue los pendientes en el panel.`}
                </p>
              )}

              <div className="wizard-alta__sidebar-head mt-2">
                <h2 className="wizard-alta__sidebar-title">Accesos rápidos</h2>
              </div>
              <ul className="wizard-alta__sidebar-list">
                <li>
                  <Link
                    href={sucursalesHref}
                    className="wizard-alta__sidebar-item wizard-alta__setup-quick"
                  >
                    <Store className="size-4 shrink-0 text-[var(--wz-primary)]" />
                    <div className="min-w-0">
                      <p className="wizard-alta__sidebar-item-name">
                        Sucursales y cajas
                      </p>
                      <p className="wizard-alta__sidebar-item-meta">
                        Puntos de venta, cajas y equipo
                      </p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href={productosHref}
                    className="wizard-alta__sidebar-item wizard-alta__setup-quick"
                  >
                    <Package className="size-4 shrink-0 text-[var(--wz-primary)]" />
                    <div className="min-w-0">
                      <p className="wizard-alta__sidebar-item-name">Productos</p>
                      <p className="wizard-alta__sidebar-item-meta">
                        Catálogo de la concesión
                      </p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href={usuariosHref}
                    className="wizard-alta__sidebar-item wizard-alta__setup-quick"
                  >
                    <Users className="size-4 shrink-0 text-[var(--wz-primary)]" />
                    <div className="min-w-0">
                      <p className="wizard-alta__sidebar-item-name">Usuarios</p>
                      <p className="wizard-alta__sidebar-item-meta">
                        Admins y vendedores
                      </p>
                    </div>
                  </Link>
                </li>
              </ul>

              <Link
                href="/superAdmin/concesiones"
                className="wizard-alta__btn wizard-alta__btn--outline mt-3 w-full"
              >
                Editar datos
              </Link>
            </aside>

            <div className="wizard-alta__panel">
              <div className="wizard-alta__panel-head">
                <h2 className="wizard-alta__panel-title">
                  Pasos de configuración
                </h2>
                <p className="wizard-alta__panel-sub">
                  {status?.readyForJornada
                    ? "Todo listo — puedes operar en jornada"
                    : "Completa los pendientes; cada acción te lleva al módulo correcto"}
                </p>
              </div>

              <div className="wizard-alta__panel-body wizard-alta__panel-body--stack">
                {!status?.readyForJornada && (
                  <p className="wizard-alta__hint">
                    Empieza por los pasos en <strong>Pendiente</strong>. Los
                    botones conservan la concesión (y sucursal/tab cuando
                    aplica).
                  </p>
                )}
                {status && <SetupChecklist status={status} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
