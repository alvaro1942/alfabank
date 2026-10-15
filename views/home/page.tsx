import Link from 'next/link';
import {
    ArrowDownToLine,
    ArrowRight,
    ArrowUpFromLine,
    CreditCard,
    Send,
    ShieldCheck,
    UserPlus,
    Wallet,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { LinkButton } from '@/components/ui/kit';
import { brand } from '@/lib/brand';

const features = [
    { icon: ArrowDownToLine, title: 'Depositar', text: 'Consulta las instrucciones de depósito y la referencia configurada por el administrador.' },
    { icon: Send, title: 'Transferir', text: 'Solicita una transferencia; queda pendiente hasta que un administrador la autorice o rechace.' },
    { icon: ArrowUpFromLine, title: 'Retirar', text: 'Genera claves de retiro de demostración a partir de tu saldo disponible.' },
    { icon: CreditCard, title: 'Tarjeta virtual', text: 'Visualiza tu tarjeta de demostración con los datos que configure la plataforma.' },
];

const steps = [
    { n: '01', title: 'Crea tu usuario', text: 'Regístrate con tus datos y accede con tu correo y contraseña.' },
    { n: '02', title: 'Recibe saldo de prueba', text: 'Un administrador abona o descuenta saldo ficticio en tu cuenta.' },
    { n: '03', title: 'Simula operaciones', text: 'Transfiere, deposita y retira; revisa cada movimiento en tu historial.' },
];

const sampleRows = [
    { label: 'Depósito', date: 'Ejemplo', amount: '+$2,500.00', tone: 'text-success' },
    { label: 'Transferencia', date: 'Ejemplo · Pendiente', amount: '-$480.00', tone: 'text-warning' },
    { label: 'Retiro', date: 'Ejemplo', amount: '-$200.00', tone: 'text-ink' },
];

export default function HomeView() {
    return (
        <div className="flex min-h-dvh flex-col bg-canvas">
            <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
                    <Link href="/" aria-label={`${brand.name} — inicio`}>
                        <Logo />
                    </Link>
                    <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm font-bold text-muted md:flex">
                        <a href="#funciones" className="hover:text-brand-700">Funciones</a>
                        <a href="#como-funciona" className="hover:text-brand-700">Cómo funciona</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <LinkButton href="/login" variant="ghost" size="sm">Ingresar</LinkButton>
                        <LinkButton href="/register" size="sm">Crear cuenta</LinkButton>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Portada */}
                <section className="relative overflow-hidden border-b border-line bg-surface">
                    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-brand-50 lg:block" aria-hidden />
                    <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-800 lg:bg-brand-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                Maqueta interactiva
                            </span>
                            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
                                Tu dinero, <span className="text-brand-600">claro como el agua.</span>
                            </h1>
                            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
                                Explora {brand.name}: una plataforma para ver tu saldo, mover fondos y administrar usuarios, con operaciones 100&nbsp;% simuladas.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <LinkButton href="/register" size="lg">
                                    Crear mi cuenta <ArrowRight className="h-5 w-5" aria-hidden />
                                </LinkButton>
                                <LinkButton href="/login" variant="secondary" size="lg">Ya tengo cuenta</LinkButton>
                            </div>
                            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
                                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
                                {brand.demoNotice}
                            </p>
                        </div>

                        {/* Vista de ejemplo (plana, sin tarjetas flotantes) */}
                        <div className="mx-auto w-full max-w-md" aria-label="Vista de ejemplo de la cuenta">
                            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-pop">
                                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                                    <span className="text-sm font-extrabold text-ink">Mi cuenta</span>
                                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold text-muted">Vista de ejemplo</span>
                                </div>
                                <div className="px-6 pb-5 pt-6">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted">Saldo disponible</p>
                                    <p className="mt-1 text-4xl font-extrabold tracking-tight text-brand-800">$1,820.00</p>
                                    <div className="mt-5 flex h-16 items-end gap-1.5" aria-hidden>
                                        {[28, 40, 34, 52, 46, 64, 58, 76, 70, 88].map((h, i) => (
                                            <span key={i} className={`flex-1 rounded-t-md ${i === 9 ? 'bg-brand-500' : 'bg-brand-100'}`} style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                                <ul className="divide-y divide-line border-t border-line">
                                    {sampleRows.map((r) => (
                                        <li key={r.label} className="flex items-center justify-between px-6 py-3.5">
                                            <div>
                                                <p className="text-sm font-bold text-ink">{r.label}</p>
                                                <p className="text-xs text-muted">{r.date}</p>
                                            </div>
                                            <span className={`font-mono text-sm font-semibold ${r.tone}`}>{r.amount}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Funciones */}
                <section id="funciones" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:py-20">
                    <div className="max-w-xl">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-600">Qué puedes hacer</p>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Todo el recorrido de una cuenta, en un solo lugar</h2>
                    </div>
                    <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ icon: Icon, title, text }) => (
                            <article key={title} className="bg-surface p-6">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <h3 className="mt-4 text-base font-extrabold text-ink">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Cómo funciona */}
                <section id="como-funciona" className="scroll-mt-20 border-y border-line bg-surface">
                    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-600">Cómo funciona</p>
                        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-ink">Tres pasos para probar la plataforma</h2>
                        <ol className="mt-10 grid gap-6 md:grid-cols-3">
                            {steps.map((s) => (
                                <li key={s.n} className="relative rounded-2xl bg-canvas p-6">
                                    <span className="font-mono text-sm font-semibold text-brand-600">{s.n}</span>
                                    <h3 className="mt-3 text-lg font-extrabold text-ink">{s.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Llamado final */}
                <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
                    <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-800 p-8 text-white sm:p-12 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Empieza a explorar {brand.name}</h2>
                            <p className="mt-2 max-w-md text-brand-100">Crea un usuario de demostración y recorre cada pantalla.</p>
                        </div>
                        <Link href="/register" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-brand-800 transition-colors hover:bg-brand-50">
                            <UserPlus className="h-4 w-4" aria-hidden />
                            Crear cuenta
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-line bg-surface">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <Logo size={28} />
                    <p className="flex items-center gap-2 text-xs text-muted">
                        <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {brand.demoNotice}
                    </p>
                </div>
            </footer>
        </div>
    );
}
