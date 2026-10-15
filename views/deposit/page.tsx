"use client";

import { useState, useEffect } from 'react';
import { Banknote, CheckCircle2, Landmark, Store } from 'lucide-react';
import { getUserProfile } from '@/app/actions/user';
import BalancePanel from '@/components/BalancePanel';
import CopyButton from '@/components/CopyButton';
import { Alert, Button, Card, CardHeader, PageHeader } from '@/components/ui/kit';
import { brand } from '@/lib/brand';
import type { SystemSettings } from '@/lib/types';
import { groupDigits } from '@/lib/format';

interface DepositViewProps {
    settings?: Partial<SystemSettings> | null;
    userProfile?: {
        balance?: number;
        nombres?: string;
        apellidoPaterno?: string;
        [key: string]: unknown;
    } | null;
}

/** Patrón decorativo con apariencia de QR. No es escaneable ni codifica datos. */
function QrPlaceholder() {
    const size = 21;
    const finder = (x: number, y: number) => {
        const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
        for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
            if (inBox(ox, oy)) {
                const dx = x - ox, dy = y - oy;
                return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
            }
        }
        return null;
    };
    const cells: React.ReactNode[] = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const f = finder(x, y);
            const on = f !== null ? f : ((x * 7 + y * 13 + x * y) % 5 < 2);
            if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
        }
    }
    return (
        <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="h-full w-full text-brand-900" fill="currentColor" role="img" aria-label="Código QR de demostración" shapeRendering="crispEdges">
            {cells}
        </svg>
    );
}

export default function DepositView({ settings, userProfile: initialProfile }: DepositViewProps) {
    const [profile, setProfile] = useState(initialProfile || null);
    const [method, setMethod] = useState<'spei' | 'cash'>('spei');
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        if (!profile) {
            getUserProfile().then((data) => {
                if (data) setProfile(data);
            });
        }
    }, [profile]);

    const balance = profile?.balance ?? 0;
    const clabe: string = settings?.clabe || '';
    const qrNum: string = settings?.qrNumber || '';
    const holder = profile ? `${profile.nombres || ''} ${profile.apellidoPaterno || ''}`.trim() : '';

    const tabs = [
        { id: 'spei' as const, label: 'Transferencia', icon: Landmark },
        { id: 'cash' as const, label: 'Efectivo', icon: Store },
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                eyebrow="Operaciones"
                title="Depositar"
                description="Consulta los datos para abonar saldo a tu cuenta de demostración."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
                <div className="space-y-5">
                    <div className="inline-flex rounded-xl bg-surface-muted p-1" role="tablist" aria-label="Método de depósito">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={method === id}
                                onClick={() => setMethod(id)}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${method === id ? 'bg-surface text-brand-800 shadow-sm' : 'text-muted hover:text-ink'}`}
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>

                    {method === 'spei' ? (
                        <Card>
                            <CardHeader title="Transferencia a CLABE" subtitle="Usa estos datos como destino" icon={<Landmark className="h-4 w-4" aria-hidden />} />
                            <div className="space-y-5 p-5 sm:p-6">
                                <div className="rounded-2xl bg-brand-50 p-5">
                                    <p className="text-xs font-bold uppercase tracking-wider text-brand-800">CLABE interbancaria</p>
                                    {clabe ? (
                                        <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-wider text-brand-900 select-all sm:text-3xl">{clabe}</p>
                                    ) : (
                                        <p className="mt-2 text-sm font-semibold text-brand-800">Pendiente de configurar por el administrador.</p>
                                    )}
                                    <div className="mt-4">
                                        <CopyButton text={clabe} label="Copiar CLABE" doneLabel="CLABE copiada" variant="primary" />
                                    </div>
                                </div>

                                <dl className="divide-y divide-line rounded-xl border border-line text-sm">
                                    {[
                                        ['Beneficiario', brand.name + ' (demostración)'],
                                        ['Titular de la cuenta', holder || '—'],
                                        ['Concepto', 'Abono a cuenta propia'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between gap-4 px-4 py-3">
                                            <dt className="text-muted">{k}</dt>
                                            <dd className="text-right font-bold text-ink">{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <Alert tone="info">Es un entorno de demostración: un administrador es quien acredita el saldo en tu cuenta.</Alert>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader title="Depósito en efectivo" subtitle="Referencia y código de demostración" icon={<Store className="h-4 w-4" aria-hidden />} />
                            <div className="grid gap-6 p-5 sm:grid-cols-[200px_1fr] sm:p-6">
                                <div className="mx-auto w-full max-w-[200px]">
                                    <div className="aspect-square rounded-2xl border border-line bg-white p-3">
                                        <QrPlaceholder />
                                    </div>
                                    <p className="mt-2 text-center text-[11px] font-semibold text-muted">QR ilustrativo, no escaneable</p>
                                </div>
                                <div className="space-y-5">
                                    <ol className="space-y-3 text-sm text-muted">
                                        {[
                                            'Acude a un punto de pago de tu preferencia.',
                                            'Indica la referencia que aparece abajo.',
                                            'Realiza el pago por el monto deseado.',
                                            <>Presiona <strong className="text-ink">«Ya deposité»</strong> para avisar de la operación.</>,
                                        ].map((s, i) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-800">{i + 1}</span>
                                                <span className="pt-0.5">{s}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="rounded-xl bg-brand-50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-brand-800">Número de referencia</p>
                                        {qrNum ? (
                                            <p className="mt-1 break-all font-mono text-xl font-semibold tracking-widest text-brand-900">{groupDigits(qrNum)}</p>
                                        ) : (
                                            <p className="mt-1 text-sm font-semibold text-brand-800">Pendiente de configurar por el administrador.</p>
                                        )}
                                        <div className="mt-3">
                                            <CopyButton text={qrNum} label="Copiar referencia" doneLabel="Referencia copiada" size="sm" />
                                        </div>
                                    </div>

                                    {notified ? (
                                        <Alert tone="success">
                                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" aria-hidden /> Aviso registrado en pantalla. Un administrador acreditará el saldo.</span>
                                        </Alert>
                                    ) : (
                                        <Button full onClick={() => setNotified(true)}>
                                            <Banknote className="h-4 w-4" aria-hidden /> Ya deposité
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                <aside>
                    <BalancePanel balance={balance} note="Tu saldo se actualiza cuando un administrador acredita el depósito." />
                </aside>
            </div>
        </div>
    );
}
