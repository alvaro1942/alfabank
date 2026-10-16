import { brand } from "@/lib/brand";
import { groupDigits } from "@/lib/format";
import { LogoMark } from "@/components/ui/Logo";

/**
 * Tarjeta virtual. Fondo azul sólido con trazos geométricos
 * (sin degradados de la versión anterior). `masked` oculta los dígitos centrales.
 */
export default function VirtualCard({
  number,
  holder,
  masked = false,
}: {
  number: string;
  holder?: string;
  masked?: boolean;
}) {
  const grouped = number ? groupDigits(number) : "";
  const shown = !grouped
    ? "•••• •••• •••• ••••"
    : masked
      ? grouped.replace(/\d/g, (d, i) => (i >= grouped.length - 4 ? d : "•"))
      : grouped;

  return (
    <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-brand-800 p-5 text-white shadow-pop sm:p-6">
      <svg className="absolute -right-10 -top-10 h-56 w-56 text-white/[0.07]" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="16" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" strokeWidth="16" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand-500" aria-hidden />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="text-base font-extrabold tracking-tight">
              {brand.wordmark.strong} <span className="font-medium text-brand-200">{brand.wordmark.light}</span>
            </span>
          </div>
          <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-100">
            Virtual
          </span>
        </div>

        <p
          className="whitespace-nowrap font-mono text-[clamp(0.95rem,4.6vw,1.35rem)] font-medium tracking-[0.14em]"
          aria-label={number ? "Número de tarjeta" : "Número de tarjeta pendiente de configurar"}
        >
          {shown}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-200">Titular</p>
            <p className="truncate text-xs font-bold uppercase">{holder || "—"}</p>
          </div>
          <div className="flex shrink-0 gap-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-200">Vence</p>
              <p className="font-mono text-xs font-semibold">{brand.card.expiry}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-200">CVV</p>
              <p className="font-mono text-xs font-semibold">{masked ? "•••" : brand.card.cvv}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
