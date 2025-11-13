import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getAllOrders } from '../../src/store/slices/ordersSlice';

export default function QRScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{ png?: string; code?: string; signature?: string }>();

  // === AUTH & USER ===
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const userId = user?._id;
  const isUser = user?.role === 'user' || 'admin';

  // === ORDERS STATE ===
  const { orders, loadingOrders } = useAppSelector((s) => s.orders);

  const [step, setStep] = useState<'cart' | 'qr'>('cart');

  // === TRAER ÓRDENES AL CARGAR ===
  useEffect(() => {
    dispatch(getAllOrders());
  }, [dispatch]);

  // === FILTRAR ÓRDENES DEL USUARIO (pagadas + misma mesa) ===
  const userPaidOrders = orders.filter((o) => {
    const isPaid = o.status === 'paid' || !!o.qrId;
    const belongsToUser = o.userId === userId;
    return isPaid && belongsToUser;
  });

  // === QR PRINCIPAL (última orden pagada) ===
  const latestOrder = userPaidOrders[0];
  const png = params.png || latestOrder?.qr?.pngDataUrl;
  const code = params.code || latestOrder?.qr?.code;
  const signature = params.signature || latestOrder?.qr?.signature;

  // === ANIMACIONES ===
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (png) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ]),
      );
      pulse.start();
    }
  }, [png]);

  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true }).start();
    }
  };
  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(bounceAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const goBack = () => {
    if (step === 'qr') {
      setStep('cart');
    } else {
      router.back();
    }
  };

  // === ESTADOS DE CARGA / ACCESO ===
  if (authLoading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
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
          <View style={styles.restricted}>
            <Ionicons name="shield-checkmark" size={60} color="#F59E0B" />
            <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
            <Text style={styles.restrictedText}>Solo usuarios pueden ver sus QR</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (loadingOrders) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#00FFAA" />
        <Text style={styles.loadingText}>Cargando tus órdenes...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.gradientBg}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* HEADER PREMIUM */}
        <View style={styles.headerGlass}>
          <Ionicons name="qr-code" size={34} color="#00FFAA" />
          <Text style={styles.title}>Tus QR de Acceso</Text>
          <Text style={styles.subtitle}>Mesa {latestOrder?.tableId || '—'}</Text>
        </View>

        {/* QR PRINCIPAL (última orden) */}
        {png && (
          <Animated.View
            style={[
              styles.qrMainWrapper,
              { transform: [{ scale: scaleAnim }, { scale: pulseAnim }] },
            ]}
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
          >
            <LinearGradient colors={['#00FFAA20', '#00AEEF30']} style={styles.qrMainGradient}>
              <View style={styles.qrMainInner}>
                <View style={styles.qrGlow} />
                <QRCode value={code || 'sin_codigo'} size={240} />
              </View>
              <View style={styles.qrInfo}>
                <Text style={styles.qrCode}>Código: {code?.slice(0, 16)}...</Text>
                <Text style={styles.qrSig}>Firma: {signature?.slice(0, 16)}...</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* LISTA DE ÓRDENES */}
        <Text style={styles.sectionTitle}>Historial de Órdenes</Text>

        <FlatList
          data={userPaidOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={56} color="#555" />
              <Text style={styles.emptyText}>No hay órdenes pagadas</Text>
              <Text style={styles.emptySub}>¡Hacé tu primer pedido!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const qrData = JSON.stringify({
              orderId: item._id,
              total: item.total,
              tableId: item.tableId,
              createdAt: item.createdAt,
              status: item.status,
            });

            return (
              <View style={styles.orderCardWrapper}>
                <ImageBackground
                  source={{ uri: 'https://i.imgur.com/8x5T7fJ.png' }}
                  imageStyle={styles.orderBgImage}
                  style={styles.orderBg}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                    style={styles.orderOverlay}
                  >
                    <View style={styles.orderHeader}>
                      <Ionicons name="receipt" size={26} color="#FAD02C" />
                      <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                    </View>

                    <View style={styles.orderInfo}>
                      <View style={styles.infoRow}>
                        <Ionicons name="cash" size={16} color="#E53170" />
                        <Text style={styles.infoText}>${item.total.toLocaleString()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="location" size={16} color="#00AEEF" />
                        <Text style={styles.infoText}>Mesa {item.tableId}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#A7A9BE" />
                        <Text style={styles.infoText}>
                          {new Date(item.createdAt!).toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.qrMiniSection}>
                      <View style={styles.qrMiniContainer}>
                        <QRCode value={qrData} size={110} />
                      </View>
                      <Text style={styles.qrReady}>QR Listo</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>
            );
          }}
        />

        {/* BOTÓN VOLVER */}
        <Animated.View style={{ transform: [{ scale: bounceAnim }], marginTop: 20 }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.replace('/')}
            style={styles.homeButton}
          >
            <LinearGradient colors={['#FAD02C', '#FF6B9D']} style={styles.homeButtonGradient}>
              <Ionicons name="home" size={20} color="#000" />
              <Text style={styles.homeButtonText}>Volver al Inicio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

// === ESTILOS MEJORADOS ===
const styles = {
  gradientBg: { flex: 1 },
  container: { flex: 1, padding: 20, paddingTop: 50 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8B5CF6', marginTop: 16, fontSize: 18, fontWeight: '600' },

  // ACCESO RESTRINGIDO
  restricted: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  restrictedTitle: { fontSize: 26, fontWeight: '900', color: '#F59E0B', marginTop: 16 },
  restrictedText: { fontSize: 16, color: '#A7A9BE', textAlign: 'center', marginTop: 8 },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  headerGlass: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
    }),
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#00FFAA',
    letterSpacing: 1.2,
    textShadowColor: '#00FFAA60',
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#A7A9BE',
    marginTop: 6,
    fontWeight: '600',
  },

  qrMainWrapper: { marginBottom: 36, alignItems: 'center' },
  qrMainGradient: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#00FFAA40',
  },
  qrMainInner: {
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  qrGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 30,
    backgroundColor: '#00FFAA30',
    shadowColor: '#00FFAA',
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 25,
  },
  qrInfo: { marginTop: 16, alignItems: 'center' },
  qrCode: { fontSize: 13, color: '#00FFAA', fontFamily: 'monospace', fontWeight: '700' },
  qrSig: { fontSize: 11, color: '#888', fontFamily: 'monospace', marginTop: 2 },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FAD02C',
    textAlign: 'center',
    marginBottom: 18,
    textShadowColor: '#FAD02C60',
    textShadowRadius: 10,
  },

  list: { paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 50, padding: 30 },
  emptyText: { fontSize: 18, color: '#888', marginTop: 14, fontWeight: '600' },
  emptySub: { fontSize: 14, color: '#666', marginTop: 6 },

  orderCardWrapper: {
    marginVertical: 12,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  orderBg: { borderRadius: 22 },
  orderBgImage: { opacity: 0.1, resizeMode: 'cover' },
  orderOverlay: { padding: 20 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  orderId: { fontSize: 18, fontWeight: '900', color: '#FAD02C', letterSpacing: 1.5 },

  orderInfo: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  infoText: { fontSize: 15, color: '#F5F5F5', fontWeight: '600' },

  qrMiniSection: { alignItems: 'center' },
  qrMiniContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00FFAA40',
  },
  qrReady: { marginTop: 10, fontSize: 14, color: '#00FFAA', fontWeight: '800' },

  homeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#FAD02C',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
  },
  homeButtonText: { fontSize: 18, fontWeight: '800', color: '#000' },
} as const;
