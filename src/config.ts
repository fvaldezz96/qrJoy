export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ||
  '';

export const APP_NAME = 'JoyPark';
export const APP_VERSION = '1.0.0';

const join = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
    .join('/');

export const withQuery = (url: string, params?: Record<string, any>) => {
  if (!params) return url;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
};

export const ENDPOINTS = {
  auth: {
    login: join(API_BASE_URL, '/auth/login'),
    register: join(API_BASE_URL, '/auth/register'),
    me: join(API_BASE_URL, '/auth/me'),
  },

  users: {
    base: join(API_BASE_URL, '/users'),
    all: join(API_BASE_URL, '/users'),
  },

  products: {
    base: join(API_BASE_URL, '/products'),
    byId: (id: string) => join(API_BASE_URL, `/products/${id}`),
    create: join(API_BASE_URL, '/products/create'),
    update: (id: string) => join(API_BASE_URL, `/products/${id}`),
    patch: (id: string) => join(API_BASE_URL, `/products/${id}`),
    softDelete: (id: string) => join(API_BASE_URL, `/products/${id}`),
    restore: (id: string) => join(API_BASE_URL, `/products/${id}/restore`),
    hardDelete: (id: string) => join(API_BASE_URL, `/products/${id}`),
  },

  stock: {
    base: join(API_BASE_URL, '/stock'),
    adjust: (productId: string) => join(API_BASE_URL, `/stock/${productId}`),
  },

  orders: {
    base: join(API_BASE_URL, '/orders'),
    create: join(API_BASE_URL, '/orders/create'),
    byId: (id: string) => join(API_BASE_URL, `/orders/${id}`),
    close: (id: string) => join(API_BASE_URL, `/orders/${id}/close`),
  },

  tickets: {
    base: join(API_BASE_URL, '/tickets'),
    me: join(API_BASE_URL, '/tickets/me'),
    payMock: (id: string) => join(API_BASE_URL, `/tickets/${id}/pay-mock`),
    closeOrderAndEmitReceipt: (orderId: string) => join(API_BASE_URL, `/tickets/${orderId}/close`),
  },

  entranceTickets: {
    base: join(API_BASE_URL, '/entrance-tickets'),
    purchase: join(API_BASE_URL, '/entrance-tickets/purchase'),
    myTickets: join(API_BASE_URL, '/entrance-tickets/my-tickets'),
    detail: (ticketId: string) => join(API_BASE_URL, `/entrance-tickets/${ticketId}`),
  },

  qr: {
    base: join(API_BASE_URL, '/qr'),
    info: (qrIdOrCode: string) => join(API_BASE_URL, `/qr/${qrIdOrCode}`),
    byUser: (userId: string) => join(API_BASE_URL, `/qr/user/${userId}`),
  },

  scan: {
    scan: join(API_BASE_URL, '/scan/scan'),
    info: (code: string) => join(API_BASE_URL, `/scan/info/${code}`),
  },

  tables: {
    base: join(API_BASE_URL, '/tables'),
    create: join(API_BASE_URL, '/tables/create'),
    byId: (id: string) => join(API_BASE_URL, `/tables/${id}`),
  },

  comandas: {
    base: join(API_BASE_URL, '/comandas'),
  },
} as const;
