"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";

/* ───────── Botones ───────── */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-surface text-ink border border-line-strong hover:border-brand-500 hover:text-brand-700",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  ghost: "text-muted hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

function btnClass(variant: Variant, size: Size, full?: boolean, extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  loading,
  className = "",
  children,
  disabled,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean; loading?: boolean }) {
  return (
    <button className={btnClass(variant, size, full, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <Link className={btnClass(variant, size, full, className)} {...rest} />;
}

/* ───────── Campos ───────── */

export const inputBase =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-bold text-ink">
        <span>
          {label}
          {required && <span className="text-brand-600"> *</span>}
        </span>
        {hint && <span className="text-xs font-medium text-muted">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function Input({ className = "", invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={`${inputBase} h-11 ${invalid ? "border-danger bg-danger-soft focus:border-danger focus:ring-danger-soft" : ""} ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={`${inputBase} h-11 cursor-pointer ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...rest }: ComponentProps<"textarea">) {
  return <textarea className={`${inputBase} min-h-[88px] py-2.5 ${className}`} {...rest} />;
}

/* ───────── Contenedores ───────── */

export function Card({
  className = "",
  children,
  as: Tag = "section",
}: {
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
}) {
  return <Tag className={`rounded-card border border-line bg-surface shadow-card ${className}`}>{children}</Tag>;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-extrabold text-ink">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/* ───────── Estados ───────── */

type Tone = "success" | "warning" | "danger" | "neutral" | "brand";
const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-muted",
  brand: "bg-brand-50 text-brand-800",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Alert({
  tone = "danger",
  children,
  onClose,
}: {
  tone?: "danger" | "success" | "info";
  children: ReactNode;
  onClose?: () => void;
}) {
  const style =
    tone === "danger"
      ? "bg-danger-soft text-danger border-danger/25"
      : tone === "success"
        ? "bg-success-soft text-success border-success/25"
        : "bg-brand-50 text-brand-800 border-brand-200";
  const Icon = tone === "danger" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm font-semibold ${style}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} aria-label="Cerrar mensaje" className="cursor-pointer opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
        {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-brand-500" aria-hidden />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

/* ───────── Ventanas ───────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-brand-900/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-rise relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface shadow-pop outline-none sm:rounded-3xl ${size === "sm" ? "sm:max-w-sm" : "sm:max-w-md"}`}
      >
        <div className="flex items-center justify-between gap-3 px-6 pb-2 pt-5">
          <h2 id={titleId} className="text-lg font-extrabold text-ink">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-5 pt-2">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-muted">{message}</div>
    </Modal>
  );
}
