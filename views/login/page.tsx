"use client";

import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, getSession } from '@/app/actions/auth';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
import { Alert, Button, Field, Input } from '@/components/ui/kit';

export default function LoginView() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { setUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        try {
            const result = await loginUser(formData);

            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                // Fetch the new session and update context
                const session = await getSession();
                if (session) {
                    setUser(session as any);
                    router.push('/dashboard');
                } else {
                    setError('Error al iniciar sesión.');
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Bienvenido de nuevo."
            subtitle="Entra a tu cuenta para consultar tu saldo, revisar movimientos y simular operaciones."
            points={['Saldo y movimientos en una sola vista', 'Depósitos, transferencias y retiros simulados', 'Tarjeta virtual de demostración']}
        >
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">Iniciar sesión</h1>
                <p className="mt-1 text-sm text-muted">Ingresa tus credenciales para continuar.</p>

                {error && (
                    <div className="mt-5">
                        <Alert>{error}</Alert>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <Field label="Correo electrónico" htmlFor="correo">
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                            <Input id="correo" name="correo" required autoComplete="username" className="pl-10" placeholder="tucorreo@ejemplo.com" type="text" />
                        </div>
                    </Field>

                    <Field label="Contraseña" htmlFor="password">
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                            <Input id="password" name="password" required autoComplete="current-password" className="pl-10 pr-11" placeholder="Tu contraseña" type={showPassword ? 'text' : 'password'} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted">¿Olvidaste tu contraseña? Solicita a un administrador que la restablezca.</p>
                    </Field>

                    <Button type="submit" size="lg" full loading={loading} className="mt-2">
                        {loading ? 'Ingresando…' : 'Ingresar'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    ¿Aún no tienes cuenta?{' '}
                    <Link className="font-extrabold text-brand-700 hover:underline" href="/register">
                        Crear cuenta
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
