import { VIP_MASCOT, VIP_MASCOT_ALT, type VipMascotName } from "@/lib/vip/mascot";

type MascotSize = "logo" | "chip" | "card" | "hero" | "empty" | "peek";

const SIZE_CLASS: Record<MascotSize, string> = {
  logo: "w-10 h-10",
  chip: "w-12 h-12 sm:w-14 sm:h-14",
  card: "w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20",
  hero: "w-[108px] sm:w-[184px] md:w-[220px] h-auto",
  empty: "w-[140px] sm:w-[196px] h-auto",
  peek: "w-[72px] sm:w-[148px] md:w-[168px] h-auto",
};

interface VipMascotProps {
  name: VipMascotName;
  size?: MascotSize;
  className?: string;
  alt?: string;
  decorative?: boolean;
  priority?: boolean;
}

export function VipMascot({
  name,
  size = "card",
  className = "",
  alt,
  decorative = false,
  priority = false,
}: Readonly<VipMascotProps>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={VIP_MASCOT[name]}
      alt={decorative ? "" : alt ?? VIP_MASCOT_ALT[name]}
      aria-hidden={decorative || undefined}
      width={1254}
      height={1254}
      draggable={false}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "low"}
      className={`object-contain object-center select-none pointer-events-none ${SIZE_CLASS[size]} ${className}`}
    />
  );
}
