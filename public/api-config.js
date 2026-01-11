// Configuración dinámica de APIs
class APIConfig {
  constructor() {
    this.isLocal = window.location.hostname === 'localhost';
    this.setupAPIs();
  }

  setupAPIs() {
    if (this.isLocal) {
      console.log('🏠 Modo desarrollo local detectado');
      this.apis = {
        product: 'http://localhost:3000',
        qr: 'http://localhost:3001',
        productFront: 'http://localhost:8081',
        qrFront: 'http://localhost:8083'
      };
    } else {
      console.log('🚀 Modo producción detectado');
      this.apis = {
        product: 'http://localhost:3000',
        qr: 'http://localhost:3001',
        productFront: 'http://localhost:8081',
        qrFront: 'https://qrjoy-production-58c3.up.railway.app'
      };
    }
  }

  getAPI(type) {
    return this.apis[type];
  }

  // Interceptar fetch para usar URLs correctas automáticamente
  interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (url, options) => {
      let newUrl = url;

      // Reemplazar URLs de producción con locales si estamos en desarrollo
      if (this.isLocal) {
        if (url.includes('product-api-production-b9c7.up.railway.app')) {
          newUrl = url.replace('http://localhost:3000', this.apis.product);
          console.log('🔄 Redirigiendo Product API:', newUrl);
        }
        if (url.includes('qrjoy-api-production.up.railway.app')) {
          newUrl = url.replace('http://localhost:3001', this.apis.qr);
          console.log('🔄 Redirigiendo QR API:', newUrl);
        }
      }

      try {
        return await originalFetch(newUrl, options);
      } catch (error) {
        console.error('❌ Error en petición a:', newUrl, error);

        // Si falla local en desarrollo, intentar con producción
        if (this.isLocal && error.name === 'TypeError') {
          console.log('🔄 Falló local, intentando producción...');
          const fallbackUrl = url.includes('product-api')
            ? url.replace('http://localhost:3000', 'http://localhost:3000')
            : url.replace('http://localhost:3001', 'http://localhost:3001');

          return originalFetch(fallbackUrl, options);
        }

        throw error;
      }
    };
  }

  init() {
    this.interceptFetch();

    // Exponer configuración globalmente
    window.API_CONFIG = {
      isLocal: this.isLocal,
      apis: this.apis,
      getAPI: (type) => this.getAPI(type)
    };

    console.log('✅ Configuración de APIs inicializada:', this.apis);
  }
}

// Inicializar automáticamente
const apiConfig = new APIConfig();
apiConfig.init();
