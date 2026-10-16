"use client";

import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import AuthLayout from '@/components/layout/AuthLayout';
import { Alert, Button, Field, Input, Textarea } from '@/components/ui/kit';

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <fieldset className="flex flex-col gap-4 border-t border-line pt-5 first:border-0 first:pt-0">
            <legend className="mb-1 flex items-center gap-2.5 text-sm font-extrabold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-800">{n}</span>
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

export default function RegisterView() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ message: string; field?: string } | null>(null);
    const [success, setSuccess] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        const formData = new FormData(e.currentTarget);

        try {
            const result = await registerUser(formData);

            if (result?.error) {
                setError({ message: result.error, field: result?.field });
            } else if (result?.success) {
                setSuccess(result.message || 'Cuenta creada exitosamente.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            }
        } catch {
            setError({ message: 'Ocurrió un error inesperado al enviar los datos. Intenta de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate file size strictly (4MB limit for serverless constraint)
            if (file.size > 4 * 1024 * 1024) {
                setError({ message: 'El archivo es demasiado pesado. El máximo permitido es 4MB.', field: 'ineFile' });
                e.target.value = ''; // Reset input
                setFileName(null);
                return;
            }

            // Clear any previous file errors
            if (error?.field === 'ineFile') setError(null);
            setFileName(file.name);
        } else {
            setFileName(null);
        }
    };

    const fieldError = (name: string) => (error?.field === name ? error.message : undefined);

    return (
        <AuthLayout
            wide
            title="Abre tu cuenta."
            subtitle="Completa tus datos para crear tu usuario y comenzar a operar."
            points={['Registro en un solo formulario', 'Consulta tu saldo y movimientos', 'Depósitos, transferencias y retiros']}
        >
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">Crear cuenta</h1>
                <p className="mt-1 text-sm text-muted">Los campos marcados con * son obligatorios.</p>

                {error && !error.field && (
                    <div className="mt-5">
                        <Alert>{error.message}</Alert>
                    </div>
                )}
                {success && (
                    <div className="mt-5">
                        <Alert tone="success">{success} Redirigiendo…</Alert>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
                    <Section n={1} title="Datos personales">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Nombres" htmlFor="nombres" required>
                                <Input id="nombres" name="nombres" placeholder="Tus nombres" required autoComplete="given-name" />
                            </Field>
                            <Field label="Apellido paterno" htmlFor="apellidoPaterno" required>
                                <Input id="apellidoPaterno" name="apellidoPaterno" placeholder="Primer apellido" required autoComplete="family-name" />
                            </Field>
                            <Field label="Apellido materno" htmlFor="apellidoMaterno" required>
                                <Input id="apellidoMaterno" name="apellidoMaterno" placeholder="Segundo apellido" required />
                            </Field>
                        </div>
                        <Field label="Fecha de nacimiento" htmlFor="fechaNacimiento" required>
                            <Input id="fechaNacimiento" name="fechaNacimiento" type="date" required autoComplete="bday" />
                        </Field>
                        <Field label="CURP" htmlFor="curp" required error={fieldError('curp')}>
                            <Input id="curp" name="curp" placeholder="18 caracteres" maxLength={18} required invalid={!!fieldError('curp')} className="font-mono uppercase" />
                        </Field>
                    </Section>

                    <Section n={2} title="Contacto">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Correo electrónico" htmlFor="correo" required error={fieldError('correo')}>
                                <Input id="correo" name="correo" type="email" placeholder="tucorreo@ejemplo.com" required invalid={!!fieldError('correo')} autoComplete="email" />
                            </Field>
                            <Field label="Confirmar correo" htmlFor="confirmarCorreo" required error={fieldError('confirmarCorreo')}>
                                <Input id="confirmarCorreo" name="confirmarCorreo" type="email" placeholder="Repite tu correo" required invalid={!!fieldError('confirmarCorreo')} />
                            </Field>
                        </div>
                        <Field label="Número celular" htmlFor="celular" required>
                            <Input id="celular" name="celular" type="tel" inputMode="numeric" placeholder="10 dígitos" maxLength={10} required autoComplete="tel" />
                        </Field>
                        <Field label="Dirección completa" htmlFor="direccion" required>
                            <Textarea id="direccion" name="direccion" placeholder="Calle, número, colonia, ciudad, estado, C.P." required />
                        </Field>
                    </Section>

                    <Section n={3} title="Acceso">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Contraseña" htmlFor="password" required>
                                <div className="relative">
                                    <Input id="password" name="password" className="pr-11" placeholder="Crea una contraseña" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>
                            <Field label="Confirmar contraseña" htmlFor="confirmarPassword" required error={fieldError('confirmarPassword')}>
                                <div className="relative">
                                    <Input id="confirmarPassword" name="confirmarPassword" className="pr-11" placeholder="Repite la contraseña" type={showConfirmPassword ? 'text' : 'password'} required invalid={!!fieldError('confirmarPassword')} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink">
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>
                        </div>
                    </Section>

                    <Section n={4} title="Identificación oficial (INE) *">
                        <label className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line-strong bg-canvas text-center transition-colors hover:border-brand-500 hover:bg-brand-50 focus-within:border-brand-500">
                            {fileName ? (
                                <>
                                    <CheckCircle2 className="mb-2 h-7 w-7 text-success" aria-hidden />
                                    <p className="max-w-[90%] truncate text-sm font-bold text-ink">{fileName}</p>
                                    <p className="text-xs text-muted">Haz clic para cambiar el archivo</p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mb-2 h-7 w-7 text-muted group-hover:text-brand-600" aria-hidden />
                                    <p className="text-sm text-muted"><span className="font-bold text-brand-700">Sube un archivo</span> o arrástralo aquí</p>
                                    <p className="text-xs text-muted">JPG, PNG o PDF · máximo 4 MB</p>
                                </>
                            )}
                            <input name="ineFile" type="file" required aria-label="Identificación oficial" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
                        </label>
                        {fieldError('ineFile') && <p className="text-xs font-semibold text-danger">{fieldError('ineFile')}</p>}
                    </Section>

                    <Button type="submit" size="lg" full loading={loading}>
                        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    ¿Ya tienes una cuenta?{' '}
                    <Link className="font-extrabold text-brand-700 hover:underline" href="/login">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
