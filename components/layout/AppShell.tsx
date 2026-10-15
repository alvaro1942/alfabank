"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Headphones,
  Home,
  LogOut,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { adminNav, brand, privatePrefixes, userNav, type NavItem } from "@/lib/brand";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/app/actions/auth";

const icons: Record<NavItem["icon"], typeof Home> = {
  home: Home,
  send: Send,
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  profile: UserRound,
  admin: ShieldCheck,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Decide si se muestra el entorno privado (barra lateral) o la página tal cual (pública). */
export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const isPrivate = privatePrefixes.some((p) => isActive(pathname, p));

  if (!isPrivate || !user) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}

function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const items = isAdmin ? [...userNav, adminNav] : userNav;
  const initials = (user?.nombre || user?.email || "A").trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Barra lateral — escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Link href="/dashboard" aria-label={`${brand.name} — inicio`}>
            <Logo />
          </Link>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const Icon = icons[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                  active ? "bg-brand-50 text-brand-800" : "text-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-brand-600" : ""}`} aria-hidden />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
              </Link>
            );
          })}
          {brand.support.whatsappUrl && (
            <a
              href={brand.support.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <Headphones className="h-[18px] w-[18px]" aria-hidden />
              Soporte
            </a>
          )}
        </nav>

        <div className="space-y-3 border-t border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-extrabold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{user?.nombre}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong py-2 text-[13px] font-bold text-muted transition-colors hover:border-danger hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
          <p className="text-[11px] leading-snug text-muted">{brand.demoNotice}</p>
        </div>
      </aside>

      {/* Barra superior — móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label={`${brand.name} — inicio`} className="flex items-center gap-2">
          <LogoMark size={30} />
          <span className="text-lg font-extrabold tracking-tight text-brand-800">
            {brand.wordmark.strong} <span className="font-medium text-brand-500">{brand.wordmark.light}</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {brand.support.whatsappUrl && (
            <a
              href={brand.support.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Soporte"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-muted"
            >
              <Headphones className="h-5 w-5" />
            </a>
          )}
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        {children}
        <p className="mt-10 text-center text-xs text-muted lg:hidden">{brand.demoNotice}</p>
      </main>

      {/* Navegación compacta — móvil */}
      <nav
        aria-label="Navegación principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
          {items.map((item) => {
            const Icon = icons[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-bold ${active ? "text-brand-700" : "text-muted"}`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-brand-50" : ""}`}>
                    <Icon className="h-[19px] w-[19px]" aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{item.label === "Administración" ? "Admin" : item.label === "Mi perfil" ? "Perfil" : item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
