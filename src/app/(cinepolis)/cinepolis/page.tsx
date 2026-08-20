"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { CinepolisAssignModal } from "@/components/cinepolis/cinepolis-assign-modal";
import { CinepolisHistory } from "@/components/cinepolis/cinepolis-history";
import { useCinepolisPuntos, type ClubMember } from "@/hooks/use-cinepolis-puntos";
import { useKeyboardWedgeQr } from "@/hooks/use-keyboard-wedge-qr";
import { calcularPuntosCinepolis } from "@/lib/cinepolis";

export default function CinepolisPuntosPage() {
  const {
    asignaciones,
    hasMore,
    nextCursor,
    loading,
    loadingMore,
    error,
    lookupMember,
    assignPoints,
    fetchAsignaciones,
  } = useCinepolisPuntos();

  const [member, setMember] = useState<ClubMember | null>(null);
  const [comentario, setComentario] = useState("");
  const [amount, setAmount] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [result, setResult] = useState<{
    points: number;
    balanceAfter: number;
  } | null>(null);

  const modalOpen = Boolean(member);
  const amountMxn = Number(amount);
  const previewPoints = useMemo(
    () => (Number.isFinite(amountMxn) ? calcularPuntosCinepolis(amountMxn) : 0),
    [amountMxn],
  );

  useEffect(() => {
    void fetchAsignaciones();
  }, [fetchAsignaciones]);

  const closeModal = () => {
    if (isAssigning) return;
    setMember(null);
    setComentario("");
    setAmount("");
    setResult(null);
  };

  const onScan = useCallback(
    (memberId: string) => {
      setIsResolving(true);
      void lookupMember(memberId)
        .then((summary) => {
          setMember(summary);
          setComentario("");
          setAmount("");
          setResult(null);
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "QR no válido";
          toast.error("QR no válido", { description: message });
        })
        .finally(() => setIsResolving(false));
    },
    [lookupMember],
  );

  useKeyboardWedgeQr({
    enabled: !modalOpen && !isResolving,
    onScan,
  });

  const confirmAssign = async () => {
    if (!member || previewPoints <= 0 || isAssigning) return;
    setIsAssigning(true);
    try {
      const assigned = await assignPoints({
        memberId: member.id,
        dinero: amountMxn,
        comentario: comentario.trim() || undefined,
      });
      setResult({
        points: assigned.puntosAsignados,
        balanceAfter: assigned.puntosActuales,
      });
      toast.success("Puntos asignados", {
        description: `+${assigned.puntosAsignados} puntos para ${assigned.customerFullName}`,
      });
      void fetchAsignaciones();
    } catch (err) {
      toast.error("No se asignaron los puntos", {
        description: err instanceof Error ? err.message : "Intenta de nuevo",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-[1.6rem] bg-[#003DA5] text-white shadow-[0_14px_32px_rgba(0,61,165,0.2)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1.5 bg-[#FFC72C]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[16rem]">
          <video
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className="absolute inset-0 h-full w-full object-cover object-center"
            src="/video/leonvideo.mp4"
          />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-[#003DA5]" />
        </div>

        <div className="relative z-10 flex min-h-48 flex-col items-center justify-center px-6 py-6 text-center md:min-h-[14.5rem]">
          <div className="flex size-[4.4rem] items-center justify-center rounded-full border border-white/15 bg-white/10">
            {isResolving ? (
              <Loader2 className="size-7 animate-spin text-[#FFC72C]" />
            ) : (
              <ScanLine className="size-7 text-[#FFC72C]" />
            )}
          </div>
          <p className="mt-4 text-[1.05rem] font-semibold uppercase tracking-[0.22em] text-[#FFC72C]">
            {isResolving ? "Leyendo código" : "Listo para escanear"}
          </p>
          <h1 className="mt-2 text-[2.2rem] font-bold leading-tight tracking-tight !text-white md:text-[2.6rem]">
            Escanea el QR del socio
          </h1>
          <p className="mt-2 max-w-lg text-[1.25rem] leading-relaxed text-white/80">
            {isResolving
              ? "Estamos identificando al socio…"
              : "El lector captura el código en automático. Confirma el consumo y los puntos se acreditan al instante."}
          </p>
        </div>
      </section>

      <CinepolisHistory
        asignaciones={asignaciones}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={() => void fetchAsignaciones(nextCursor ?? undefined)}
      />

      <CinepolisAssignModal
        member={member}
        comentario={comentario}
        amount={amount}
        previewPoints={previewPoints}
        isAssigning={isAssigning}
        result={result}
        onComentarioChange={setComentario}
        onAmountChange={setAmount}
        onCancel={closeModal}
        onConfirm={() => void confirmAssign()}
      />
    </>
  );
}
