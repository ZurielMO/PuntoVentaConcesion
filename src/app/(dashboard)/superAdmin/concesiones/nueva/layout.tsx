import type { ReactNode } from "react";

export default function WizardAltaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-2 w-[calc(100%+1rem)] max-w-none md:-mx-4 md:w-[calc(100%+2rem)] lg:-mx-6 lg:w-[calc(100%+3rem)]">
      {children}
    </div>
  );
}
