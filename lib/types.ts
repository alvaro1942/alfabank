import type { getAllUsers, getAllAccountsTransactions, getPendingTransfers } from "@/app/actions/admin";
import type { getUserTransactions } from "@/app/actions/user";

/** Extrae el elemento de la lista `K` de la respuesta exitosa de una acción del servidor. */
type Item<T, K extends string> = Extract<Awaited<T>, Record<K, unknown>>[K] extends readonly (infer U)[] ? U : never;

/** Datos de depósito configurables por el administrador. */
export type SystemSettings = { cardNumber: string; qrNumber: string; clabe: string };

/** Forma de los datos serializados que devuelven las acciones del servidor. */
export type AdminUser = Item<ReturnType<typeof getAllUsers>, "users">;
export type AdminAccount = Item<ReturnType<typeof getAllAccountsTransactions>, "accounts">;
export type PendingTransfer = Item<ReturnType<typeof getPendingTransfers>, "transfers">;
export type UserTransaction = Item<ReturnType<typeof getUserTransactions>, "transactions">;
