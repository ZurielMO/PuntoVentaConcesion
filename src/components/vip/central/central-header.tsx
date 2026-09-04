"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RotateCw, Radio, Menu, X, Printer } from "lucide-react";

interface CentralHeaderProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  selectedConcession: string;
  onSelectConcession: (concessionId: string) => void;
  fecha: string;
  onSelectFecha: (fecha: string) => void;
  concessions: Array<{ id: string; name: string }>;
  zona: string;
  onChangeZona: () => void;
  usbPrinterAvailable?: boolean;
  onConnectPrinter?: () => void;
}

export const CentralHeader: React.FC<CentralHeaderProps> = ({
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isRefreshing,
  selectedConcession,
  onSelectConcession,
  fecha,
  onSelectFecha,
  concessions,
  zona,
  onChangeZona,
  usbPrinterAvailable,
  onConnectPrinter,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#102D24] text-white border-b border-[#234D41]">
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-[#187B56] border border-[#00FF85]/40 flex items-center justify-center text-2xl">
            🦁
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-lg leading-tight text-white">
              Central Palcos
            </h1>
            <p className="text-sm text-[#ACB5C9] font-semibold truncate">Palcos {zona}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {autoRefresh && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF85] animate-pulse" title="Auto-actualización" />
          )}
          <button
            type="button"
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="w-12 h-12 rounded-xl bg-[#183C32] border border-[#234D41] flex items-center justify-center active:scale-95 disabled:opacity-50"
            title="Refrescar"
          >
            <RotateCw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="w-12 h-12 rounded-xl bg-[#183C32] border border-[#234D41] flex items-center justify-center active:scale-95"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[#234D41] pt-3 bg-[#0C241C]">
          <label className="flex flex-col gap-1.5 text-base uppercase font-bold tracking-wide text-[#ACB5C9]">
            <span>Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => onSelectFecha(e.target.value)}
              className="bg-[#183C32] text-white font-bold text-lg px-3 min-h-14 rounded-xl border border-[#234D41] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-base uppercase font-bold tracking-wide text-[#ACB5C9]">
            <span>Concesión</span>
            <select
              value={selectedConcession}
              onChange={(e) => onSelectConcession(e.target.value)}
              className="bg-[#183C32] text-white font-bold text-lg px-3 min-h-14 rounded-xl border border-[#234D41] focus:outline-none"
            >
              <option value="ALL">Todas</option>
              {concessions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            className={`min-h-14 px-3 rounded-xl text-lg font-bold flex items-center justify-center gap-2 border ${
              autoRefresh
                ? "bg-[#187B56] text-white border-[#00FF85]/40"
                : "bg-[#183C32] text-[#ACB5C9] border-[#234D41]"
            }`}
          >
            <Radio className={`w-5 h-5 ${autoRefresh ? "text-[#00FF85]" : ""}`} />
            Auto cada 10s {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onChangeZona();
            }}
            className="min-h-14 px-3 rounded-xl bg-[#183C32] text-white text-lg font-bold border border-[#234D41]"
          >
            Cambiar zona ({zona})
          </button>
          {usbPrinterAvailable && onConnectPrinter && (
            <button
              type="button"
              onClick={onConnectPrinter}
              className="min-h-14 px-3 rounded-xl bg-[#183C32] text-white text-lg font-bold border border-[#234D41] flex items-center justify-center gap-2"
            >
              <Printer className="w-6 h-6" />
              Conectar impresora
            </button>
          )}
          <Link
            href="/servicio-palcos/inicio"
            target="_blank"
            className="min-h-14 px-3 rounded-xl bg-white/10 text-white text-lg font-bold border border-white/20 flex items-center justify-center"
          >
            Vista palco
          </Link>
        </div>
      )}
    </header>
  );
};
