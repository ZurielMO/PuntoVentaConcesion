"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

type AppSidebarNavProps = {
  groups: NavGroup[];
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebarNav({ groups, onNavigate, className }: AppSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-6 p-4", className)}>
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[1.1rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn("sidebar-link", active && "sidebar-link-active")}
                  >
                    <Icon className="size-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
