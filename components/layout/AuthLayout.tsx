import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { brand } from "@/lib/brand";

/** Estructura compartida de acceso y registro: panel de marca claro + formulario. */
export default function AuthLayout({
  title,
  subtitle,
  points,
  children,
  wide,
}: {
  title: string;
  subtitle: string;
  points: string[];
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-50 lg:block">
        {/* Geometría decorativa */}
        <svg className="absolute -bottom-24 -right-24 h-[34rem] w-[34rem] text-brand-500/10" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="14" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="14" />
          <circle cx="100" cy="100" r="28" fill="currentColor" />
        </svg>
        <div className="sticky top-0 flex h-dvh flex-col justify-between p-12">
          <Link href="/" aria-label={`${brand.name} — inicio`}>
            <Logo size={40} />
          </Link>
          <div className="relative max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-brand-800">{title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p>
            <ul className="mt-8 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm font-semibold text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" aria-label={`${brand.name} — inicio`} className="lg:hidden">
            <Logo size={32} />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al inicio
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
        </div>
      </main>
    </div>
  );
}
