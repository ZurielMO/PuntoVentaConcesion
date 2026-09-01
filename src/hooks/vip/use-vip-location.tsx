"use client";

import React, { createContext, useContext, useState } from "react";
import type { VipLocation, StadiumZone } from "@/lib/vip/types";

interface VipLocationContextType {
  location: VipLocation;
  setZona: (zona: StadiumZone) => void;
  setPalco: (palco: string) => void;
  setNivel: (nivel: string) => void;
  setNotas: (notas: string) => void;
  updateLocation: (loc: Partial<VipLocation>) => void;
  formattedLocation: string;
}

const VipLocationContext = createContext<VipLocationContextType | undefined>(undefined);

export function VipLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<VipLocation>({
    zona: "Poniente",
    palco: "",
    nivel: "",
  });

  const setZona = (zona: StadiumZone) => {
    setLocationState((prev) => ({ ...prev, zona }));
  };

  const setPalco = (palco: string) => {
    setLocationState((prev) => ({ ...prev, palco }));
  };

  const setNivel = (nivel: string) => {
    setLocationState((prev) => ({ ...prev, nivel }));
  };

  const setNotas = (notas: string) => {
    setLocationState((prev) => ({ ...prev, notas }));
  };

  const updateLocation = (loc: Partial<VipLocation>) => {
    setLocationState((prev) => ({ ...prev, ...loc }));
  };

  const formattedLocation = `Zona ${location.zona} · Palco ${location.palco}${
    location.nivel ? ` (${location.nivel})` : ""
  }`;

  return (
    <VipLocationContext.Provider
      value={{
        location,
        setZona,
        setPalco,
        setNivel,
        setNotas,
        updateLocation,
        formattedLocation,
      }}
    >
      {children}
    </VipLocationContext.Provider>
  );
}

export function useVipLocation() {
  const context = useContext(VipLocationContext);
  if (!context) {
    throw new Error("useVipLocation must be used within a VipLocationProvider");
  }
  return context;
}
