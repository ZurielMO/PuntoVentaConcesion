"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { useConcessions } from "@/hooks/use-concessions";
import { normalizeStorageImageUrl } from "@/lib/image-url";
import type { Concession } from "@/lib/types";

export default function ConcesionesPage() {
  const {
    concessions,
    loading,
    error,
    refetch,
    createConcession,
    updateConcession,
    deleteConcession,
    uploadConcessionImages,
    deleteConcessionImage,
  } = useConcessions();

  const [nombre, setNombre] = useState("");
  const [editing, setEditing] = useState<Concession | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFiles[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFiles]);

  const resetForm = () => {
    setEditing(null);
    setNombre("");
    setImageFiles([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateConcession(editing.id, { nombre, activo: editing.activo ?? true });
        if (imageFiles.length > 0) {
          await uploadConcessionImages(editing.id, imageFiles);
        }
        toast.success("Concesión actualizada");
        resetForm();
      } else {
        const created = await createConcession({ nombre, activo: true, imagenes: [] });
        if (imageFiles.length > 0 && created?.id) {
          await uploadConcessionImages(created.id, imageFiles);
        }
        toast.success("Concesión creada");
        setNombre("");
        setImageFiles([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (concession: Concession, index: number) => {
    try {
      await deleteConcessionImage(concession.id, index);
      toast.success("Imagen eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar imagen");
    }
  };

  return (
    <RequireRole superAdminOnly>
      <div className="bg-neutral-warm py-[var(--space-5)]">
        <div className="mx-auto max-w-[1200px] px-[var(--outer-gutter)] lg:px-[var(--outer-gutter-lg)]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1>Concesiones</h1>
              <p className="mt-2 text-[1.6rem] text-muted-foreground">
                Crea y administra las concesiones del estadio.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Actualizar
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editing ? "Editar concesión" : "Nueva concesión"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la concesión"
                  required
                  className="max-w-md"
                />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      setImageFiles(e.target.files ? Array.from(e.target.files) : [])
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir logo / imagen
                  </Button>
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="mt-3 max-h-40 rounded-md object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={submitting}>
                    {editing ? "Guardar cambios" : "Crear concesión"}
                  </Button>
                  {editing && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && <p className="text-muted-foreground">Cargando…</p>}
          {error && <p className="text-destructive">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {concessions.map((c) => {
              const img = normalizeStorageImageUrl(c.imagenes?.[0]);
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="text-[1.8rem]">{c.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={c.nombre}
                        className="mb-4 max-h-32 rounded-md object-cover"
                      />
                    )}
                    <p className="text-[1.4rem]">
                      Estado: {c.activo !== false ? "Activa" : "Inactiva"}
                    </p>
                    {c.imagenes && c.imagenes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.imagenes.map((_, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="outline"
                            onClick={() => void handleDeleteImage(c, idx)}
                          >
                            Quitar imagen {idx + 1}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(c);
                          setNombre(c.nombre);
                          setImageFiles([]);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteConcession(c.id)}
                      >
                        Desactivar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
