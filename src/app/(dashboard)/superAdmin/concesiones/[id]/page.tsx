"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Pencil, Settings2 } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { SetupChecklist } from "@/components/setup/setup-checklist";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcesionSetup } from "@/hooks/use-concesion-setup";
import { useActiveConcesion } from "@/hooks/use-active-concesion";
import { normalizeStorageImageUrl } from "@/lib/image-url";

export default function ConcesionHubPage() {
  const params = useParams();
  const concesionId = typeof params.id === "string" ? params.id : "";
  const { setActiveConcesionId } = useActiveConcesion();
  const { concession, status, loading } = useConcesionSetup(concesionId);

  useEffect(() => {
    if (concesionId) {
      setActiveConcesionId(concesionId);
    }
  }, [concesionId, setActiveConcesionId]);

  const logo = normalizeStorageImageUrl(concession?.imagenes?.[0]);

  return (
    <RequireRole superAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={loading ? "Cargando…" : (concession?.nombre ?? "Concesión")}
          description="Centro de configuración — completa cada paso para dejar la concesión lista."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/superAdmin/concesiones">
                  <ArrowLeft className="size-4" />
                  Volver
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/superAdmin/concesiones/nueva?resume=${concesionId}`}>
                  <Settings2 className="size-4" />
                  Asistente
                </Link>
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-[12px]" />
            <Skeleton className="h-64 w-full rounded-[12px]" />
          </div>
        ) : !concession ? (
          <div className="dashboard-card p-8 text-center">
            <p className="text-[1.4rem] text-muted-foreground">
              Concesión no encontrada.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/superAdmin/concesiones">Ver concesiones</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="dashboard-card flex flex-wrap items-center gap-4 p-5">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  className="size-16 rounded-[8px] object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-[8px] bg-green-soft text-[2rem] font-bold text-green-dark">
                  {concession.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[2rem] font-semibold text-green-dark">
                    {concession.nombre}
                  </h2>
                  <Badge
                    variant={concession.activo !== false ? "default" : "secondary"}
                  >
                    {concession.activo !== false ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="mt-1 text-[1.3rem] text-muted-foreground">
                  ID: {concession.id}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/superAdmin/concesiones">
                  <Pencil className="size-4" />
                  Editar datos
                </Link>
              </Button>
            </div>

            {status && <SetupChecklist status={status} />}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QuickLink
                href={`/sucursales?concesionId=${concesionId}`}
                title="Sucursales y cajas"
                description="Puntos de venta, cajas y equipo"
              />
              <QuickLink
                href={`/products?concesionId=${concesionId}`}
                title="Productos"
                description="Catálogo de la concesión"
              />
              <QuickLink
                href={`/superAdmin/usuarios?concesionId=${concesionId}`}
                title="Usuarios"
                description="Admins y vendedores"
              />
            </div>
          </>
        )}
      </div>
    </RequireRole>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="dashboard-card block p-5 transition-shadow hover:shadow-md"
    >
      <p className="text-[1.5rem] font-semibold text-green-dark">{title}</p>
      <p className="mt-1 text-[1.3rem] text-muted-foreground">{description}</p>
    </Link>
  );
}
