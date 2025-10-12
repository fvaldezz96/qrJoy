export class HttpError extends Error { constructor(public status: number, message: string, public code?: string){ super(message); }}
export const NotFound = (msg = 'Not Found') => new HttpError(404, msg, 'NOT_FOUND');
export const BadRequest = (msg = 'Bad Request') => new HttpError(400, msg, 'BAD_REQUEST');
export const Unauthorized = (msg = 'Unauthorized') => new HttpError(401, msg, 'UNAUTHORIZED');
export const Forbidden = (msg = 'Forbidden') => new HttpError(403, msg, 'FORBIDDEN');