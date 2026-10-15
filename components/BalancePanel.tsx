import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";

/** Saldo compacto reutilizado en transferir, depositar y retirar. */
export default function BalancePanel({ balance, note }: { balance: number; note?: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
        <Wallet className="h-4 w-4 text-brand-600" aria-hidden />
        Saldo disponible
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-brand-800">${formatMoney(balance)}</p>
      <p className="text-xs font-semibold text-muted">MXN</p>
      {note && <div className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">{note}</div>}
    </div>
  );
}
