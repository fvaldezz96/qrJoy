// src/core/http.ts

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

/**
 * Úsalo con res.status(XXX).json(fail(...))
 * @param message  Mensaje de error para el cliente
 * @param code     Código de negocio (BAD_REQUEST, NOT_FOUND, etc.)
 */
export function fail(message: string, code = 'BAD_REQUEST'): ApiFail {
  return { ok: false, error: { code, message } };
}

// Helpers opcionales (si querés diferenciarlos semánticamente)
export const created = ok;
export const paginated = ok;
