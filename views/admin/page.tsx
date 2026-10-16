"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock,
    FileText,
    Key,
    Lock,
    MinusCircle,
    PlusCircle,
    RefreshCw,
    Save,
    Search,
    Settings as SettingsIcon,
    ShieldCheck,
    Trash2,
    Unlock,
    Users,
    Wallet,
    X,
} from "lucide-react";
import {
    getAllUsers,
    getAllAccountsTransactions,
    fundAccount,
    deleteUser,
    toggleUserStatus,
    toggleAdminRole,
    getPendingTransfers,
    resolveTransfer,
    resetUserPassword,
} from "@/app/actions/admin";
import { getSystemSettings, updateSystemSettings } from "@/app/actions/settings";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, PageHeader, Spinner } from "@/components/ui/kit";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { AdminAccount, AdminUser, PendingTransfer } from "@/lib/types";

type Tab = 'usuarios' | 'fondos' | 'aprobaciones' | 'ajustes';

type Pending = {
    title: string;
    message: React.ReactNode;
    label: string;
    destructive?: boolean;
    run: () => Promise<void>;
} | null;

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'fondos', label: 'Saldos y seguridad', icon: FileText },
    { id: 'aprobaciones', label: 'Aprobaciones', icon: Clock },
    { id: 'ajustes', label: 'Ajustes', icon: SettingsIcon },
];

function Stat({ label, value, icon: Icon, tone = 'brand' }: { label: string; value: string; icon: typeof Users; tone?: 'brand' | 'warning' }) {
    return (
        <Card className="flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-brand-50 text-brand-700'}`}>
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
                <p className="truncate font-mono text-xl font-semibold text-ink">{value}</p>
            </div>
        </Card>
    );
}

