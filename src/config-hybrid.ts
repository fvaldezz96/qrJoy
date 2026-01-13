// 🌐 CONFIGURACIÓN HÍBRIDA QR FRONT
// Sistema que funciona offline y se sincroniza cuando hay conexión

import Constants from 'expo-constants';

import { Platform } from 'react-native';

// 🏠 IP LOCAL DE TU PC (para desarrollo/offline)
// Web = localhost, Android Emulator = 10.0.2.2
const LOCAL_PC_IP = Platform.OS === 'web' ? 'localhost' : '10.0.2.2';
const LOCAL_PORT = '3002';

// 🌐 URLs de Producción en Railway
const PRODUCTION_API_URL = 'http://localhost:3001';
const PRODUCTION_KEYCLOAK_URL = 'https://kcloud-keycloak-production.up.railway.app';

// 🔍 Detectar ambiente y conexión
const isDev = Constants.expoConfig?.extra?.EAS_ENV === 'development';
const isProduction = Constants.expoConfig?.extra?.EAS_ENV === 'production';

// 📱 Obtener IP local del dispositivo (para red local)
const getLocalNetworkIP = () => {
  // En desarrollo, usar IP de tu PC
  if (isDev) {
    return `http://${LOCAL_PC_IP}:${LOCAL_PORT}`;
  }
  return null;
};

// 🌐 Determinar URLs según disponibilidad
const getApiUrls = () => {
  const localUrl = getLocalNetworkIP();

  if (isProduction) {
    // Siempre producción en deploy
    return {
      apiUrl: PRODUCTION_API_URL,
      environment: 'production',
      source: 'railway'
    };
  }

  // En desarrollo: intentar local primero, fallback a producción
  if (localUrl) {
    return {
      apiUrl: localUrl,
      environment: 'local',
      source: 'local_network'
    };
  }

  // Fallback a producción si no hay local
  return {
    apiUrl: PRODUCTION_API_URL,
    environment: 'production_fallback',
    source: 'railway_fallback'
  };
};

const urls = getApiUrls();

// 🔄 URLs dinámicas
export const API_BASE_URL = urls.apiUrl;
export const ENVIRONMENT = urls.environment;
export const DATA_SOURCE = urls.source;

// 📊 Configuración de sincronización
export const SYNC_CONFIG = {
  // Intervalo de sincronización (ms)
  syncInterval: 30000, // 30 segundos

  // Tiempo de espera para timeout
  timeout: 10000, // 10 segundos

  // Reintentos de conexión
  maxRetries: 3,

  // Modo offline (usar datos locales)
  offlineMode: false,

  // Auto-backup cuando hay conexión
  autoBackup: true,

  // Endpoint de sincronización
  syncEndpoint: '/sync',

  // Endpoint de backup
  backupEndpoint: '/backup'
};

// 🔐 Configuración de Keycloak
const getKeycloakUrls = () => {
  if (urls.environment === 'local') {
    return {
      tokenUrl: `http://${LOCAL_PC_IP}:8080/realms/joywine/protocol/openid-connect/token`,
      issuer: `http://${LOCAL_PC_IP}:8080/realms/joywine`,
    };
  }

  return {
    tokenUrl: `${PRODUCTION_KEYCLOAK_URL}/realms/joywine/protocol/openid-connect/token`,
    issuer: `${PRODUCTION_KEYCLOAK_URL}/realms/joywine`,
  };
};

const keycloakUrls = getKeycloakUrls();

export const KEYCLOAK_TOKEN_URL = keycloakUrls.tokenUrl;
export const KEYCLOAK_ISSUER = keycloakUrls.issuer;
export const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'joy-api';

export const APP_NAME = 'JoyPark';
export const APP_VERSION = '1.0.0';

// 📱 Información de depuración
console.log('🌐 CONFIGURACIÓN HÍBRIDA QR FRONT ACTIVADA');
console.log(`📍 Ambiente: ${ENVIRONMENT}`);
console.log(`🔗 API URL: ${API_BASE_URL}`);
console.log(`📡 Data Source: ${DATA_SOURCE}`);
console.log(`🔐 Keycloak: ${KEYCLOAK_ISSUER}`);
console.log(`🔄 Sync Interval: ${SYNC_CONFIG.syncInterval}ms`);

// 🔧 Funciones helper
const join = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
    .join('/');

