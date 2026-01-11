// Configuración forzada para desarrollo local
window.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000';
window.EXPO_PUBLIC_SYSTEM_B_API_URL = 'http://localhost:3001';
window.EXPO_PUBLIC_QR_API_URL = 'http://localhost:3001';
window.EXPO_PUBLIC_HOST_API = 'http://localhost:3000';

// Sobrescribir cualquier configuración de producción
if (window.location.hostname === 'localhost') {
  console.log('🏠 Forzando configuración local');

  // Sobrescribir funciones de fetch para usar URLs locales
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    // Reemplazar URLs de producción con URLs locales
    if (url.includes('gracious-balance-production.up.railway.app')) {
      url = url.replace('http://localhost:8081', 'http://localhost:3000');
      console.log('🔄 Redirigiendo a local:', url);
    }
    if (url.includes('qrjoy-api-production.up.railway.app')) {
      url = url.replace('http://localhost:3001', 'http://localhost:3001');
      console.log('🔄 Redirigiendo QR a local:', url);
    }

    return originalFetch(url, options);
  };
}