export default function AdminView() {
    const [activeTab, setActiveTab] = useState<Tab>('usuarios');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
    const [systemSettings, setSystemSettings] = useState({ cardNumber: '', qrNumber: '', clabe: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [fundingAmount, setFundingAmount] = useState<{ [key: string]: string }>({});
    const [passwordInputs, setPasswordInputs] = useState<{ [key: string]: string }>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirm, setConfirm] = useState<Pending>(null);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [usersRes, accountsRes, pendingRes, settings] = await Promise.all([
                getAllUsers(),
                getAllAccountsTransactions(),
                getPendingTransfers(),
                getSystemSettings(),
            ]);

            if (usersRes?.success) setUsers(usersRes.users); else setError(usersRes?.error || "Error cargando usuarios.");
            if (accountsRes?.success) setAccounts(accountsRes.accounts);
            if (pendingRes?.success) setPendingTransfers(pendingRes.transfers || []);
            setSystemSettings({
                cardNumber: settings?.cardNumber || '',
                qrNumber: settings?.qrNumber || '',
                clabe: settings?.clabe || '',
            });
        } catch {
            setError("Ocurrió un error inesperado al conectar con la base de datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);

    const term = searchTerm.toLowerCase();
    const filteredUsers = useMemo(() => users.filter(u => !term ||
        u.nombres?.toLowerCase().includes(term) ||
        u.apellidoPaterno?.toLowerCase().includes(term) ||
        u.correo?.toLowerCase().includes(term) ||
        u.curp?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term)), [users, term]);

    const filteredAccounts = useMemo(() => accounts.filter(acc => !term ||
        acc.nombres?.toLowerCase().includes(term) ||
        acc.apellidoPaterno?.toLowerCase().includes(term) ||
        acc.correo?.toLowerCase().includes(term)), [accounts, term]);

    const filteredTransfers = useMemo(() => pendingTransfers.filter(tx => !term ||
        tx.user?.nombres?.toLowerCase().includes(term) ||
        tx.user?.apellidoPaterno?.toLowerCase().includes(term) ||
        tx.user?.correo?.toLowerCase().includes(term) ||
        tx.destinationBank?.toLowerCase().includes(term) ||
        tx.destinationName?.toLowerCase().includes(term) ||
        tx.destinationClabe?.includes(term)), [pendingTransfers, term]);

    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
    const activeUsers = users.filter(u => u.isActive).length;

    /** Ejecuta una acción del servidor mostrando mensajes y recargando datos. */
    const perform = async (key: string, action: () => Promise<{ error?: string; success?: boolean; message?: string } | undefined>, fallback: string, after?: () => void) => {
        setBusy(key);
        setError("");
        setSuccess("");
        const res = await action();
        if (res?.success) {
            setSuccess(res.message || "Listo.");
            after?.();
            await loadData();
        } else {
            setError(res?.error || fallback);
        }
        setBusy(null);
    };

    const askFund = (userId: string, name: string, action: 'add' | 'subtract') => {
        const amt = parseFloat(fundingAmount[userId]);
        if (isNaN(amt) || amt <= 0) {
            setError("Ingresa un monto válido.");
            return;
        }
        const signed = action === 'subtract' ? -Math.abs(amt) : amt;
        setConfirm({
            title: action === 'add' ? 'Sumar saldo' : 'Restar saldo',
            label: action === 'add' ? 'Sumar' : 'Restar',
            destructive: action === 'subtract',
            message: <>Se {action === 'add' ? 'sumarán' : 'restarán'} <strong className="text-ink">${formatMoney(amt)}</strong> {action === 'add' ? 'a' : 'de'} la cuenta de <strong className="text-ink">{name}</strong>.</>,
            run: () => perform(`fund-${userId}`, () => fundAccount(userId, signed), "Ocurrió un error al intentar fondear.", () => setFundingAmount(prev => ({ ...prev, [userId]: "" }))),
        });
    };

    const askReset = (userId: string, name: string) => {
        const newPass = passwordInputs[userId];
        if (!newPass || newPass.length < 6) {
            setError("Ingresa una nueva contraseña de al menos 8 caracteres.");
            return;
        }
        setConfirm({
            title: 'Restablecer contraseña',
            label: 'Restablecer',
            message: <>Se asignará una nueva contraseña a <strong className="text-ink">{name}</strong>. La anterior dejará de funcionar.</>,
            run: () => perform(`pw-${userId}`, () => resetUserPassword(userId, newPass), "Error al restablecer contraseña.", () => setPasswordInputs(prev => ({ ...prev, [userId]: "" }))),
        });
    };

    const askDelete = (userId: string, name: string) => setConfirm({
        title: 'Eliminar usuario',
        label: 'Eliminar definitivamente',
        destructive: true,
        message: <>¿Eliminar a <strong className="text-ink">{name}</strong>? Esta acción no se puede deshacer y borrará sus cuentas y transacciones.</>,
        run: () => perform(`del-${userId}`, () => deleteUser(userId), "Ocurrió un error al eliminar el usuario."),
    });

    const askToggleStatus = (user: AdminUser) => setConfirm({
        title: user.isActive ? 'Desactivar usuario' : 'Activar usuario',
        label: user.isActive ? 'Desactivar' : 'Activar',
        destructive: user.isActive,
        message: <>{user.isActive ? 'No podrá iniciar sesión ni operar' : 'Podrá volver a iniciar sesión y operar'}: <strong className="text-ink">{user.nombres} {user.apellidoPaterno}</strong>.</>,
        run: () => perform(`toggle-${user.id}`, () => toggleUserStatus(user.id), "Ocurrió un error al cambiar estado del usuario."),
    });

    const askToggleRole = (user: AdminUser) => setConfirm({
        title: user.role === 'ADMIN' ? 'Quitar rol de administrador' : 'Hacer administrador',
        label: user.role === 'ADMIN' ? 'Quitar rol' : 'Hacer administrador',
        destructive: user.role === 'ADMIN',
        message: <>{user.role === 'ADMIN' ? 'Perderá acceso a este panel' : 'Tendrá acceso total a este panel'}: <strong className="text-ink">{user.nombres} {user.apellidoPaterno}</strong>.</>,
        run: () => perform(`role-${user.id}`, () => toggleAdminRole(user.id), "Error actualizando rol."),
    });

    const askResolve = (tx: PendingTransfer, action: 'APPROVE' | 'REJECT') => setConfirm({
        title: action === 'APPROVE' ? 'Autorizar transferencia' : 'Rechazar transferencia',
        label: action === 'APPROVE' ? 'Autorizar' : 'Rechazar y devolver fondos',
        destructive: action === 'REJECT',
        message: <>Transferencia de <strong className="text-ink">${formatMoney(tx.amount)}</strong> de {tx.user?.nombres} {tx.user?.apellidoPaterno} hacia {tx.destinationName}. {action === 'REJECT' && 'Los fondos regresarán a su cuenta.'}</>,
        run: () => perform(`${tx.id}-${action}`, () => resolveTransfer(tx.id, action), "Error al resolver la transferencia."),
    });

    const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await perform('settings', () => updateSystemSettings(systemSettings), "Error al actualizar ajustes.");
    };

    const runConfirm = async () => {
        const job = confirm;
        setConfirm(null);
        await job?.run();
    };

    const anyBusy = busy !== null;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Panel"
                title="Administración"
                description="Gestiona usuarios, saldos, aprobaciones y los datos de depósito."
                action={
                    <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> Actualizar
                    </Button>
                }
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Usuarios" value={String(users.length)} icon={Users} />
                <Stat label="Activos" value={String(activeUsers)} icon={ShieldCheck} />
                <Stat label="Saldo total" value={`$${formatMoney(totalBalance)}`} icon={Wallet} />
                <Stat label="Por aprobar" value={String(pendingTransfers.length)} icon={Clock} tone={pendingTransfers.length ? 'warning' : 'brand'} />
            </div>

            {error && <Alert onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}

            <div>
                <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Secciones de administración">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={activeTab === id}
                            onClick={() => setActiveTab(id)}
                            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === id ? 'border-brand-600 text-brand-800' : 'border-transparent text-muted hover:text-ink'}`}
                        >
                            <Icon className="h-4 w-4" aria-hidden />
                            {label}
                            {id === 'aprobaciones' && pendingTransfers.length > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-extrabold text-white">{pendingTransfers.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-5">
                    {activeTab !== 'ajustes' && (
                        <div className="relative mb-4 max-w-md">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                            <Input
                                aria-label="Buscar"
                                placeholder={activeTab === 'aprobaciones' ? "Buscar por solicitante, destino o CLABE…" : "Buscar por nombre, correo o CURP…"}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    )}

                    {loading && !users.length ? (
                        <Card><Spinner label="Cargando datos…" /></Card>
                    ) : activeTab === 'usuarios' ? (
                        <Card as="div" className="overflow-hidden">
                            {filteredUsers.length === 0 ? (
                                <EmptyState icon={<Users className="h-6 w-6" aria-hidden />} title="Sin usuarios" text={searchTerm ? "Ningún usuario coincide con la búsqueda." : "Aún no hay usuarios registrados."} />
                            ) : (
                                <ul className="divide-y divide-line">
                                    {filteredUsers.map((user) => (
                                        <li key={user.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto_auto] lg:items-center">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-extrabold text-white">
                                                    {(user.nombres || '?').charAt(0).toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-extrabold text-ink">{user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</p>
                                                    <a href={`mailto:${user.correo}`} className="block truncate text-xs font-semibold text-brand-700 hover:underline">{user.correo}</a>
                                                    <p className="truncate text-xs text-muted">{user.celular} · alta {new Date(user.createdAt).toLocaleDateString('es-MX')}</p>
                                                </div>
                                            </div>
                                            <div className="min-w-0 space-y-1.5">
                                                <p className="truncate font-mono text-xs font-semibold uppercase text-muted" title={user.curp}>{user.curp}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
                                                    <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</Badge>
                                                </div>
                                            </div>
                                            <p className="font-mono text-lg font-semibold text-ink lg:text-right">${formatMoney(user.balance)}</p>
                                            <div className="flex gap-1.5 lg:justify-end">
                                                <Button variant="ghost" size="sm" onClick={() => askToggleRole(user)} disabled={anyBusy} aria-label={user.role === 'ADMIN' ? 'Quitar rol de administrador' : 'Hacer administrador'} title={user.role === 'ADMIN' ? 'Quitar rol de administrador' : 'Hacer administrador'}>
                                                    <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => askToggleStatus(user)} disabled={anyBusy} aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'} title={user.isActive ? 'Desactivar' : 'Activar'}>
                                                    {user.isActive ? <Lock className="h-[18px] w-[18px]" aria-hidden /> : <Unlock className="h-[18px] w-[18px]" aria-hidden />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => askDelete(user.id, `${user.nombres} ${user.apellidoPaterno}`)} disabled={anyBusy} aria-label="Eliminar usuario" title="Eliminar" className="hover:!bg-danger-soft hover:!text-danger">
                                                    <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    ) : activeTab === 'fondos' ? (
                        <Card as="div" className="overflow-hidden">
                            {filteredAccounts.length === 0 ? (
                                <EmptyState icon={<Wallet className="h-6 w-6" aria-hidden />} title="Sin cuentas" text="Aún no hay usuarios." />
                            ) : (
                                <ul className="divide-y divide-line">
                                    {filteredAccounts.map((acc) => {
                                        const name = `${acc.nombres} ${acc.apellidoPaterno}`;
                                        return (
                                            <li key={acc.userId} className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1.4fr)] xl:items-center">
                                                <div className="flex items-center justify-between gap-3 xl:block">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-extrabold text-ink">{name}</p>
                                                        <p className="truncate text-xs text-muted">{acc.correo}</p>
                                                    </div>
                                                    <p className="font-mono text-lg font-semibold text-brand-800 xl:mt-1">${formatMoney(acc.balance)}</p>
                                                </div>

                                                <div>
                                                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Ajustar saldo</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="relative w-32">
                                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">$</span>
                                                            <Input
                                                                type="number"
                                                                aria-label={`Monto para ${name}`}
                                                                placeholder="0.00"
                                                                value={fundingAmount[acc.userId] || ""}
                                                                onChange={(e) => setFundingAmount(prev => ({ ...prev, [acc.userId]: e.target.value }))}
                                                                className="!h-9 pl-7 font-mono"
                                                                min="1"
                                                                step="any"
                                                            />
                                                        </div>
                                                        <Button size="sm" onClick={() => askFund(acc.userId, name, 'add')} disabled={anyBusy || !fundingAmount[acc.userId]} loading={busy === `fund-${acc.userId}`}>
                                                            <PlusCircle className="h-4 w-4" aria-hidden /> Sumar
                                                        </Button>
                                                        <Button size="sm" variant="secondary" onClick={() => askFund(acc.userId, name, 'subtract')} disabled={anyBusy || !fundingAmount[acc.userId]}>
                                                            <MinusCircle className="h-4 w-4" aria-hidden /> Restar
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Restablecer contraseña</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative min-w-0 flex-1">
                                                            <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                                                            <Input
                                                                type="text"
                                                                aria-label={`Nueva contraseña para ${name}`}
                                                                placeholder="Nueva contraseña"
                                                                autoComplete="off"
                                                                value={passwordInputs[acc.userId] || ""}
                                                                onChange={(e) => setPasswordInputs(prev => ({ ...prev, [acc.userId]: e.target.value }))}
                                                                className="!h-9 pl-9 text-sm"
                                                            />
                                                        </div>
                                                        <Button size="sm" variant="soft" onClick={() => askReset(acc.userId, name)} disabled={anyBusy || !passwordInputs[acc.userId]} loading={busy === `pw-${acc.userId}`}>
                                                            Aplicar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Card>
                    ) : activeTab === 'aprobaciones' ? (
                        <Card as="div" className="overflow-hidden">
                            {filteredTransfers.length === 0 ? (
                                <EmptyState icon={<CheckCircle2 className="h-6 w-6" aria-hidden />} title="Todo al día" text="No hay transferencias pendientes por aprobar." />
                            ) : (
                                <ul className="divide-y divide-line">
                                    {filteredTransfers.map((tx) => (
                                        <li key={tx.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_auto_auto] lg:items-center">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-extrabold text-ink">{tx.user?.nombres} {tx.user?.apellidoPaterno}</p>
                                                <p className="truncate text-xs text-muted">{tx.user?.correo}</p>
                                                <p className="text-xs text-muted">{formatDateTime(tx.createdAt)}</p>
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <p className="truncate text-sm font-bold uppercase text-ink">{tx.destinationBank}</p>
                                                <p className="truncate text-xs text-muted">{tx.destinationName}</p>
                                                <p className="w-fit rounded bg-surface-muted px-2 py-0.5 font-mono text-xs text-muted">CLABE {tx.destinationClabe}</p>
                                                {tx.description && <p className="truncate text-xs italic text-muted">“{tx.description}”</p>}
                                            </div>
                                            <p className="font-mono text-xl font-semibold text-warning lg:text-right">${formatMoney(tx.amount)}</p>
                                            <div className="flex gap-2 lg:flex-col">
                                                <Button size="sm" onClick={() => askResolve(tx, 'APPROVE')} disabled={anyBusy} loading={busy === `${tx.id}-APPROVE`} className="flex-1">
                                                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Autorizar
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => askResolve(tx, 'REJECT')} disabled={anyBusy} loading={busy === `${tx.id}-REJECT`} className="flex-1">
                                                    <X className="h-4 w-4" aria-hidden /> Rechazar
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    ) : (
                        <Card className="max-w-2xl p-6 sm:p-8">
                            <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                                <SettingsIcon className="h-5 w-5 text-brand-600" aria-hidden />
                                Datos de depósito y tarjeta
                            </h2>
                            <p className="mt-1 text-sm text-muted">Estos datos se muestran a los usuarios. Alfa bank no incluye valores por defecto: captura los tuyos.</p>
                            <form onSubmit={handleUpdateSettings} className="mt-6 flex flex-col gap-5">
                                <Field label="Número de tarjeta virtual" htmlFor="cardNumber" hint="Se muestra en el panel de los usuarios">
                                    <Input id="cardNumber" type="text" inputMode="numeric" value={systemSettings.cardNumber} onChange={e => setSystemSettings(prev => ({ ...prev, cardNumber: e.target.value }))} placeholder="16 dígitos" className="font-mono" />
                                </Field>
                                <Field label="Referencia de depósito en efectivo" htmlFor="qrNumber" hint="Aparece junto al código QR">
                                    <Input id="qrNumber" type="text" value={systemSettings.qrNumber} onChange={e => setSystemSettings(prev => ({ ...prev, qrNumber: e.target.value }))} placeholder="Número de referencia" className="font-mono" />
                                </Field>
                                <Field label="CLABE interbancaria de depósito" htmlFor="clabe" hint="Pantalla Depositar → Transferencia">
                                    <Input id="clabe" type="text" inputMode="numeric" value={systemSettings.clabe} onChange={e => setSystemSettings(prev => ({ ...prev, clabe: e.target.value }))} placeholder="18 dígitos" className="font-mono" />
                                </Field>
                                <Button type="submit" className="self-start" loading={busy === 'settings'} disabled={anyBusy}>
                                    {busy !== 'settings' && <Save className="h-4 w-4" aria-hidden />}
                                    Guardar ajustes
                                </Button>
                            </form>
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title ?? ''}
                message={confirm?.message}
                confirmLabel={confirm?.label}
                destructive={confirm?.destructive}
                onConfirm={runConfirm}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
}
