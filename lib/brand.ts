/**
 * Identidad y configuración central de Alfa bank.
 * Cambia aquí el nombre, textos de marca y datos de contacto; los colores,
 * fondos, bordes, sombras y tipografías viven en app/globals.css (@theme).
 */

const supportWhatsapp = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");

const supportMessage = "Hola, necesito soporte.";

export const brand = {
  name: "Alfa bank",
  /** Partes del logotipo tipográfico: "Alfa" en peso fuerte, "bank" en peso ligero. */
  wordmark: { strong: "Alfa", light: "bank" },
  tagline: "Tu cuenta, clara y a la mano.",
  description:
    "Alfa bank es una maqueta interactiva de plataforma financiera: registra usuarios, simula depósitos, transferencias y retiros con operaciones ficticias.",
  demoNotice: "Entorno de demostración · Todas las operaciones son simuladas y no mueven dinero real.",
  currency: "MXN",
  /** Datos ficticios mostrados en la tarjeta virtual de demostración. */
  card: { expiry: "12/28", cvv: "222" },
  support: {
    /** Se define con NEXT_PUBLIC_SUPPORT_WHATSAPP (solo dígitos con lada de país). Si está vacío, el acceso a soporte no se muestra. */
    whatsapp: supportWhatsapp,
    message: supportMessage,
    whatsappUrl: supportWhatsapp
      ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(supportMessage)}`
      : "",
  },
} as const;

export type NavItem = { href: string; label: string; icon: "home" | "send" | "deposit" | "withdraw" | "profile" | "admin" };

export const userNav: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: "home" },
  { href: "/transfer", label: "Transferir", icon: "send" },
  { href: "/deposit", label: "Depositar", icon: "deposit" },
  { href: "/withdraw", label: "Retirar", icon: "withdraw" },
  { href: "/profile", label: "Mi perfil", icon: "profile" },
];

export const adminNav: NavItem = { href: "/admin", label: "Administración", icon: "admin" };

/** Rutas que usan el entorno privado (barra lateral). */
export const privatePrefixes = ["/dashboard", "/transfer", "/deposit", "/withdraw", "/profile", "/admin"];
