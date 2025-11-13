import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { getAllOrders } from '../../src/store/slices/ordersSlice';

// === INTERFAZ DE ITEM ===
interface OrderItem {
  productId?: string;
  qty: number;
  price: number;
}

// === COMPONENTE DE TARJETA ANIMADA ===
function AnimatedOrderCard({ item }: { item: any }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scaleAnim, { toValue: 1.03, useNativeDriver: true }).start();
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Sin fecha';

  const statusConfig = {
    paid: { color: '#00FF88', icon: 'checkmark-circle', label: 'Pagada' },
    pending: { color: '#FAD02C', icon: 'time', label: 'Pendiente' },
    served: { color: '#00AEEF', icon: 'restaurant', label: 'Servida' },
    cancelled: { color: '#E53170', icon: 'close-circle', label: 'Cancelada' },
  } as const;

  const status = statusConfig[item.status] || statusConfig.pending;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardInner}>
          {/* Header con ID y estado */}
          <View style={styles.cardHeader}>
            <View style={styles.idContainer}>
              <Ionicons name="receipt" size={20} color="#FAD02C" />
              <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Ionicons name={status.icon} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Info principal */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color="#00AEEF" />
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{date}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="cash" size={16} color="#00FF88" />
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoValue}>${item.total.toLocaleString()}</Text>
            </View>

            {item.tableId && (
              <View style={styles.infoItem}>
                <Ionicons name="location" size={16} color="#E53170" />
                <Text style={styles.infoLabel}>Mesa</Text>
                <Text style={styles.infoValue}>{item.tableId}</Text>
              </View>
            )}
          </View>

          {/* Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Productos</Text>
            {item.items?.length ? (
              item.items.map((it: OrderItem, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    • {it.productId || '—'} ×{it.qty}
                  </Text>
                  <Text style={styles.itemPrice}>${it.price}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyItems}>Sin productos</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Borde neón por estado */}
      <View style={[styles.statusBorder, { backgroundColor: status.color }]} />
    </Animated.View>
  );
}

// === PANTALLA PRINCIPAL ===
export default function OrdersScreen() {
  const dispatch = useAppDispatch();
  const { orders, loadingOrders, error } = useAppSelector((s) => s.orders);
  const router = useRouter();
  const [step, setStep] = useState<'cart' | 'qr'>('cart');

  const goBack = () => {
    if (step === 'qr') {
      setStep('cart');
    } else {
      router.back();
    }
  };
  useEffect(() => {
    dispatch(getAllOrders());
  }, [dispatch]);

  if (loadingOrders) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <ActivityIndicator size="large" color="#FAD02C" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Ionicons name="alert-circle" size={60} color="#E53170" />
        <Text style={styles.errorText}>Error: {error}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.gradientBg}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.container}>
        {/* Header Glass */}
        <View style={styles.headerGlass}>
          <Ionicons name="cart" size={32} color="#FAD02C" />
          <Text style={styles.title}>Órdenes Registradas</Text>
          <Text style={styles.subtitle}>Total: {orders.length} órdenes</Text>
        </View>

        {/* Lista */}
        <FlatList
          data={orders}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={60} color="#555" />
              <Text style={styles.emptyText}>No hay órdenes registradas</Text>
            </View>
          }
          renderItem={({ item, index }) => <AnimatedOrderCard item={item} />}
        />
      </View>
    </LinearGradient>
  );
}

// === ESTILOS ===
const styles = {
  gradientBg: { flex: 1 },
  container: { flex: 1, padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FAD02C', marginTop: 16, fontSize: 16, fontWeight: '600' },
  errorText: { color: '#E53170', marginTop: 16, fontSize: 16, fontWeight: '600' },
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAD02C',
    letterSpacing: 1,
    textShadowColor: '#FAD02C60',
    textShadowRadius: 10,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A7A9BE',
    marginTop: 6,
  },
  list: { paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, color: '#888', marginTop: 16 },
  cardWrapper: {
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardGradient: { padding: 2 },
  cardInner: {
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FAD02C',
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 12,
    color: '#A7A9BE',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  itemsSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  itemsTitle: {
    fontSize: 14,
    color: '#FAD02C',
    fontWeight: '700',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  itemText: {
    fontSize: 13,
    color: '#ddd',
  },
  itemPrice: {
    fontSize: 13,
    color: '#00FF88',
    fontWeight: '600',
  },
  emptyItems: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBorder: {
    height: 6,
    width: '100%',
  },
} as const;
