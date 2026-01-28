import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { clearCart, removeFromCart } from '../../src/store/slices/cartSlice';
import { confirmMpPayment, createMpPayment, createOrder, payMockOrder } from '../../src/store/slices/ordersSlice';
import { fetchTables, selectActiveTables } from '../../src/store/slices/tablesSlice';
import { showAlert } from '../../src/utils/showAlert';
import LoginModal from '../../src/components/LoginModal';

export default function Cart() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items } = useAppSelector((s) => s.cart);
  const { qr, loading } = useAppSelector((s) => s.orders);
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const activeTables = useAppSelector(selectActiveTables);

  const total = items.reduce((a, b) => a + b.product.price * b.qty, 0);
  const [step, setStep] = useState<'cart' | 'qr'>('cart');
  const [displayTotal, setDisplayTotal] = useState(total);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<'mp' | 'cash' | null>(null);

  const DEMO_INTERNAL_EMAILS = [
    'demo@demo.com',
    'admin@demo.com',
    'employee@demo.com',
    'user.demo@joywine.com',
  ];
  const isInternalDemoUser = !!user && DEMO_INTERNAL_EMAILS.includes(user.email);

  // === REDIRECCIÓN ELIMINADA (Para permitir ver el carrito sin loguearse) ===

  // === ANIMAR TOTAL ===
  const totalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = totalAnim.addListener(({ value }) => {
      setDisplayTotal(value);
    });
    return () => totalAnim.removeListener(id);
  }, [totalAnim]);

  useEffect(() => {
    Animated.timing(totalAnim, {
      toValue: total,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [total]);

  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  const type = 'bar';

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const validateBeforePay = () => {
    if (!items.length) return showAlert('Carrito vacío', 'Agregá productos antes de pagar.');
    if (!user?._id) {
      setLoginModalVisible(true);
      return false;
    }
    if (!selectedTableId) return showAlert('Error', 'Seleccioná una mesa antes de continuar');
    return true;
  };

  const handlePayMp = async () => {
    if (!validateBeforePay()) return;
    if (processingPayment) return; // Prevenir doble clic

    setProcessingPayment('mp');
    try {
      const orderId = await dispatch(createOrder({ tableId: selectedTableId!, type })).unwrap();

      const pref = await dispatch(createMpPayment({ orderId })).unwrap();

      // Abrir la URL de pago de Mercado Pago
      if (Platform.OS === 'web') {
        window.open(pref.initPoint, '_blank');
      } else {
        await Linking.openURL(pref.initPoint);
      }

      // Por ahora, seguimos confirmando por orderId para mostrar el QR inmediatamente.
      // Más adelante se puede ajustar para usar paymentId o confiar solo en el webhook.
      await dispatch(confirmMpPayment({ orderId })).unwrap();
      setStep('qr');
      dispatch(clearCart());
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo procesar el pago');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePayCash = async () => {
    if (!validateBeforePay()) return;
    if (processingPayment) return; // Prevenir doble clic

    setProcessingPayment('cash');
    try {
      const orderId = await dispatch(createOrder({ tableId: selectedTableId!, type })).unwrap();

      const res = await dispatch(payMockOrder(orderId)).unwrap();
      setStep('qr');
      dispatch(clearCart());
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo generar el QR');
    } finally {
      setProcessingPayment(null);
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
            {/* Selector de mesa */}
            <View style={styles.tableSelectorCard}>
              <Text style={styles.tableSelectorLabel}>Seleccioná tu mesa</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activeTables.map((t) => (
                  <TouchableOpacity
                    key={t._id}
                    style={[
                      styles.tableChip,
                      selectedTableId === t._id && styles.tableChipSelected,
                    ]}
                    onPress={() => setSelectedTableId(t._id)}
                  >
                    <Text
                      style={[
                        styles.tableChipText,
                        selectedTableId === t._id && styles.tableChipTextSelected,
                      ]}
                    >
                      Mesa {t.number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {activeTables.length === 0 && (
                <Text style={styles.tableSelectorHint}>
                  No hay mesas configuradas. Pedile a un administrador que las cree.
                </Text>
              )}
            </View>

            <FlatList
              data={items}
              keyExtractor={(i) => i.product._id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <CartItem
                  item={item}
                  index={index}
                  onRemove={() => handleRemove(item.product._id)}
                />
              )}
            />

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total</Text>
              <Animated.Text style={styles.totalPrice}>
                $
                {Math.round(displayTotal)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              </Animated.Text>
            </View>

            {/* Pagar */}
            {isInternalDemoUser ? (
              <>
                <TouchableOpacity
                  style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
                  onPress={handlePayMp}
                  disabled={!!processingPayment}
                >
                  <LinearGradient
                    colors={processingPayment ? ['#6B7280', '#4B5563'] : ['#8B5CF6', '#EC4899']}
                    style={styles.payGradient}
                  >
                    {processingPayment === 'mp' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="card" size={22} color="#fff" />
                        <Text style={styles.payText}>Pagar con Mercado Pago</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
                  onPress={handlePayCash}
                  disabled={!!processingPayment}
                >
                  <LinearGradient
                    colors={processingPayment ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
                    style={styles.payGradient}
                  >
                    {processingPayment === 'cash' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="cash" size={22} color="#fff" />
                        <Text style={styles.payText}>Generar QR y pagar en efectivo</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
                onPress={handlePayMp}
                disabled={!!processingPayment}
              >
                <LinearGradient
                  colors={processingPayment ? ['#6B7280', '#4B5563'] : ['#8B5CF6', '#EC4899']}
                  style={styles.payGradient}
                >
                  {processingPayment === 'mp' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="card" size={22} color="#fff" />
                      <Text style={styles.payText}>Pagar con Mercado Pago</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      <LoginModal visible={loginModalVisible} onClose={() => setLoginModalVisible(false)} />
    </LinearGradient>
  );
}

// === ITEM DEL CARRITO ===
function CartItem({ item, index, onRemove }: { item: any; index: number; onRemove: () => void }) {
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
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>${(item.product.price * item.qty).toLocaleString()}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color="#F87171" />
          <Text style={styles.removeButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
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
  itemRight: { alignItems: 'flex-end' },
  removeButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    backgroundColor: 'rgba(248,113,113,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeButtonText: { color: '#F87171', fontSize: 14, fontWeight: '700' },

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
  qrTitle: { fontSize: 32, fontWeight: '900', color: '#00FFAA', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
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
  tableSelectorCard: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
    marginBottom: 18,
  },
  tableSelectorLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tableChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    marginRight: 8,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  tableChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A855F7',
  },
  tableChipText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  tableChipTextSelected: {
    color: '#FFFFFF',
  },
  tableSelectorHint: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
