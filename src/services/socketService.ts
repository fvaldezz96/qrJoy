import io from 'socket.io-client';
import { API_BASE_URL } from '../config';

class SocketService {
  private socket: any = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  // Eventos disponibles
  public readonly events = {
    // Órdenes
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_DELETED: 'order:deleted',
    ORDER_STATUS_CHANGED: 'order:status_changed',

    // Comandas
    COMANDA_CREATED: 'comanda:created',
    COMANDA_UPDATED: 'comanda:updated',
    COMANDA_STATUS_CHANGED: 'comanda:status_changed',

    // Mesas
    TABLE_UPDATED: 'table:updated',
    TABLE_OCCUPIED: 'table:occupied',
    TABLE_FREED: 'table:freed',

    // Tickets de entrada
    ENTRANCE_TICKET_PURCHASED: 'entrance_ticket:purchased',

    // Conexión
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    RECONNECT: 'reconnect',
    ERROR: 'error',
  } as const;

  /**
   * Conectar al servidor WebSocket
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Configuración del socket
        const socketUrl = API_BASE_URL.replace(/^http/, 'ws');

        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          auth: token ? { token } : undefined,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        // Eventos de conexión
        this.socket.on(this.events.CONNECT, () => {
          console.log('✅ WebSocket conectado');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on(this.events.DISCONNECT, (reason: any) => {
          console.log('❌ WebSocket desconectado:', reason);
          this.isConnected = false;
        });

        this.socket.on(this.events.RECONNECT, (attemptNumber: any) => {
          console.log(`🔄 WebSocket reconectado (intento ${attemptNumber})`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on(this.events.ERROR, (error: any) => {
          console.error('❌ Error de WebSocket:', error);
          reject(error);
        });

        // Timeout para la conexión inicial
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Timeout al conectar WebSocket'));
          }
        }, 10000);

      } catch (error) {
        console.error('Error al inicializar WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket desconectado manualmente');
    }
  }

  /**
   * Verificar si está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Suscribirse a un evento
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn('Socket no inicializado. Llama a connect() primero.');
    }
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emitir un evento al servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket no conectado. No se puede emitir evento:', event);
    }
  }

  /**
   * Unirse a una sala específica (para empleados/admin)
   */
  joinRoom(roomName: string): void {
    this.emit('join:room', { room: roomName });
    console.log(`📡 Uniéndose a la sala: ${roomName}`);
  }

  /**
   * Salir de una sala específica
   */
  leaveRoom(roomName: string): void {
    this.emit('leave:room', { room: roomName });
    console.log(`📡 Saliendo de la sala: ${roomName}`);
  }

  /**
   * Suscribirse a actualizaciones de órdenes en tiempo real
   */
  subscribeToOrders(callback: (data: any) => void): () => void {
    this.on(this.events.ORDER_CREATED, callback);
    this.on(this.events.ORDER_UPDATED, callback);
    this.on(this.events.ORDER_STATUS_CHANGED, callback);

    // Unirse a la sala de órdenes (para empleados)
    this.joinRoom('orders');

    // Función de cleanup
    return () => {
      this.off(this.events.ORDER_CREATED, callback);
      this.off(this.events.ORDER_UPDATED, callback);
      this.off(this.events.ORDER_STATUS_CHANGED, callback);
      this.leaveRoom('orders');
    };
  }

  /**
   * Suscribirse a actualizaciones de comandas en tiempo real
   */
  subscribeToComandas(callback: (data: any) => void): () => void {
    this.on(this.events.COMANDA_CREATED, callback);
    this.on(this.events.COMANDA_UPDATED, callback);
    this.on(this.events.COMANDA_STATUS_CHANGED, callback);

    // Unirse a la sala de comandas (para cocina/bar)
    this.joinRoom('comandas');

    // Función de cleanup
    return () => {
      this.off(this.events.COMANDA_CREATED, callback);
      this.off(this.events.COMANDA_UPDATED, callback);
      this.off(this.events.COMANDA_STATUS_CHANGED, callback);
      this.leaveRoom('comandas');
    };
  }

  /**
   * Suscribirse a actualizaciones de mesas en tiempo real
   */
  subscribeToTables(callback: (data: any) => void): () => void {
    this.on(this.events.TABLE_UPDATED, callback);
    this.on(this.events.TABLE_OCCUPIED, callback);
    this.on(this.events.TABLE_FREED, callback);

    // Unirse a la sala de mesas
    this.joinRoom('tables');

    // Función de cleanup
    return () => {
      this.off(this.events.TABLE_UPDATED, callback);
      this.off(this.events.TABLE_OCCUPIED, callback);
      this.off(this.events.TABLE_FREED, callback);
      this.leaveRoom('tables');
    };
  }

  /**
   * Suscribirse a compras de tickets de entrada en tiempo real
   */
  subscribeToEntranceTickets(callback: (data: any) => void): () => void {
    this.on(this.events.ENTRANCE_TICKET_PURCHASED, callback);

    // Unirse a la sala de tickets de entrada (para admin/employee)
    this.joinRoom('entrance-tickets');

    // Función de cleanup
    return () => {
      this.off(this.events.ENTRANCE_TICKET_PURCHASED, callback);
      this.leaveRoom('entrance-tickets');
    };
  }

  /**
   * Suscribirse a actualizaciones de mis órdenes (usuario)
   */
  subscribeToMyOrders(userId: string, callback: (data: any) => void): () => void {
    this.on(this.events.ORDER_STATUS_CHANGED, callback);
    this.joinRoom(`user_${userId}`);

    return () => {
      this.off(this.events.ORDER_STATUS_CHANGED, callback);
      this.leaveRoom(`user_${userId}`);
    };
  }
}

// Instancia singleton
export const socketService = new SocketService();
export default socketService;
