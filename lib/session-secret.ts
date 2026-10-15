/** Clave para firmar la sesión (JWT). En producción JWT_SECRET es obligatorio. */
export function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está definido. Configúralo antes de ejecutar en producción.");
  }
  return new TextEncoder().encode(secret || "dev_only_alfa_bank_secret_change_me");
}
