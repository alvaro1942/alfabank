"use client";

import { useState, useEffect } from 'react';
import { getUserTransactions } from '@/app/actions/user';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CreditCard,
    History,
    Lock,
    RefreshCw,
    Send,
} from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, LinkButton, Modal, PageHeader, Spinner } from '@/components/ui/kit';
import VirtualCard from '@/components/VirtualCard';
import { brand } from '@/lib/brand';
import type { SystemSettings, UserTransaction } from '@/lib/types';
import { formatDateTime, formatMoney } from '@/lib/format';

interface UserProfile {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    isActive: boolean;
    balance: number;
    [key: string]: unknown;
}

type Filter = 'ALL' | 'DEPOSIT' | 'TRANSFER' | 'WITHDRAWAL';
const filters: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'Todos' },
    { id: 'DEPOSIT', label: 'Depósitos' },
    { id: 'TRANSFER', label: 'Transferencias' },
    { id: 'WITHDRAWAL', label: 'Retiros' },
];

export default function DashboardView({ userProfile, settings }: { userProfile: UserProfile, settings?: Partial<SystemSettings> | null }) {
    const [showCard, setShowCard] = useState(false);
    const [filter, setFilter] = useState<Filter>('ALL');
    const [transactions, setTransactions] = useState<UserTransaction[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);

    const fetchTx = async () => {
        setLoadingTx(true);
        const res = await getUserTransactions();
        if (res?.success) {
            setTransactions(res.transactions || []);
        } else {
            console.error("Error fetching tx:", res?.error);
        }
        setLoadingTx(false);
    };

    useEffect(() => {
        let cancelled = false;
        getUserTransactions().then((res) => {
            if (cancelled) return;
            if (res?.success) setTransactions(res.transactions || []);
            else console.error("Error fetching tx:", res?.error);
            setLoadingTx(false);
        });
        return () => { cancelled = true; };
    }, []);

    const cardNumber: string = settings?.cardNumber || '';
    const holder = `${userProfile.nombres} ${userProfile.apellidoPaterno}`.trim();
    const visible = transactions.filter((t) => filter === 'ALL' || t.type === filter);

    return (
        <div className="space-y-6 lg:space-y-8">
            <PageHeader
                eyebrow="Resumen"
                title={`Hola, ${userProfile.nombres}`}
                description="Consulta tu saldo, tu tarjeta y la actividad reciente de tu cuenta."
                action={!userProfile.isActive ? <Badge tone="danger">Cuenta desactivada</Badge> : undefined}
            />

            {!userProfile.isActive && (
                <Alert>Tu cuenta se encuentra desactivada temporalmente por un administrador.</Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-8">
                <div className="space-y-6 lg:col-span-2 lg:space-y-8">
                    {/* Saldo */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">Saldo disponible</p>
                                <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-brand-800 sm:text-5xl">
                                    ${formatMoney(userProfile.balance)}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-muted">{brand.currency} · Cuenta principal</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:flex">
                                <LinkButton href="/transfer" variant="primary" className="flex-col gap-1 !h-auto py-3 sm:flex-row sm:gap-2 sm:!h-11 sm:py-0">
                                    <Send className="h-4 w-4" aria-hidden /> Transferir
                                </LinkButton>
                                <LinkButton href="/deposit" variant="soft" className="flex-col gap-1 !h-auto py-3 sm:flex-row sm:gap-2 sm:!h-11 sm:py-0">
                                    <ArrowDownToLine className="h-4 w-4" aria-hidden /> Depositar
                                </LinkButton>
                                <LinkButton href="/withdraw" variant="soft" className="flex-col gap-1 !h-auto py-3 sm:flex-row sm:gap-2 sm:!h-11 sm:py-0">
                                    <ArrowUpFromLine className="h-4 w-4" aria-hidden /> Retirar
                                </LinkButton>
                            </div>
                        </div>
                    </Card>

                    {/* Movimientos */}
                    <Card>
                        <CardHeader
                            title="Movimientos"
                            subtitle="Últimos 20 registros"
                            icon={<History className="h-4 w-4" aria-hidden />}
                            action={
                                <Button variant="ghost" size="sm" onClick={fetchTx} aria-label="Actualizar movimientos">
                                    <RefreshCw className={`h-4 w-4 ${loadingTx ? 'animate-spin' : ''}`} aria-hidden />
                                    <span className="hidden sm:inline">Actualizar</span>
                                </Button>
                            }
                        />

                        <div className="flex gap-2 overflow-x-auto border-b border-line px-5 py-3 sm:px-6" role="tablist" aria-label="Filtrar movimientos">
                            {filters.map((f) => (
                                <button
                                    key={f.id}
                                    role="tab"
                                    aria-selected={filter === f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${filter === f.id ? 'bg-brand-800 text-white' : 'bg-surface-muted text-muted hover:text-ink'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {loadingTx ? (
                            <Spinner label="Cargando movimientos…" />
                        ) : visible.length === 0 ? (
                            <EmptyState
                                icon={<History className="h-6 w-6" aria-hidden />}
                                title={transactions.length === 0 ? 'Aún no hay movimientos' : 'Sin resultados en este filtro'}
                                text={transactions.length === 0 ? 'Cuando recibas saldo o solicites una transferencia, aparecerá aquí.' : 'Prueba con otra categoría.'}
                            />
                        ) : (
                            <ul className="divide-y divide-line">
                                {visible.map((tx) => {
                                    const isDeposit = tx.type === 'DEPOSIT';
                                    const isTransfer = tx.type === 'TRANSFER';
                                    const isPending = tx.status === 'PENDING';
                                    const isRejected = tx.status === 'REJECTED';
                                    const sign = isDeposit ? '+' : (isRejected ? '' : '-');
                                    const Icon = isDeposit ? ArrowDownToLine : (isTransfer ? Send : ArrowUpFromLine);
                                    const iconStyle = isDeposit
                                        ? 'bg-success-soft text-success'
                                        : isPending ? 'bg-warning-soft text-warning'
                                        : isRejected ? 'bg-surface-muted text-muted'
                                        : 'bg-brand-50 text-brand-700';
                                    const amountStyle = isDeposit ? 'text-success' : isPending ? 'text-warning' : isRejected ? 'text-muted line-through' : 'text-ink';

                                    return (
                                        <li key={tx.id} className="flex items-center gap-3.5 px-5 py-4 sm:px-6">
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
                                                <Icon className="h-[18px] w-[18px]" aria-hidden />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                                                    {isDeposit ? 'Depósito recibido' : (isTransfer ? 'Transferencia' : 'Retiro')}
                                                    {isPending && <Badge tone="warning">Pendiente</Badge>}
                                                    {isRejected && <Badge tone="neutral">Rechazada</Badge>}
                                                </p>
                                                <p className="truncate text-xs text-muted">
                                                    {isTransfer && tx.destinationName ? `Para ${tx.destinationName} · ` : ''}
                                                    {formatDateTime(tx.createdAt)}
                                                </p>
                                            </div>
                                            <p className={`shrink-0 font-mono text-[15px] font-semibold ${amountStyle}`}>
                                                {sign}${formatMoney(tx.amount)}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Tarjeta virtual */}
                <aside className="space-y-4 lg:sticky lg:top-8">
                    <h2 className="px-1 text-xs font-extrabold uppercase tracking-wider text-muted">Tarjeta virtual</h2>
                    <VirtualCard number={cardNumber} holder={holder} masked />
                    <Button variant="secondary" full onClick={() => setShowCard(true)}>
                        <CreditCard className="h-4 w-4" aria-hidden />
                        Ver datos de la tarjeta
                    </Button>
                </aside>
            </div>

            <Modal open={showCard} onClose={() => setShowCard(false)} title="Tu tarjeta virtual">
                <div className="space-y-4">
                    <VirtualCard number={cardNumber} holder={holder} />
                    {!cardNumber && (
                        <Alert tone="info">El administrador aún no ha configurado el número de tarjeta de demostración.</Alert>
                    )}
                    <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-800">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        Tarjeta ficticia para la demostración de {brand.name}; no realiza cargos ni pagos reales.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
