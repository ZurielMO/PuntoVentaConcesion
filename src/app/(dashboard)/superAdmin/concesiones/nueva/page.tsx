"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  Plus,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/auth/require-role";
import { WizardBrandStepper } from "@/components/setup/wizard-brand-stepper";
import { WizardUploadZone } from "@/components/setup/wizard-upload-zone";
import type { StepperItem } from "@/components/setup/setup-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/ui/field";
import { useConcessions } from "@/hooks/use-concessions";
import { useZonas } from "@/hooks/use-zonas";
import { useUsers } from "@/hooks/use-users";
import { useProducts, MAX_IMAGE_BYTES } from "@/hooks/use-products";
import { useSucursales } from "@/hooks/use-sucursales";
import { useActiveConcesion } from "@/hooks/use-active-concesion";
import { formatPrice } from "@/lib/format";
import { UserRole } from "@/lib/types";
import "@/styles/wizard-alta.css";

type WizardStepId =
  | "concesion"
  | "sucursal"
  | "admin"
  | "cajas"
  | "producto"
  | "vendedor"
  | "resumen";

type DraftProduct = {
  id: string;
  nombre: string;
  precio: number;
  unidad_medida: string;
  imageFile?: File | null;
  imagePreview?: string | null;
};

type DraftVendedor = {
  cajaIndex: number;
  nombre: string;
  email: string;
  password: string;
};

const WIZARD_STEPS: StepperItem[] = [
  { id: "concesion", label: "Concesión", description: "Obligatorio" },
  { id: "sucursal", label: "Sucursal", description: "Obligatorio" },
  { id: "admin", label: "Admin", description: "Obligatorio" },
  { id: "cajas", label: "Cajas", description: "Obligatorio" },
  { id: "producto", label: "Productos", description: "Opcional" },
  { id: "vendedor", label: "Vendedores", description: "Opcional" },
  { id: "resumen", label: "Resumen", description: "Crear todo" },
];

const MAX_CAJAS = 3;

