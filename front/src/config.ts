// src/config.ts

// Cambiá esta URL por la del backend real o de tu entorno local.
// Si corrés el backend en tu máquina, usá tu IP local de red (no localhost).
// Ejemplo: 192.168.0.105 es tu IP LAN en la red local.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.105:4000';

// Si querés agregar otras constantes globales, las podés definir acá:
export const APP_NAME = 'JoyPark';
export const APP_VERSION = '1.0.0';

// Ejemplo: rutas de API reutilizables
export const ENDPOINTS = {
  products: `${API_BASE_URL}/api/products`,
  orders: `${API_BASE_URL}/api/orders`,
  tickets: `${API_BASE_URL}/api/tickets`,
  qr: `${API_BASE_URL}/api/qr`,
};
