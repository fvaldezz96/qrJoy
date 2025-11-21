import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './hook';
import socketService from '../services/socketService';
import { 
  orderCreatedRealtime, 
  orderUpdatedRealtime, 
  orderStatusChangedRealtime, 
  orderDeletedRealtime 
} from '../store/slices/ordersSlice';

/**
 * Hook personalizado para manejar conexiones WebSocket
 */
export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((s) => s.auth);
  
  // Conectar al WebSocket cuando el usuario esté autenticado
  const connectSocket = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      await socketService.connect(token);
      console.log('🔌 WebSocket conectado para usuario:', user.email);
    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
    }
  }, [user, token]);

  // Desconectar del WebSocket
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    console.log('🔌 WebSocket desconectado');
  }, []);

  // Suscribirse a eventos de órdenes (para empleados/admin)
  const subscribeToOrders = useCallback(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) return;

    const unsubscribe = socketService.subscribeToOrders((data: any) => {
      console.log('📦 Evento de orden recibido:', data);
      
      switch (data.type) {
        case 'order:created':
          dispatch(orderCreatedRealtime(data.order));
          break;
        case 'order:updated':
          dispatch(orderUpdatedRealtime(data.order));
          break;
        case 'order:status_changed':
          dispatch(orderStatusChangedRealtime({
            orderId: data.orderId,
            status: data.status,
            updatedAt: data.updatedAt
          }));
          break;
        case 'order:deleted':
          dispatch(orderDeletedRealtime({ orderId: data.orderId }));
          break;
        default:
          console.log('Evento de orden no manejado:', data.type);
      }
    });

    return unsubscribe;
  }, [user, dispatch]);

  // Suscribirse a compras de tickets de entrada (para empleados/admin)
  const subscribeToEntranceTickets = useCallback(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) return;

    const unsubscribe = socketService.subscribeToEntranceTickets((data: any) => {
      console.log('🎟 Evento de ticket de entrada recibido:', data);
      // Acá podés despachar acciones al slice que quieras (ej: panel de admin)
      // por ahora solo lo dejamos logueado para que puedas integrarlo donde necesites.
    });

    return unsubscribe;
  }, [user]);

  // Efecto para conectar/desconectar automáticamente
  useEffect(() => {
    if (user && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    // Cleanup al desmontar el componente
    return () => {
      disconnectSocket();
    };
  }, [user, token, connectSocket, disconnectSocket]);

  // Efecto para suscribirse a eventos de órdenes
  useEffect(() => {
    if (!socketService.isSocketConnected()) return;

    const unsubscribeOrders = subscribeToOrders();

    // Cleanup
    return () => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    };
  }, [subscribeToOrders]);

  return {
    isConnected: socketService.isSocketConnected(),
    connect: connectSocket,
    disconnect: disconnectSocket,
    subscribeToOrders,
    subscribeToEntranceTickets,
  };
};

/**
 * Hook específico para órdenes en tiempo real
 * Úsalo en componentes que muestran listas de órdenes
 */
export const useOrdersRealtime = () => {
  const { user } = useAppSelector((s) => s.auth);
  const { orders, loadingOrders } = useAppSelector((s) => s.orders);
  const { isConnected } = useWebSocket();

  // Solo empleados y admin pueden ver órdenes en tiempo real
  const canViewOrders = user?.role === 'admin' || user?.role === 'employee';

  return {
    orders,
    loading: loadingOrders,
    isConnected,
    canViewOrders,
    isRealtime: isConnected && canViewOrders,
  };
};
