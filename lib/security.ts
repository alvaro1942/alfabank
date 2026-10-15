/** Reglas de seguridad compartidas por las acciones del servidor. */

export const MIN_PASSWORD_LENGTH = 8;

/** Tipos y tamaño permitidos para la identificación subida en el registro. */
export const ID_FILE_MAX_BYTES = 4 * 1024 * 1024;
export const ID_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Bloqueo temporal de la cuenta tras demasiados intentos de acceso fallidos. */
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