const withQuery = (url: string, query: Record<string, any>) => {
  const q = new URLSearchParams(query).toString();
  return q ? `${url}?${q}` : url;
};

// 📊 Endpoints de la API
export const ENDPOINTS = {
  // Autenticación
  auth: {
    login: join(API_BASE_URL, '/auth/login'),
    register: join(API_BASE_URL, '/auth/register'),
    me: join(API_BASE_URL, '/auth/me'),
    refresh: join(API_BASE_URL, '/auth/refresh'),
    logout: join(API_BASE_URL, '/auth/logout'),
  },

  // Usuarios
  users: {
    base: join(API_BASE_URL, '/users'),
    create: join(API_BASE_URL, '/users'),
    getById: (id: string) => join(API_BASE_URL, '/users', id),
    update: (id: string) => join(API_BASE_URL, '/users', id),
    delete: (id: string) => join(API_BASE_URL, '/users', id),
  },

  // Productos
  products: {
    base: join(API_BASE_URL, '/products'),
    create: join(API_BASE_URL, '/products'),
    getById: (id: string) => join(API_BASE_URL, '/products', id),
    update: (id: string) => join(API_BASE_URL, '/products', id),
    delete: (id: string) => join(API_BASE_URL, '/products', id),
  },

  // Órdenes
  orders: {
    base: join(API_BASE_URL, '/orders'),
    create: join(API_BASE_URL, '/orders'),
    getById: (id: string) => join(API_BASE_URL, '/orders', id),
    update: (id: string) => join(API_BASE_URL, '/orders', id),
    delete: (id: string) => join(API_BASE_URL, '/orders', id),
    getAll: (query?: any) => withQuery(join(API_BASE_URL, '/orders'), query || {}),
  },

  // Tickets
  tickets: {
    base: join(API_BASE_URL, '/tickets'),
    create: join(API_BASE_URL, '/tickets'),
    getById: (id: string) => join(API_BASE_URL, '/tickets', id),
    getAll: (query?: any) => withQuery(join(API_BASE_URL, '/tickets'), query || {}),
  },

  // Mesas
  tables: {
    base: join(API_BASE_URL, '/tables'),
    create: join(API_BASE_URL, '/tables'),
    getById: (id: string) => join(API_BASE_URL, '/tables', id),
    update: (id: string) => join(API_BASE_URL, '/tables', id),
    delete: (id: string) => join(API_BASE_URL, '/tables', id),
    getAll: () => join(API_BASE_URL, '/tables'),
  },

  // QR
  qr: {
    generate: join(API_BASE_URL, '/qr/generate'),
    scan: join(API_BASE_URL, '/qr/scan'),
    validate: join(API_BASE_URL, '/qr/validate'),
  },

  // Entradas
  entranceTickets: {
    base: join(API_BASE_URL, '/entrance-tickets'),
    create: join(API_BASE_URL, '/entrance-tickets'),
    getAll: () => join(API_BASE_URL, '/entrance-tickets'),
  },

  // Comandas
  comandas: {
    base: join(API_BASE_URL, '/comandas'),
    create: join(API_BASE_URL, '/comandas'),
    getById: (id: string) => join(API_BASE_URL, '/comandas', id),
    update: (id: string) => join(API_BASE_URL, '/comandas', id),
    getAll: () => join(API_BASE_URL, '/comandas'),
  },

  // External (integración con Product App)
  external: {
    orders: join(API_BASE_URL, '/api/external/orders'),
    registerPayment: (orderId: string) => join(API_BASE_URL, `/api/external/orders/${orderId}/register-payment`),
    cashRegister: join(API_BASE_URL, '/api/external/cash-register'),
  },

  // Sincronización
  sync: {
    base: join(API_BASE_URL, SYNC_CONFIG.syncEndpoint),
    backup: join(API_BASE_URL, SYNC_CONFIG.backupEndpoint),
    status: join(API_BASE_URL, '/sync/status'),
  },

  // Health check
  health: join(API_BASE_URL, '/health'),
};

export default {
  API_BASE_URL,
  ENVIRONMENT,
  DATA_SOURCE,
  SYNC_CONFIG,
  KEYCLOAK_TOKEN_URL,
  KEYCLOAK_ISSUER,
  KEYCLOAK_CLIENT_ID,
  ENDPOINTS,
};
