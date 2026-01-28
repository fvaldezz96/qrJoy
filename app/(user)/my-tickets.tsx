import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { useWebSocket } from '../../src/hook/useWebSocket';
import { fetchUserTickets, fetchUserReceipts } from '../../src/store/slices/entranceTicketsSlice';
import { fetchMyOrders, orderStatusChangedRealtime } from '../../src/store/slices/ordersSlice';

export default function MyTickets() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // === AUTH & USER ===
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const userId = user?._id;
  const isUser = user?.role === 'user';

  // === TICKETS & ORDERS STATE ===
  const { entities, loading: ticketsLoading, receipts } = useAppSelector((s) => s.entranceTickets);
  const { myOrders, loading: ordersLoading } = useAppSelector((s) => s.orders);
  const tickets = Object.values(entities);

  const [activeTab, setActiveTab] = useState<'tickets' | 'receipts' | 'orders'>('tickets');

  // === WEBSOCKET ===
  const { subscribeToMyOrders, connect } = useWebSocket();

  // === TRAER DATOS SI ES USER ===
  useEffect(() => {
    if (userId && isUser) {
      dispatch(fetchUserTickets({ userId }));
      dispatch(fetchUserReceipts());
      dispatch(fetchMyOrders());
      connect();
    }
  }, [userId, isUser, dispatch, connect]);

  // === SUSCRIPCIÓN EN TIEMPO REAL ===
  useEffect(() => {
    if (userId && isUser) {
      const unsub = subscribeToMyOrders((data) => {
        if (data.type === 'order:status_changed') {
          dispatch(orderStatusChangedRealtime({
            orderId: data.orderId,
            status: data.status,
            updatedAt: data.updatedAt
          }));
        }
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [userId, isUser, subscribeToMyOrders, dispatch]);

  const goBack = () => {
    router.back();
  };

  // === QR ANIMADO ===
  const QRView = ({ value, size = 140 }: { value: string; size?: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleHoverIn = () => {
      if (Platform.OS === 'web') {
        Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }).start();
      }
    };

    const handleHoverOut = () => {
      if (Platform.OS === 'web') {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      }
    };

    return Platform.OS === 'web' ? (
      <Animated.View
        // onMouseEnter/onMouseLeave sólo existen en web; se castea para que TS los acepte.
        {...({
          onMouseEnter: handleHoverIn,
          onMouseLeave: handleHoverOut,
        } as any)}
        style={[styles.qrContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={[styles.qrGlow, { shadowColor: '#00FFAA' }]} />
        <QRCodeCanvas value={value} size={size} level="H" />
      </Animated.View>
    ) : (
      <View style={styles.qrContainer}>
        <View style={[styles.qrGlow, { shadowColor: '#00FFAA' }]} />
        <QRCode value={value} size={size} />
      </View>
    );
  };

  // === BOTÓN COMPRA (MOCK) ===
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(bounceAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const buySample = async () => {
    // Aquí iría tu lógica de compra real
    alert('Compra simulada');
  };

  // === ESTADOS DE CARGA ===
  if (authLoading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </LinearGradient>
    );
  }

  if (!userId || !isUser) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerGlass}>
            <Ionicons name="shield-checkmark" size={40} color="#F59E0B" />
            <Text style={styles.title}>Acceso Restringido</Text>
            <Text style={styles.subtitle}>Debes iniciar sesión como usuario</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (ticketsLoading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#00FFAA" />
        <Text style={styles.loadingText}>Cargando tus entradas...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.gradientBg}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* HEADER */}
        <View style={styles.headerGlass}>
          <Ionicons name="qr-code" size={32} color="#00FFAA" />
          <Text style={styles.title}>Mis Accesos y Comprobantes</Text>
          <Text style={styles.subtitle}>Tus entradas y recibos de consumo</Text>
        </View>

        {/* TAB SELECTOR */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tickets' && styles.tabActive]}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>Entradas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'receipts' && styles.tabActive]}
            onPress={() => setActiveTab('receipts')}
          >
            <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>Recibos</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE ENTRADAS / RECIBOS / PEDIDOS */}
        <FlatList
          data={activeTab === 'tickets' ? tickets : activeTab === 'orders' ? myOrders : receipts}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={activeTab === 'tickets' ? "ticket-outline" : activeTab === 'orders' ? "cart-outline" : "receipt-outline"}
                size={60} color="#555"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'tickets' ? 'No tenés entradas todavía' : activeTab === 'orders' ? 'No tenés pedidos activos' : 'No tenés recibos de pedidos'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (activeTab === 'tickets') {
              const fechaValida = new Date(item.validUntil).toLocaleString('es-AR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              const qrData = JSON.stringify({
                id: item._id,
                type: item.type,
                code: item.qrId.code,
                status: item.qrId.state,
              });

              return (
                <View style={styles.ticketWrapper}>
                  <ImageBackground
                    source={{ uri: 'https://i.imgur.com/8x5T7fJ.png' }}
                    imageStyle={styles.ticketBgImage}
                    style={styles.ticketBg}
                  >
                    <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.ticketOverlay}>
                      <View style={styles.ticketContent}>
                        <View style={styles.ticketHeader}>
                          <Ionicons name="ticket" size={28} color="#FAD02C" />
                          <Text style={styles.ticketId}>#{item._id.slice(-6).toUpperCase()}</Text>
                        </View>
                        <View style={styles.ticketInfo}>
                          <View style={styles.infoRow}><Ionicons name="pricetag" size={16} color="#8B5CF6" /><Text style={styles.infoText}>{item.type.toUpperCase()}</Text></View>
                          <View style={styles.infoRow}><Ionicons name="cash" size={16} color="#E53170" /><Text style={styles.infoText}>${item.price.toLocaleString()}</Text></View>
                          <View style={styles.infoRow}><Ionicons name="time" size={16} color="#00AEEF" /><Text style={styles.infoText}>Válida hasta: {fechaValida}</Text></View>
                        </View>
                        <View style={styles.qrSection}>
                          <QRView value={qrData} size={140} />
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              );
            } else if (activeTab === 'orders') {
              // Render Active Order Tracking
              const order = item as any;
              const statusLabels: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
                pending: { label: 'Pendiente', color: '#FAD02C', icon: 'time-outline' },
                pending_payment: { label: 'Esperando Pago', color: '#F59E0B', icon: 'card-outline' },
                paid: { label: 'Pagada', color: '#00FF88', icon: 'checkmark-done-outline' },
                ready: { label: '¡Lista!', color: '#00AEEF', icon: 'notifications-outline' },
                served: { label: 'Entregada', color: '#8B5CF6', icon: 'restaurant-outline' },
                cancelled: { label: 'Cancelada', color: '#EF4444', icon: 'close-circle-outline' },
              };
              const cfg = statusLabels[order.status] || statusLabels.pending;

              return (
                <View style={styles.ticketWrapper}>
                  <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.ticketOverlay}>
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Ionicons name={cfg.icon} size={28} color={cfg.color} />
                        <Text style={[styles.ticketId, { color: cfg.color }]}>ESTADO: {cfg.label.toUpperCase()}</Text>
                      </View>

                      <View style={styles.ticketInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="restaurant" size={16} color="#FAD02C" />
                          <Text style={styles.infoText}>Mesa: {order.tableNumber ?? '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="cart" size={16} color="#8B5CF6" />
                          <Text style={styles.infoText}>{order.items?.length || 0} productos</Text>
                        </View>
                        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10 }}>
                          {order.items?.map((it: any, idx: number) => (
                            <Text key={idx} style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>
                              • {it.productName || 'Producto'} x{it.qty}
                            </Text>
                          ))}
                        </View>
                      </View>

                      {order.qrId?.code && (
                        <View style={styles.qrSection}>
                          <Text style={[styles.qrLabel, { marginBottom: 10 }]}>Mostrá este QR para recibir tu pedido</Text>
                          <QRView value={JSON.stringify({ c: order.qrId.code, s: order.qrId.signature })} size={120} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  {/* Borde indicador de estado */}
                  <View style={{ height: 4, width: '100%', backgroundColor: cfg.color }} />
                </View>
              );
            } else {
              // Render Receipt
              return (
                <View style={styles.ticketWrapper}>
                  <LinearGradient colors={['#1F1D2C', '#161522']} style={styles.ticketOverlay}>
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Ionicons name="receipt" size={28} color="#00FFAA" />
                        <Text style={styles.ticketId}>TICKET #{item._id.slice(-6).toUpperCase()}</Text>
                      </View>
                      <View style={styles.ticketInfo}>
                        <View style={styles.infoRow}><Ionicons name="restaurant" size={16} color="#FAD02C" /><Text style={styles.infoText}>Mesa: {item.tableNumber || '-'}</Text></View>
                        <View style={styles.infoRow}><Ionicons name="cash" size={16} color="#00FF88" /><Text style={styles.infoText}>Total: ${item.total?.toLocaleString()}</Text></View>
                        <View style={{ marginTop: 8 }}>
                          {item.items?.map((it: any, idx: number) => (
                            <Text key={idx} style={{ color: '#aaa', fontSize: 13 }}>• {it.name} x{it.qty}</Text>
                          ))}
                        </View>
                      </View>
                      <View style={styles.qrSection}>
                        <QRView value={item.qrCode} size={140} />
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            }
          }}
        />
      </View>
    </LinearGradient >
  );
}
const styles = {
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B5CF6',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 8,
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    // paddingTop: 30,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 30,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00FFAA',
    letterSpacing: 1,
    textShadowColor: '#00FFAA50',
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#A7A9BE',
    marginTop: 6,
  },
  buyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#FAD02C',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#888',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  ticketWrapper: {
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  ticketBg: {
    borderRadius: 20,
  },
  ticketBgImage: {
    opacity: 0.08,
    resizeMode: 'cover',
  },
  ticketOverlay: {
    padding: 20,
  },
  ticketContent: {
    alignItems: 'center',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  ticketId: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FAD02C',
    letterSpacing: 1.5,
    textShadowColor: '#FAD02C60',
    textShadowRadius: 8,
  },
  ticketInfo: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#F5F5F5',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 15,
    color: '#00FFAA',
    fontWeight: '700',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#00FFAA30',
  },
  qrGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  qrLabel: {
    marginTop: 12,
    fontSize: 13,
    color: '#A7A9BE',
    fontStyle: 'italic',
  },
  perforatedLine: {
    height: 20,
    borderTopWidth: 2,
    borderTopColor: '#333',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    color: '#888',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#00FFAA',
  },
} as const;
