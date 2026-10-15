"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Pencil, Save } from 'lucide-react';
import { updateUserProfile } from '@/app/actions/user';
import { Alert, Button, Card, CardHeader, Field, Input, PageHeader, Textarea } from '@/components/ui/kit';

interface UserProfile {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    curp: string;
    fechaNacimiento: Date;
    celular: string;
    direccion: string;
    correo: string;
}

export default function ProfileView({ userProfile }: { userProfile: UserProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.currentTarget);

        try {
            const result = await updateUserProfile(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setSuccess(result.message || 'Perfil actualizado');
                setIsEditing(false);
                router.refresh();
            }
        } catch {
            setError('Ocurrió un error inesperado. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const cancel = () => {
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Consulta y actualiza tu información personal." />

            {success && <Alert tone="success" onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert onClose={() => setError('')}>{error}</Alert>}

            <Card>
                <CardHeader
                    title="Datos personales"
                    subtitle="La CURP y el correo no se pueden modificar"
                    action={
                        isEditing ? (
                            <Button variant="secondary" size="sm" type="button" onClick={cancel}>Cancelar</Button>
                        ) : (
                            <Button variant="soft" size="sm" type="button" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                            </Button>
                        )
                    }
                />

                <form onSubmit={handleUpdateProfile} className="space-y-6 p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="Nombres" htmlFor="p-nombres">
                            <Input id="p-nombres" name="nombres" defaultValue={userProfile.nombres} disabled={!isEditing} required />
                        </Field>
                        <Field label="Fecha de nacimiento" htmlFor="p-fecha">
                            <Input id="p-fecha" name="fechaNacimiento" type="date" defaultValue={new Date(userProfile.fechaNacimiento).toISOString().split('T')[0]} disabled={!isEditing} required />
                        </Field>
                        <Field label="Apellido paterno" htmlFor="p-ap">
                            <Input id="p-ap" name="apellidoPaterno" defaultValue={userProfile.apellidoPaterno} disabled={!isEditing} required />
                        </Field>
                        <Field label="Apellido materno" htmlFor="p-am">
                            <Input id="p-am" name="apellidoMaterno" defaultValue={userProfile.apellidoMaterno} disabled={!isEditing} required />
                        </Field>
                        <Field label="CURP" hint="No modificable" htmlFor="p-curp">
                            <Input id="p-curp" defaultValue={userProfile.curp} disabled className="font-mono uppercase" />
                        </Field>
                        <Field label="Correo electrónico" hint="No modificable" htmlFor="p-correo">
                            <Input id="p-correo" defaultValue={userProfile.correo} disabled />
                        </Field>
                        <Field label="Número celular" htmlFor="p-cel" className="sm:col-span-2">
                            <Input id="p-cel" name="celular" type="tel" maxLength={10} defaultValue={userProfile.celular} disabled={!isEditing} required />
                        </Field>
                        <Field label="Dirección completa" htmlFor="p-dir" className="sm:col-span-2">
                            <Textarea id="p-dir" name="direccion" defaultValue={userProfile.direccion} disabled={!isEditing} rows={3} required />
                        </Field>
                    </div>

                    {isEditing && (
                        <>
                            <div className="border-t border-line pt-5">
                                <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
                                    <Lock className="h-4 w-4 text-brand-600" aria-hidden />
                                    Cambiar contraseña <span className="text-xs font-medium text-muted">(opcional)</span>
                                </h3>
                                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Nueva contraseña" htmlFor="p-new">
                                        <Input id="p-new" name="nuevaContrasena" type="password" placeholder="Déjala vacía para conservar la actual" autoComplete="new-password" />
                                    </Field>
                                    <Field label="Confirmar nueva contraseña" htmlFor="p-conf">
                                        <Input id="p-conf" name="confirmarContrasena" type="password" placeholder="Repite la nueva contraseña" autoComplete="new-password" />
                                    </Field>
                                </div>
                            </div>
                            <div className="flex justify-end border-t border-line pt-5">
                                <Button type="submit" loading={loading}>
                                    {!loading && <Save className="h-4 w-4" aria-hidden />}
                                    {loading ? 'Guardando…' : 'Guardar cambios'}
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </Card>
        </div>
    );
}