export default function NuevaConcesionWizardPage() {
  const router = useRouter();
  const { setActiveConcesionId } = useActiveConcesion();

  const { concessions, createConcession, updateConcession, uploadConcessionImages } =
    useConcessions();
  const { zonas } = useZonas();
  const { createUser } = useUsers();
  const { createProduct, createProductWithImages } = useProducts();
  const { createSucursal, createCaja } = useSucursales();

  const [step, setStep] = useState<WizardStepId>("concesion");
  const [creating, setCreating] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const [concesionNombre, setConcesionNombre] = useState("");
  const [concesionPorcentajeComision, setConcesionPorcentajeComision] = useState("0");
  const [concesionImage, setConcesionImage] = useState<File | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [adminNombre, setAdminNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [cajasNombres, setCajasNombres] = useState<string[]>(["Caja 1"]);
  const [productosDraft, setProductosDraft] = useState<DraftProduct[]>([]);
  const [productoNombre, setProductoNombre] = useState("");
  const [productoPrecio, setProductoPrecio] = useState("");
  const [productoUnidad, setProductoUnidad] = useState("pza");
  const [productoImage, setProductoImage] = useState<File | null>(null);
  const [vendedoresDraft, setVendedoresDraft] = useState<DraftVendedor[]>([]);
  const productosDraftRef = useRef(productosDraft);
  productosDraftRef.current = productosDraft;

  const imagePreview = useMemo(
    () => (concesionImage ? URL.createObjectURL(concesionImage) : null),
    [concesionImage],
  );

  const productoFormPreview = useMemo(
    () => (productoImage ? URL.createObjectURL(productoImage) : null),
    [productoImage],
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (productoFormPreview) URL.revokeObjectURL(productoFormPreview);
    };
  }, [productoFormPreview]);

  useEffect(() => {
    return () => {
      productosDraftRef.current.forEach((p) => {
        if (p.imagePreview) URL.revokeObjectURL(p.imagePreview);
      });
    };
  }, []);

  useEffect(() => {
    const resume = new URLSearchParams(window.location.search).get("resume");
    setResumeId(resume);
    if (resume) {
      setStep("sucursal");
    }
  }, []);

  useEffect(() => {
    if (resumeId) {
      const existing = concessions.find((c) => c.id === resumeId);
      if (existing) {
        setConcesionNombre(existing.nombre);
        setConcesionPorcentajeComision(String(existing.porcentajeComision ?? 0));
      }
    }
  }, [resumeId, concessions]);

  const parseConcesionPorcentajeComision = () => {
    const value = Number(concesionPorcentajeComision);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      throw new Error("Ingresa un porcentaje de comisión entre 0 y 100");
    }
    return value;
  };

  const cajasValidas = useMemo(
    () =>
      cajasNombres
        .map((nombre, index) => ({ nombre: nombre.trim(), index }))
        .filter((c) => c.nombre.length > 0),
    [cajasNombres],
  );

  const zonaNombre = (id: string) => zonas.find((z) => z.id === id)?.zona ?? id;

  const completedStepIds = useMemo(() => {
    const order = WIZARD_STEPS.map((s) => s.id as WizardStepId);
    const currentIdx = order.indexOf(step);
    return order.slice(0, currentIdx);
  }, [step]);

  const goNext = useCallback(() => {
    const order = WIZARD_STEPS.map((s) => s.id as WizardStepId);
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const order = WIZARD_STEPS.map((s) => s.id as WizardStepId);
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  }, [step]);

  const updateVendedor = (
    cajaIndex: number,
    field: keyof Omit<DraftVendedor, "cajaIndex">,
    value: string,
  ) => {
    setVendedoresDraft((prev) => {
      const existing = prev.find((v) => v.cajaIndex === cajaIndex);
      if (existing) {
        return prev.map((v) =>
          v.cajaIndex === cajaIndex ? { ...v, [field]: value } : v,
        );
      }
      return [...prev, { cajaIndex, nombre: "", email: "", password: "", [field]: value }];
    });
  };

  const getVendedorForCaja = (cajaIndex: number) =>
    vendedoresDraft.find((v) => v.cajaIndex === cajaIndex);

  const vendedoresCompletos = useMemo(
    () =>
      vendedoresDraft.filter(
        (v) =>
          v.nombre.trim() &&
          v.email.trim() &&
          v.password.length >= 6 &&
          cajasValidas.some((c) => c.index === v.cajaIndex),
      ),
    [vendedoresDraft, cajasValidas],
  );

  const handleStepConcesion = (e: FormEvent) => {
    e.preventDefault();
    if (!resumeId && !concesionNombre.trim()) {
      toast.error("Ingresa el nombre de la concesión");
      return;
    }
    try {
      parseConcesionPorcentajeComision();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Comisión inválida");
      return;
    }
    goNext();
  };

  const handleStepSucursal = (e: FormEvent) => {
    e.preventDefault();
    if (zonas.length === 0) {
      toast.error("Crea zonas del estadio primero");
      return;
    }
    if (!zonaId) {
      toast.error("Selecciona una zona");
      return;
    }
    if (!sucursalNombre.trim()) {
      toast.error("Ingresa el nombre de la sucursal");
      return;
    }
    goNext();
  };

  const handleStepAdmin = (e: FormEvent) => {
    e.preventDefault();
    if (!adminNombre.trim() || !adminEmail.trim() || adminPassword.length < 6) {
      toast.error("Completa los datos del administrador");
      return;
    }
    goNext();
  };

  const handleStepCajas = (e: FormEvent) => {
    e.preventDefault();
    if (cajasValidas.length === 0) {
      toast.error("Agrega al menos una caja");
      return;
    }
    goNext();
  };

  const removeProductoDraft = (id: string) => {
    setProductosDraft((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.imagePreview) URL.revokeObjectURL(item.imagePreview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleAddProducto = () => {
    const precio = Number(productoPrecio);
    if (!productoNombre.trim()) {
      toast.error("Ingresa el nombre del producto");
      return;
    }
    if (Number.isNaN(precio) || precio < 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    if (productoImage && productoImage.size > MAX_IMAGE_BYTES) {
      toast.error(`La imagen supera el límite de 5 MB`);
      return;
    }
    const imagePreviewUrl = productoImage
      ? URL.createObjectURL(productoImage)
      : null;
    setProductosDraft((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: productoNombre.trim(),
        precio,
        unidad_medida: productoUnidad.trim() || "pza",
        imageFile: productoImage,
        imagePreview: imagePreviewUrl,
      },
    ]);
    setProductoNombre("");
    setProductoPrecio("");
    setProductoImage(null);
    toast.success("Producto agregado a la lista");
  };

  const handleStepProducto = (e: FormEvent) => {
    e.preventDefault();
    if (productoNombre.trim() || productoPrecio || productoImage) {
      toast.message("¿Agregar este producto?", {
        description: "Tienes datos sin agregar. Usa «Agregar a la lista» o bórralos.",
      });
      return;
    }
    goNext();
  };

  const handleStepVendedor = (e: FormEvent) => {
    e.preventDefault();
    const incompletos = vendedoresDraft.filter(
      (v) =>
        (v.nombre.trim() || v.email.trim() || v.password) &&
        !(v.nombre.trim() && v.email.trim() && v.password.length >= 6),
    );
    if (incompletos.length > 0) {
      toast.error("Completa todos los campos del vendedor o déjalos vacíos");
      return;
    }
    goNext();
  };

  const handleFinalCreate = async () => {
    setCreating(true);
    try {
      const comision = parseConcesionPorcentajeComision();
      let concesionId = resumeId;

      if (!concesionId) {
        const created = await createConcession({
          nombre: concesionNombre.trim(),
          activo: true,
          imagenes: [],
          porcentajeComision: comision,
        });
        concesionId = created.id;
        if (concesionImage) {
          await uploadConcessionImages(created.id, [concesionImage]);
        }
      } else {
        const existing = concessions.find((c) => c.id === concesionId);
        await updateConcession(concesionId, {
          nombre: concesionNombre.trim(),
          activo: existing?.activo ?? true,
          imagenes: existing?.imagenes ?? [],
          porcentajeComision: comision,
        });
      }

      const sucursal = await createSucursal(concesionId, zonaId, {
        sucursal: { nombre: sucursalNombre.trim() },
      });

      await createUser({
        nombre: adminNombre.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        fecha_nacimiento: "1990-01-01",
        rol: UserRole.ADMIN,
        concesionId,
        activo: true,
      });

      const cajaIdByIndex: Record<number, string> = {};
      for (const { nombre, index } of cajasValidas) {
        const caja = await createCaja(sucursal.id, nombre);
        cajaIdByIndex[index] = caja.id;
      }

      for (const producto of productosDraft) {
        const payload = {
          nombre: producto.nombre,
          precio: producto.precio,
          unidad_medida: producto.unidad_medida,
          activo: true,
          concesionId,
        };
        if (producto.imageFile) {
          await createProductWithImages(payload, [producto.imageFile]);
        } else {
          await createProduct(payload);
        }
      }

      for (const vendedor of vendedoresCompletos) {
        const cajaId = cajaIdByIndex[vendedor.cajaIndex];
        if (!cajaId) continue;
        await createUser({
          nombre: vendedor.nombre.trim(),
          email: vendedor.email.trim(),
          password: vendedor.password,
          fecha_nacimiento: "1990-01-01",
          rol: UserRole.VENDEDOR,
          concesionId,
          sucursalId: sucursal.id,
          cajaId,
          activo: true,
        });
      }

      setActiveConcesionId(concesionId);
      toast.success("Concesión configurada correctamente");
      router.push(`/superAdmin/concesiones/${concesionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la configuración");
    } finally {
      setCreating(false);
    }
  };

  const currentStepMeta = WIZARD_STEPS.find((s) => s.id === step);
  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);

  return (
    <RequireRole superAdminOnly>
      <div className="wizard-alta wizard-alta__shell">
        <header className="wizard-alta__hero">
          <div className="wizard-alta__hero-inner">
            <div>
              <h1>Asistente de alta</h1>
              <p>Todo se guarda únicamente al confirmar en el resumen.</p>
            </div>
            <Link href="/superAdmin/concesiones" className="wizard-alta__exit">
              <ArrowLeft className="size-4" />
              Salir
            </Link>
          </div>
        </header>

        <WizardBrandStepper
          steps={WIZARD_STEPS}
          currentStepId={step}
          completedStepIds={completedStepIds}
        />

        <div className="wizard-alta__panel">
          <div className="wizard-alta__panel-head">
            <h2 className="wizard-alta__panel-title">{currentStepMeta?.label}</h2>
            <p className="wizard-alta__panel-sub">
              Paso {stepIndex + 1} de {WIZARD_STEPS.length}
              {currentStepMeta?.description
                ? ` · ${currentStepMeta.description}`
                : ""}
            </p>
          </div>
          <div className="wizard-alta__panel-body">
            {step === "concesion" && (
              <form onSubmit={handleStepConcesion}>
                <p className="wizard-alta__hint">
                  Datos base de la concesión que aparecerán en el catálogo y
                  reportes del POS.
                </p>
                <div className="wizard-alta__form-grid wizard-alta__form-grid--split">
                  <div className="space-y-4">
                    <Field label="Nombre de la concesión" htmlFor="concesionNombre">
                      <Input
                        id="concesionNombre"
                        value={concesionNombre}
                        onChange={(e) => setConcesionNombre(e.target.value)}
                        placeholder="Ej. Taquería León"
                        required={!resumeId}
                        disabled={Boolean(resumeId)}
                      />
                    </Field>
                    <Field
                      label="Porcentaje de comisión (%)"
                      htmlFor="concesionPorcentajeComision"
                      hint="Se aplicará en los reportes de cortes de esta concesión"
                    >
                      <Input
                        id="concesionPorcentajeComision"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={concesionPorcentajeComision}
                        onChange={(e) => setConcesionPorcentajeComision(e.target.value)}
                        required
                      />
                    </Field>
                  </div>
                  {!resumeId && (
                    <Field label="Logo de la concesión">
                      <WizardUploadZone
                        variant="logo"
                        previewUrl={imagePreview}
                        hasFile={Boolean(concesionImage)}
                        title="Subir logo"
                        subtitle="PNG, JPG o WebP · máx. 5 MB"
                        onFileChange={setConcesionImage}
                        onClear={() => setConcesionImage(null)}
                      />
                    </Field>
                  )}
                </div>
                <WizardFooter canBack={false} nextLabel="Siguiente" />
              </form>
            )}

            {step === "sucursal" && (
              <form onSubmit={handleStepSucursal}>
                <p className="wizard-alta__hint">
                  Define el punto de venta físico dentro del estadio.
                </p>
                {zonas.length === 0 ? (
                  <p className="text-[1.4rem] text-muted-foreground">
                    No hay zonas del estadio. Créalas en{" "}
                    <Link href="/superAdmin/zonas" className="font-medium underline">
                      Zonas del estadio
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="wizard-alta__form-grid wizard-alta__form-grid--split">
                    <Field label="Nombre de sucursal" htmlFor="sucursalNombre">
                      <Input
                        id="sucursalNombre"
                        value={sucursalNombre}
                        onChange={(e) => setSucursalNombre(e.target.value)}
                        placeholder="Ej. Punto Norte"
                        required
                      />
                    </Field>
                    <Field label="Zona del estadio" htmlFor="zonaId">
                      <NativeSelect
                        id="zonaId"
                        value={zonaId}
                        onChange={(e) => setZonaId(e.target.value)}
                        required
                      >
                        <option value="">Selecciona zona</option>
                        {zonas.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.zona}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                )}
                <WizardFooter onBack={goBack} nextLabel="Siguiente" />
              </form>
            )}

            {step === "admin" && (
              <form onSubmit={handleStepAdmin}>
                <p className="wizard-alta__hint">
                  El administrador gestiona productos, sucursales y operación de
                  la concesión.
                </p>
                <div className="wizard-alta__form-grid wizard-alta__form-grid--split">
                <Field label="Nombre" htmlFor="adminNombre">
                  <Input
                    id="adminNombre"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="adminEmail">
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </Field>
                </div>
                <Field label="Contraseña" htmlFor="adminPassword">
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </Field>
                <WizardFooter onBack={goBack} nextLabel="Siguiente" />
              </form>
            )}

            {step === "cajas" && (
              <form onSubmit={handleStepCajas}>
                <p className="wizard-alta__hint">
                  Registra las terminales de venta (máximo {MAX_CAJAS} cajas por
                  sucursal).
                </p>
                <div className="wizard-alta__cajas-grid">
                {cajasNombres.map((nombre, i) => (
                  <div key={i} className="wizard-alta__caja-card">
                    <div className="wizard-alta__caja-icon">C{i + 1}</div>
                    <Input
                      className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                      value={nombre}
                      onChange={(e) => {
                        const next = [...cajasNombres];
                        next[i] = e.target.value;
                        setCajasNombres(next);
                      }}
                      placeholder={`Nombre caja ${i + 1}`}
                      required={i === 0}
                    />
                    {cajasNombres.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCajasNombres(cajasNombres.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full border-[#006A54] text-[#006A54]"
                  disabled={cajasNombres.length >= MAX_CAJAS}
                  onClick={() => {
                    if (cajasNombres.length >= MAX_CAJAS) {
                      toast.error(`Máximo ${MAX_CAJAS} cajas por sucursal`);
                      return;
                    }
                    setCajasNombres([
                      ...cajasNombres,
                      `Caja ${cajasNombres.length + 1}`,
                    ]);
                  }}
                >
                  <Plus className="size-4" />
                  Otra caja ({cajasNombres.length}/{MAX_CAJAS})
                </Button>
                <WizardFooter onBack={goBack} nextLabel="Siguiente" />
              </form>
            )}

            {step === "producto" && (
              <form onSubmit={handleStepProducto}>
                <p className="wizard-alta__hint wizard-alta__hint--optional">
                  Arma tu menú como en el POS. Puedes omitir este paso y
                  agregar productos después.
                </p>

                {productosDraft.length > 0 && (
                  <div className="wizard-alta__product-grid mb-6">
                    {productosDraft.map((p) => (
                      <article key={p.id} className="wizard-alta__product-card">
                        <button
                          type="button"
                          className="wizard-alta__product-card-remove"
                          onClick={() => removeProductoDraft(p.id)}
                          aria-label={`Quitar ${p.nombre}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                        {p.imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imagePreview}
                            alt=""
                            className="wizard-alta__product-card-img"
                          />
                        ) : (
                          <div className="wizard-alta__product-card-placeholder">
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="wizard-alta__product-card-body">
                          <p className="wizard-alta__product-card-name">{p.nombre}</p>
                          <p className="wizard-alta__product-card-price">
                            {formatPrice(p.precio)}
                            <span className="text-[1.1rem] font-normal text-[#6b7280]">
                              {" "}
                              / {p.unidad_medida}
                            </span>
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="wizard-alta__summary-block">
                  <p className="wizard-alta__summary-block-title">Nuevo producto</p>
                  <div className="wizard-alta__form-grid wizard-alta__form-grid--split">
                    <div className="space-y-4">
                      <Field label="Nombre" htmlFor="productoNombre">
                        <Input
                          id="productoNombre"
                          value={productoNombre}
                          onChange={(e) => setProductoNombre(e.target.value)}
                          placeholder="Ej. Hot dog clásico"
                        />
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Precio" htmlFor="productoPrecio">
                          <Input
                            id="productoPrecio"
                            type="number"
                            min="0"
                            step="0.01"
                            value={productoPrecio}
                            onChange={(e) => setProductoPrecio(e.target.value)}
                            placeholder="0.00"
                          />
                        </Field>
                        <Field label="Unidad" htmlFor="productoUnidad">
                          <Input
                            id="productoUnidad"
                            value={productoUnidad}
                            onChange={(e) => setProductoUnidad(e.target.value)}
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        className="wizard-alta__btn wizard-alta__btn--secondary"
                        onClick={handleAddProducto}
                      >
                        <Plus className="size-4" />
                        Agregar al menú
                      </button>
                    </div>
                    <Field label="Foto del producto">
                      <WizardUploadZone
                        variant="product"
                        previewUrl={productoFormPreview}
                        hasFile={Boolean(productoImage)}
                        title="Subir foto"
                        subtitle="PNG, JPG o WebP · máx. 5 MB"
                        onFileChange={setProductoImage}
                        onClear={() => setProductoImage(null)}
                      />
                    </Field>
                  </div>
                </div>

                <WizardFooter
                  onBack={goBack}
                  nextLabel="Continuar"
                  skipLabel="Omitir productos"
                  onSkip={goNext}
                />
              </form>
            )}

            {step === "vendedor" && (
              <form onSubmit={handleStepVendedor}>
                <p className="wizard-alta__hint wizard-alta__hint--optional">
                  Asigna un vendedor por caja. Deja vacío las cajas sin personal.
                </p>

                <div className="wizard-alta__vendors-grid">
                {cajasValidas.map(({ nombre, index }) => {
                  const v = getVendedorForCaja(index);
                  return (
                    <div key={index} className="wizard-alta__vendor-card">
                      <div className="wizard-alta__vendor-head">
                        <Store className="size-5 text-[#006A54]" />
                        {nombre}
                      </div>
                      <div className="space-y-3">
                      <Field label="Nombre" htmlFor={`v-nombre-${index}`}>
                        <Input
                          id={`v-nombre-${index}`}
                          value={v?.nombre ?? ""}
                          onChange={(e) =>
                            updateVendedor(index, "nombre", e.target.value)
                          }
                          placeholder="Opcional"
                        />
                      </Field>
                      <Field label="Email" htmlFor={`v-email-${index}`}>
                        <Input
                          id={`v-email-${index}`}
                          type="email"
                          value={v?.email ?? ""}
                          onChange={(e) =>
                            updateVendedor(index, "email", e.target.value)
                          }
                          placeholder="Opcional"
                        />
                      </Field>
                      <Field label="Contraseña" htmlFor={`v-pass-${index}`}>
                        <Input
                          id={`v-pass-${index}`}
                          type="password"
                          value={v?.password ?? ""}
                          onChange={(e) =>
                            updateVendedor(index, "password", e.target.value)
                          }
                          placeholder="Mín. 6 caracteres"
                        />
                      </Field>
                      </div>
                    </div>
                  );
                })}
                </div>

                <WizardFooter
                  onBack={goBack}
                  nextLabel="Ver resumen"
                  skipLabel="Omitir vendedores"
                  onSkip={goNext}
                />
              </form>
            )}

            {step === "resumen" && (
              <WizardResumen
                concesionNombre={concesionNombre}
                concesionPorcentajeComision={concesionPorcentajeComision}
                imagePreview={imagePreview}
                sucursalNombre={sucursalNombre}
                zonaLabel={zonaId ? zonaNombre(zonaId) : "—"}
                adminNombre={adminNombre}
                adminEmail={adminEmail}
                cajas={cajasValidas.map((c) => c.nombre)}
                productos={productosDraft}
                vendedores={vendedoresCompletos.map((v) => ({
                  cajaNombre:
                    cajasValidas.find((c) => c.index === v.cajaIndex)?.nombre ??
                    "—",
                  nombre: v.nombre,
                  email: v.email,
                }))}
                creating={creating}
                onBack={goBack}
                onCreate={() => void handleFinalCreate()}
              />
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}

function WizardResumen({
  concesionNombre,
  concesionPorcentajeComision,
  imagePreview,
  sucursalNombre,
  zonaLabel,
  adminNombre,
  adminEmail,
  cajas,
  productos,
  vendedores,
  creating,
  onBack,
  onCreate,
}: {
  concesionNombre: string;
  concesionPorcentajeComision: string;
  imagePreview: string | null;
  sucursalNombre: string;
  zonaLabel: string;
  adminNombre: string;
  adminEmail: string;
  cajas: string[];
  productos: DraftProduct[];
  vendedores: { cajaNombre: string; nombre: string; email: string }[];
  creating: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="wizard-alta__checkout">
      <div className="wizard-alta__checkout-main">
        <div className="wizard-alta__summary-block">
          <p className="wizard-alta__summary-block-title">Concesión</p>
          <div className="wizard-alta__summary-identity">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt=""
                className="wizard-alta__summary-avatar"
              />
            ) : (
              <div className="wizard-alta__summary-avatar-fallback">
                {concesionNombre.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[1.7rem] font-bold text-[#206734]">{concesionNombre}</p>
              <p className="text-[1.25rem] text-[#6b7280]">
                Comisión {concesionPorcentajeComision}% · Lista para operar en el estadio
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="wizard-alta__summary-block">
            <p className="wizard-alta__summary-block-title">Sucursal</p>
            <p className="text-[1.45rem] font-semibold text-[#0B0B0B]">{sucursalNombre}</p>
            <p className="text-[1.25rem] text-[#6b7280]">{zonaLabel}</p>
          </div>
          <div className="wizard-alta__summary-block">
            <p className="wizard-alta__summary-block-title">Administrador</p>
            <p className="text-[1.45rem] font-semibold text-[#0B0B0B]">{adminNombre}</p>
            <p className="truncate text-[1.25rem] text-[#6b7280]">{adminEmail}</p>
          </div>
        </div>

        <div className="wizard-alta__summary-block wizard-alta__summary-block--full">
          <p className="wizard-alta__summary-block-title">Cajas registradas</p>
          <div className="flex flex-wrap gap-2">
            {cajas.map((c) => (
              <span key={c} className="wizard-alta__chip">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="wizard-alta__summary-block wizard-alta__summary-block--full">
          <div className="mb-2 flex items-center gap-2">
            <Package className="size-4 text-[#006A54]" />
            <p className="wizard-alta__summary-block-title mb-0">Productos</p>
            {productos.length === 0 && (
              <span className="wizard-alta__chip wizard-alta__chip--gold ml-auto">
                Sin productos
              </span>
            )}
          </div>
          {productos.length === 0 ? (
            <p className="text-[1.3rem] text-[#6b7280]">Catálogo vacío por ahora.</p>
          ) : (
            <div className="wizard-alta__mini-products">
              {productos.map((p) => (
                <span key={p.id} className="wizard-alta__mini-product">
                  {p.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagePreview} alt="" />
                  ) : null}
                  <span>
                    {p.nombre} · {formatPrice(p.precio)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="wizard-alta__summary-block wizard-alta__summary-block--full">
          <div className="mb-2 flex items-center gap-2">
            <Users className="size-4 text-[#006A54]" />
            <p className="wizard-alta__summary-block-title mb-0">Vendedores</p>
            {vendedores.length === 0 && (
              <span className="wizard-alta__chip wizard-alta__chip--gold ml-auto">
                Sin asignar
              </span>
            )}
          </div>
          {vendedores.length === 0 ? (
            <p className="text-[1.3rem] text-[#6b7280]">Ningún vendedor configurado.</p>
          ) : (
            <div className="space-y-2">
              {vendedores.map((v) => (
                <div
                  key={`${v.cajaNombre}-${v.email}`}
                  className="flex items-center justify-between rounded-[8px] bg-[#f3f5f7] px-3 py-2 text-[1.25rem]"
                >
                  <span className="font-medium">{v.nombre}</span>
                  <span className="text-[#6b7280]">{v.cajaNombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="wizard-alta__checkout-sidebar">
        <div className="wizard-alta__checkout-sidebar-head">Orden de alta</div>
        <div className="wizard-alta__checkout-sidebar-body">
          <div className="wizard-alta__checkout-row">
            <span>Cajas</span>
            <strong>{cajas.length}</strong>
          </div>
          <div className="wizard-alta__checkout-row">
            <span>Productos</span>
            <strong>{productos.length}</strong>
          </div>
          <div className="wizard-alta__checkout-row">
            <span>Vendedores</span>
            <strong>{vendedores.length}</strong>
          </div>
          <div className="wizard-alta__checkout-total">
            <span>Estado</span>
            <span>Listo</span>
          </div>
          <button
            type="button"
            className="wizard-alta__btn wizard-alta__btn--primary wizard-alta__btn--lg mt-4 w-full"
            onClick={onCreate}
            disabled={creating}
          >
            {creating ? "Creando…" : "Crear concesión"}
            {!creating && <Check className="size-4" />}
          </button>
          <button
            type="button"
            className="wizard-alta__btn wizard-alta__btn--ghost mt-2 w-full"
            onClick={onBack}
            disabled={creating}
          >
            <ArrowLeft className="size-4" />
            Volver a editar
          </button>
        </div>
      </aside>
    </div>
  );
}

function WizardFooter({
  onBack,
  canBack = true,
  nextLabel = "Siguiente",
  skipLabel,
  onSkip,
}: {
  onBack?: () => void;
  canBack?: boolean;
  nextLabel?: string;
  skipLabel?: string;
  onSkip?: () => void;
}) {
  return (
    <div className="wizard-alta__footer">
      {canBack && onBack ? (
        <button
          type="button"
          className="wizard-alta__btn wizard-alta__btn--secondary"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Atrás
        </button>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">
        {onSkip && skipLabel && (
          <button
            type="button"
            className="wizard-alta__btn wizard-alta__btn--gold"
            onClick={onSkip}
          >
            {skipLabel}
          </button>
        )}
        <button type="submit" className="wizard-alta__btn wizard-alta__btn--primary">
          {nextLabel}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
