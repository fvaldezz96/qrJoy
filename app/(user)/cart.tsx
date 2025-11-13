import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { clearCart } from '../../src/store/slices/cartSlice';
import { createOrder, payMockOrder } from '../../src/store/slices/ordersSlice';

export default function Cart() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items } = useAppSelector((s) => s.cart);
  const { qr, loading } = useAppSelector((s) => s.orders);
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);

  const total = items.reduce((a, b) => a + b.product.price * b.qty, 0);
  const [step, setStep] = useState<'cart' | 'qr'>('cart');

  // === REDIRECCIÓN SI NO HAY USUARIO ===
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // === ANIMAR TOTAL ===
  const totalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(totalAnim, {
      toValue: total,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [total]);

  const animatedTotal = totalAnim.interpolate({
    inputRange: [0, 100000],
    outputRange: [0, 100000],
    extrapolate: 'clamp',
  });

  const tableId = '671eec541acb10f63df915f4';
  const type = 'restaurant';

  const handlePay = async () => {
    if (!items.length) return Alert.alert('Carrito vacío');
    if (!user?._id) return Alert.alert('Error', 'Debes iniciar sesión');

    try {
      const res = await dispatch(createOrder({ items, tableId, type, userId: user._id })).unwrap();
      await dispatch(payMockOrder(res)).unwrap();
      setStep('qr');
      dispatch(clearCart());
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar el pago');
    }
  };

  const goBack = () => {
    if (step === 'qr') {
      setStep('cart');
    } else {
      router.back();
    }
  };

  // === CARGA DE SESIÓN ===
  if (authLoading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </LinearGradient>
    );
  }

  // === PASO QR (solo si hay QR) ===
  if (step === 'qr' && qr) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.qrScroll}>
          <View style={styles.qrHeader}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>¡Listo!</Text>
          </View>

          <View style={styles.qrCard}>
            <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.qrGradient}>
              <View style={styles.qrInner}>
                <Text style={styles.qrText}>Mostrá este QR en la barra</Text>
                <View style={styles.qrImageContainer}>
                  <Image source={{ uri: qr.pngDataUrl }} style={styles.qrImage} />
                  <View style={styles.qrGlow} />
                </View>
                <Text style={styles.qrCode}>Código: {qr.code.slice(0, 16)}...</Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/')}>
            <Text style={styles.doneText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // === PASO CARRITO (solo si hay usuario) ===
  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tu Carrito</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={72} color="#6B7280" />
            <Text style={styles.emptyText}>Tu carrito está vacío</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(user)/products')}
            >
              <Text style={styles.shopText}>Ir a comprar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(i) => i.product._id}
              scrollEnabled={false}
              renderItem={({ item, index }) => <CartItem item={item} index={index} />}
            />

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total</Text>
              <Animated.Text style={styles.totalPrice}>
                $
                {animatedTotal
                  .__getValue()
                  .toFixed(0)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              </Animated.Text>
            </View>

            {/* Pagar */}
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePay}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#6B7280', '#4B5563'] : ['#8B5CF6', '#EC4899']}
                style={styles.payGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="card" size={22} color="#fff" />
                    <Text style={styles.payText}>Generar QR (Mock)</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// === ITEM DEL CARRITO ===
function CartItem({ item, index }: { item: any; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.itemCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemQty}>x{item.qty}</Text>
      </View>
      <Text style={styles.itemPrice}>${(item.product.price * item.qty).toLocaleString()}</Text>
    </Animated.View>
  );
}

// === ESTILOS MEJORADOS ===
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  qrScroll: { flexGrow: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8B5CF6', marginTop: 16, fontSize: 18, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { fontSize: 30, fontWeight: '900', color: '#FAD02C', letterSpacing: 0.5 },

  // Empty
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: { color: '#9CA3AF', marginTop: 20, fontSize: 18, fontWeight: '600' },
  shopButton: {
    marginTop: 28,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 8,
  },
  shopText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Item
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    elevation: 6,
  },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  itemQty: { color: '#A7A9BE', fontSize: 15, marginTop: 4, fontWeight: '600' },
  itemPrice: { color: '#8B5CF6', fontSize: 18, fontWeight: '800' },

  // Total
  totalCard: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    padding: 22,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    elevation: 12,
  },
  totalLabel: { color: '#fff', fontSize: 20, fontWeight: '800' },
  totalPrice: { color: '#FAD02C', fontSize: 32, fontWeight: '900' },

  // Pay
  payButton: { borderRadius: 20, overflow: 'hidden', marginTop: 12, elevation: 15 },
  payButtonDisabled: { opacity: 0.6 },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  payText: { color: '#fff', fontSize: 19, fontWeight: '800' },

  // QR Step
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
    width: '100%',
  },
  qrTitle: { fontSize: 32, fontWeight: '900', color: '#00FFAA' },
  qrCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 36,
    elevation: 20,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  qrGradient: { padding: 4 },
  qrInner: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
  },
  qrText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 28, textAlign: 'center' },
  qrImageContainer: { position: 'relative', marginBottom: 20 },
  qrImage: { width: 240, height: 240, borderRadius: 20 },
  qrGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#8B5CF6',
    borderRadius: 30,
    opacity: 0.3,
    ...Platform.select({ web: { filter: 'blur(30px)' } }),
  },
  qrCode: { color: '#A7A9BE', fontSize: 13, fontFamily: 'monospace', marginTop: 8 },
  doneButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 20,
    elevation: 12,
  },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
