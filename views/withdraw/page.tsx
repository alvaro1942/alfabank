"use client";

import { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { getUserProfile } from '@/app/actions/user';
import BalancePanel from '@/components/BalancePanel';
import CopyButton from '@/components/CopyButton';
import { Alert, Button, Card, CardHeader, Field, Input, Modal, PageHeader } from '@/components/ui/kit';
import { formatMoney } from '@/lib/format';

interface WithdrawViewProps {
    userProfile?: {
        balance?: number;
        [key: string]: any;
    } | null;
}

export default function WithdrawView({ userProfile: initialProfile }: WithdrawViewProps = {}) {
    const [profile, setProfile] = useState(initialProfile || null);
    const [showModal, setShowModal] = useState(false);
    const [codes, setCodes] = useState<string[]>([]);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!profile) {
            getUserProfile().then((data) => {
                if (data) setProfile(data);
            });
        }
    }, [profile]);

    const balance = profile?.balance ?? 0;

    const handleAmountInput = (e: React.FormEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value;
        const regex = /^\d*\.?\d{0,2}$/;
        if (regex.test(val)) {
            setAmount(val);
            setError('');
        }
    };

    const setQuickAmount = (val: number) => {
        setAmount(val.toFixed(2));
        setError('');
    };

    // Simulación local: no modifica saldo ni base de datos (igual que la versión original).
    const handleWithdraw = (e?: React.FormEvent) => {
        e?.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Ingresa un monto válido para retirar.");
            return;
        }

        if (numAmount > balance) {
            setError("Saldo insuficiente para generar este código de retiro.");
            return;
        }

        // Generate 4 random 4-digit withdrawal codes
        const newCodes = Array.from({ length: 4 }, () =>
            Math.floor(1000 + Math.random() * 9000).toString()
        );

        setCodes(newCodes);
        setShowModal(true);
        setError('');
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                eyebrow="Operaciones"
                title="Retirar"
                description="Genera claves de retiro de demostración. Esta simulación no modifica tu saldo."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
                <Card>
                    <CardHeader title="Solicitud de claves" subtitle="Se generan 4 claves de 4 dígitos" icon={<KeyRound className="h-4 w-4" aria-hidden />} />
                    <form onSubmit={handleWithdraw} className="space-y-5 p-5 sm:p-6">
                        {error && <Alert>{error}</Alert>}

                        <Field label="Monto a retirar" htmlFor="withdraw-amount" required hint="MXN">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted">$</span>
                                <Input
                                    id="withdraw-amount"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={amount}
                                    onInput={handleAmountInput}
                                    onChange={() => {}}
                                    className="!h-14 pl-9 font-mono text-2xl font-semibold"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[200, 500, 1000].map((v) => (
                                    <button key={v} type="button" onClick={() => setQuickAmount(v)} className="cursor-pointer rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-800">
                                        ${v.toLocaleString('en-US')}
                                    </button>
                                ))}
                                {balance > 0 && (
                                    <button type="button" onClick={() => setQuickAmount(balance)} className="cursor-pointer rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 transition-colors hover:bg-brand-100">
                                        Todo el saldo (${formatMoney(balance)})
                                    </button>
                                )}
                            </div>
                        </Field>

                        <Button type="submit" size="lg" full>
                            <KeyRound className="h-5 w-5" aria-hidden />
                            Generar claves de retiro
                        </Button>
                    </form>
                </Card>

                <aside className="space-y-4">
                    <BalancePanel balance={balance} />
                    <Card className="p-5">
                        <h3 className="text-sm font-extrabold text-ink">Cómo funciona</h3>
                        <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted">
                            <li>1. Indica el monto, sin exceder tu saldo.</li>
                            <li>2. Genera las 4 claves de la simulación.</li>
                            <li>3. Las claves son ilustrativas: no se descuenta saldo ni se guarda un movimiento.</li>
                        </ol>
                    </Card>
                </aside>
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Claves generadas"
                footer={<Button full onClick={() => setShowModal(false)}>Entendido</Button>}
            >
                <div className="space-y-5 text-center">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">Monto solicitado</p>
                        <p className="font-mono text-3xl font-semibold text-brand-800">${formatMoney(parseFloat(amount || '0'))}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {codes.map((code, idx) => (
                            <div key={idx} className="rounded-xl bg-brand-50 py-4 font-mono text-2xl font-semibold tracking-[0.2em] text-brand-900">
                                {code}
                            </div>
                        ))}
                    </div>
                    <CopyButton text={codes.join(' - ')} label="Copiar todas las claves" doneLabel="Claves copiadas" full />
                    <p className="text-xs text-muted">Simulación sin efecto en tu saldo.</p>
                </div>
            </Modal>
        </div>
    );
}
