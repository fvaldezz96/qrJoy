import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, SYSTEM_A_API_URL, ENV_CONFIG } from '../config';

// 🌐 Cliente API centralizado con soporte multi-entorno
class ApiClient {
  public instance: AxiosInstance;
  public fallbackInstance?: AxiosInstance;

  constructor() {
    // Instancia principal para la API QR
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `JoyPark/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'} (${ENV_CONFIG.nodeEnv})`,
        'X-Client-Platform': 'expo-web',
        'X-Client-Environment': ENV_CONFIG.isProduction ? 'production' : ENV_CONFIG.isDocker ? 'docker' : 'local',
        'X-Client-Base-URL': API_BASE_URL,
      },
    });

    // Instancia fallback para API local (solo en desarrollo/docker)
    if (!ENV_CONFIG.isProduction && API_BASE_URL !== SYSTEM_A_API_URL) {
      this.fallbackInstance = axios.create({
        baseURL: SYSTEM_A_API_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `JoyPark/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'} (${ENV_CONFIG.nodeEnv})`,
          'X-Client-Platform': 'expo-web',
          'X-Client-Environment': ENV_CONFIG.isProduction ? 'production' : ENV_CONFIG.isDocker ? 'docker' : 'local',
          'X-Client-Base-URL': SYSTEM_A_API_URL,
        },
      });
    }

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptor de respuesta para manejo centralizado de errores
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as any;

        // Log de errores para debugging
        console.error(`[API Error] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          baseURL: this.instance.defaults.baseURL,
          isProduction: ENV_CONFIG.isProduction,
        });

        // Intentar fallback solo en desarrollo/docker y si el error es de red/servidor
        if (
          !ENV_CONFIG.isProduction &&
          this.fallbackInstance &&
          this.shouldTryFallback(error) &&
          !originalRequest._fallbackAttempted
        ) {
          console.warn(`[API Fallback] Intentando fallback a ${this.fallbackInstance.defaults.baseURL}`);

          originalRequest._fallbackAttempted = true;
          originalRequest.baseURL = this.fallbackInstance.defaults.baseURL;

          return this.fallbackInstance(originalRequest);
        }

        return Promise.reject(error);
      }
    );

    // Interceptor de petición para logging
    this.instance.interceptors.request.use(
      (config) => {
        if (ENV_CONFIG.nodeEnv === 'development') {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            headers: config.headers,
          });
        }
        return config;
      }
    );
  }

  private shouldTryFallback(error: any): boolean {
    // Solo intentar fallback para errores de red o servidor no encontrado
    const status = error.response?.status;
    const code = error.code;

    return (
      status === 0 || // Network error
      status === 404 || // Not found
      status === 502 || // Bad gateway
      status === 503 || // Service unavailable
      status === 504 || // Gateway timeout
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET'
    );
  }

  // Métodos públicos
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config);
  }

  // Método específico para login con fallback a Sistema A
  public async loginToSystemA(email: string, password: string) {
    try {
      if (!this.fallbackInstance) {
        throw new Error('Fallback instance not configured (SYSTEM_A_API_URL match API_BASE_URL or is invalid)');
      }
      const response = await this.fallbackInstance.post('/api/user/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('[Login] Error al intentar login en Sistema A:', error);
      throw error;
    }
  }

  public setAuthToken(token: string | null) {
    if (token) {
      this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (this.fallbackInstance) {
        this.fallbackInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } else {
      delete this.instance.defaults.headers.common['Authorization'];
      if (this.fallbackInstance) {
        delete this.fallbackInstance.defaults.headers.common['Authorization'];
      }
    }
  }

  public clearAuthToken() {
    this.setAuthToken(null);
  }

  // Métodos de diagnóstico
  public getBaseURL() {
    return this.instance.defaults.baseURL;
  }

  public getFallbackBaseURL() {
    return this.fallbackInstance?.defaults.baseURL || null;
  }

  public getEnvironment() {
    return ENV_CONFIG;
  }
}

// Exportar instancia única
const apiClientInstance = new ApiClient();
export default apiClientInstance;

// Exportar métodos individuales para compatibilidad
export const get = apiClientInstance.get.bind(apiClientInstance);
export const post = apiClientInstance.post.bind(apiClientInstance);
export const put = apiClientInstance.put.bind(apiClientInstance);
export const patch = apiClientInstance.patch.bind(apiClientInstance);
export const deleteMethod = apiClientInstance.delete.bind(apiClientInstance);
export const setAuthToken = apiClientInstance.setAuthToken.bind(apiClientInstance);
export const clearAuthToken = apiClientInstance.clearAuthToken.bind(apiClientInstance);
export const loginToSystemA = apiClientInstance.loginToSystemA.bind(apiClientInstance);
export const getBaseURL = apiClientInstance.getBaseURL.bind(apiClientInstance);
export const getFallbackBaseURL = apiClientInstance.getFallbackBaseURL.bind(apiClientInstance);
export const getEnvironment = apiClientInstance.getEnvironment.bind(apiClientInstance);
