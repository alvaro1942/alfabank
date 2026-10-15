"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { createTransfer, getUserProfile } from '@/app/actions/user';
import BalancePanel from '@/components/BalancePanel';
import { Alert, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select } from '@/components/ui/kit';
import { formatMoney } from '@/lib/format';

const BANCOS = [
    "BBVA", "Santander", "Scotiabank", "HSBC", "Banamex", "Banorte",
    "Inbursa", "Azteca", "Autofin", "Barclays", "Consubanco", "Banregio",
    "Afirme", "Bajío", "Mifel", "Invex", "BanCoppel", "Bancrea",
    "Actinver", "Intercam", "Bansi", "CIBanco", "Banco Famsa",
    "Banco Ahorro Famsa", "Banco Multiva", "Banco Sabadell", "Klar",
    "Stori", "Nu México", "Hey Banco", "Ualá", "Spin by Oxxo",
    "Mercado Pago", "BBVA Wallet", "CoDi"
];

interface TransferViewProps {
    userProfile?: {
        balance?: number;
        [key: string]: unknown;
    } | null;
}

export default function TransferView({ userProfile: initialProfile }: TransferViewProps = {}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [profile, setProfile] = useState(initialProfile || null);
    const [amountValue, setAmountValue] = useState("");
    const [clabeValue, setClabeValue] = useState("");
    const [reviewing, setReviewing] = useState(false);
    const pending = useRef<FormData | null>(null);
    const [summary, setSummary] = useState({ beneficiario: '', banco: '', clabe: '', amount: '', descripcion: '' });

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
            setAmountValue(val);
        } else {
            e.currentTarget.value = amountValue;
        }
    };

    const handleClabeInput = (e: React.FormEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 18);
        setClabeValue(val);
        e.currentTarget.value = val;
    };

    const setQuickAmount = (val: number) => {
        setAmountValue(val.toFixed(2));
    };

    // Paso 1: validar y mostrar la ventana de revisión
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        const formData = new FormData(e.currentTarget);
        pending.current = formData;
        const bancoValue = String(formData.get('banco') || '');
        setSummary({
            beneficiario: String(formData.get('beneficiario') || ''),
            banco: BANCOS.find((b) => b.toLowerCase() === bancoValue) || bancoValue,
            clabe: String(formData.get('clabe') || ''),
            amount: String(formData.get('amount') || ''),
            descripcion: String(formData.get('descripcion') || ''),
        });
        setReviewing(true);
    };

    // Paso 2: confirmar y registrar la solicitud
    const confirmTransfer = async () => {
        if (!pending.current) return;
        setLoading(true);
        const res = await createTransfer(pending.current);
        setReviewing(false);

        if (res?.success) {
            setSuccess(res.message || "Transferencia en proceso.");
            setTimeout(() => {
                router.push('/dashboard');
            }, 1200);
        } else {
            setError(res?.error || "Error al transferir.");
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                eyebrow="Operaciones"
                title="Transferir"
                description="Solicita una transferencia simulada. Quedará pendiente hasta que un administrador la autorice."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
                <div className="space-y-5 lg:order-1">
                    {error && <Alert onClose={() => setError("")}>{error}</Alert>}
                    {success && <Alert tone="success">{success} Redirigiendo a tu cuenta…</Alert>}

                    <Card>
                        <CardHeader title="Datos del destinatario" subtitle="Todos los campos con * son obligatorios" icon={<Send className="h-4 w-4" aria-hidden />} />
                        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                            <Field label="Monto a transferir" htmlFor="amount" required hint="MXN">
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted">$</span>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        required
                                        value={amountValue}
                                        onInput={handleAmountInput}
                                        onChange={() => {}}
                                        className="!h-14 pl-9 font-mono text-2xl font-semibold"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {[100, 500, 1000].map((v) => (
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

                            <Field label="Nombre del beneficiario" htmlFor="beneficiario" required>
                                <Input id="beneficiario" name="beneficiario" type="text" required placeholder="Nombre completo del titular" />
                            </Field>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Field label="Banco destino" htmlFor="banco" required>
                                    <Select id="banco" name="banco" required defaultValue="">
                                        <option value="" disabled>Seleccionar banco</option>
                                        {BANCOS.map(banco => (
                                            <option key={banco} value={banco.toLowerCase()}>{banco}</option>
                                        ))}
                                    </Select>
                                </Field>

                                <Field label="CLABE interbancaria" htmlFor="clabe" required hint={`${clabeValue.length}/18`}>
                                    <Input
                                        id="clabe"
                                        name="clabe"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="18 dígitos"
                                        required
                                        minLength={18}
                                        maxLength={18}
                                        value={clabeValue}
                                        onInput={handleClabeInput}
                                        onChange={() => {}}
                                        className="font-mono tracking-wider"
                                    />
                                </Field>
                            </div>

                            <Field label="Concepto o referencia" htmlFor="descripcion" hint="Opcional">
                                <Input id="descripcion" name="descripcion" type="text" placeholder="Ej. pago de renta" />
                            </Field>

                            <Button type="submit" size="lg" full disabled={loading || !!success}>
                                Revisar transferencia
                            </Button>
                        </form>
                    </Card>
                </div>

                <aside className="space-y-4 lg:order-2">
                    <BalancePanel
                        balance={balance}
                        note={<>El monto se descuenta al solicitar la transferencia y se devuelve si un administrador la rechaza.</>}
                    />
                    <Card className="p-5">
                        <h3 className="text-sm font-extrabold text-ink">Antes de continuar</h3>
                        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted">
                            <li>• Verifica que la <strong className="text-ink">CLABE tenga 18 dígitos</strong>.</li>
                            <li>• Puedes seguir el estado en tus movimientos.</li>
                            <li>• Es una operación de demostración: no se envía dinero real.</li>
                        </ul>
                    </Card>
                </aside>
            </div>

            <Modal
                open={reviewing}
                onClose={() => !loading && setReviewing(false)}
                title="Confirma tu transferencia"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setReviewing(false)} disabled={loading}>Editar</Button>
                        <Button onClick={confirmTransfer} loading={loading}>Confirmar y solicitar</Button>
                    </>
                }
            >
                <div className="rounded-2xl bg-brand-50 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-800">Monto</p>
                    <p className="font-mono text-3xl font-semibold text-brand-800">${formatMoney(summary.amount)}</p>
                </div>
                <dl className="mt-4 divide-y divide-line text-sm">
                    {[
                        ['Beneficiario', summary.beneficiario],
                        ['Banco', summary.banco],
                        ['CLABE', summary.clabe],
                        ['Concepto', summary.descripcion || '—'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-2.5">
                            <dt className="text-muted">{k}</dt>
                            <dd className={`text-right font-bold text-ink ${k === 'CLABE' ? 'font-mono' : ''} break-all`}>{v}</dd>
                        </div>
                    ))}
                </dl>
            </Modal>
        </div>
    );
}
