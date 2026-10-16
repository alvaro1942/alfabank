# Alfa bank

Plataforma financiera: registro de usuarios, depósitos, transferencias y retiros, con panel de administración.

Construido con Next.js 16 (App Router), React 19, Tailwind CSS 4, Prisma 7 y PostgreSQL (Neon).

## Requisitos

- Node.js 20 o superior
- Una base de datos PostgreSQL **propia** de este proyecto (por ejemplo en [Neon](https://neon.tech))

## Puesta en marcha

```bash
npm install
cp .env.example .env.local      # completa los valores (ver abajo)
npx prisma db push              # crea las tablas en la base
npm run create-admin            # crea el primer administrador
npm run dev                     # http://localhost:3000
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL. |
| `JWT_SECRET` | Sí en producción | Clave para firmar sesiones. Genera una con `openssl rand -base64 48`. |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob (store **privado**) para guardar la identificación del registro. Sin él, la cuenta se crea pero sin archivo. |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Número de soporte (solo dígitos con lada). Si está vacío, no aparece el botón de soporte. |
| `ALLOWED_ORIGINS` | No | Dominios extra para Server Actions, separados por coma. Normalmente no hace falta. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Solo local | Las usa únicamente `npm run create-admin`. No las subas al hosting. |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` / `npm start` | Build y arranque en producción. |
| `npm run lint` | ESLint. |
| `npm run create-admin` | Crea (o promueve) el administrador definido en `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |
| `node change-role.mjs correo@ejemplo.com` | Convierte a un usuario existente en administrador. |

## Estructura

- `app/` rutas y Server Actions (`app/actions/`: auth, user, admin, settings).
- `views/` pantallas de cada ruta (componentes de cliente).
- `components/` interfaz compartida; `components/ui/kit.tsx` es el kit de UI.
- `lib/brand.ts` nombre, textos y navegación; los colores y tipografías están en `app/globals.css`.
- `lib/security.ts` reglas de contraseña, archivos y bloqueo de login.
- `proxy.ts` protege las rutas privadas.
- `prisma/schema.prisma` modelo de datos (User, Account, Transaction, SystemSetting).

## Seguridad

- Contraseñas con bcrypt, mínimo 8 caracteres.
- Sesión en cookie `httpOnly` (JWT, 24 h). En cada petición se revisa en la base que la cuenta siga activa y se toma el rol de ahí.
- Bloqueo de 15 minutos tras 5 intentos de login fallidos.
- Identificación: solo JPG, PNG, WEBP o PDF, máximo 4 MB, en un store privado.

## Despliegue en Vercel

1. Define `DATABASE_URL` y `JWT_SECRET` (Production y Preview).
2. Opcional: crea un Blob store **privado** y conéctalo al proyecto con el token de lectura/escritura.
3. Despliega. Si cambias el esquema de Prisma, ejecuta `npx prisma db push` contra la base antes de desplegar.
