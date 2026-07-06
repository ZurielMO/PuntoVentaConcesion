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

function navItemMatches(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function resolveActiveHref(pathname: string, groups: NavGroup[]): string | null {
  const matches = groups
    .flatMap((group) => group.items)
    .filter((item) => navItemMatches(pathname, item.href))
    .map((item) => item.href);

  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function AppSidebarNav({ groups, onNavigate, className }: AppSidebarNavProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname, groups);

  return (
    <nav className={cn("flex flex-col gap-6 p-4", className)}>
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[1.1rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === activeHref;
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
