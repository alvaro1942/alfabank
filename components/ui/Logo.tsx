import { brand } from "@/lib/brand";

/** Símbolo geométrico: un arco "A" abierto con un punto, sobre un cuadrado redondeado. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={brand.name}
      className={className}
    >
      <rect width="40" height="40" rx="11" fill="var(--color-brand-500)" />
      <path
        d="M10.5 30 L20 9.5 L29.5 30"
        fill="none"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="27.2" r="2.7" fill="var(--color-brand-900)" />
    </svg>
  );
}

export function Logo({
  size = 36,
  tone = "dark",
  className = "",
}: {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
}) {
  const strong = tone === "light" ? "text-white" : "text-brand-800";
  const light = tone === "light" ? "text-brand-100" : "text-brand-500";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-xl leading-none tracking-tight">
        <span className={`font-extrabold ${strong}`}>{brand.wordmark.strong}</span>
        <span className={`font-medium ${light}`}> {brand.wordmark.light}</span>
      </span>
    </span>
  );
}
