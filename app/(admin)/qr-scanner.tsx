import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { type BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { redeemQr } from '../../src/store/slices/adminSlice';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(width * 0.7, 280);
const isWeb = Platform.OS === 'web';

export default function QrScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastOrder, setLastOrder] = useState<
    | {
      id: string;
      total: number;
      status: string;
      items: { productId: string; name: string; qty: number; price: number; subtotal: number }[];
    }
    | null
  >(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  // Helper to extract role safely (handles string or object from population)
  const getRoleName = (u: typeof user) => {
    if (!u || !u.role) return 'guest';
    if (typeof u.role === 'string') return u.role;
    // @ts-ignore - Handle populated role object
    return u.role.type || u.role.name || 'guest';
  };

  const userRole = getRoleName(user);
  const isStaff = userRole === 'admin' || userRole === 'employee';

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [scanLineAnim]);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission]);

  const playSound = async (type: 'success' | 'error') => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        type === 'success'
          ? require('../../assets/success.mp3')
          : require('../../assets/error.mp3'),
      );
      setSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.log('Sound error:', e);
      // Fallback: solo vibración si el audio falla
    }
  };

  const vibrate = (type: 'success' | 'error') => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const triggerResult = (type: 'success' | 'error') => {
    setStatus(type);
    vibrate(type);
    playSound(type);

    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.1, friction: 4, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setStatus('idle');
      setScanned(false);
    }, 1500);
  };

  const onScan = async ({ data }: BarcodeScanningResult) => {
    if (scanned || status !== 'idle') return;
    setScanned(true);
    setStatus('scanning');

    try {
      const payload = JSON.parse(data) as { c: string; s: string };
      const res = await dispatch(redeemQr({ code: payload.c, signature: payload.s })).unwrap();

      // Check if it's an order or a different kind of ticket
      const { redeemed, qr, order } = res.data;

      if (redeemed) {
        setLastOrder(order);
        triggerResult('success');
      } else {
        throw new Error('NOT_REDEEMED');
      }
    } catch (e: any) {
      setLastOrder(null);
      triggerResult('error');
    }
  };

  if (!isStaff) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Ionicons name="shield-checkmark" size={64} color="#FAD02C" />
        <Text style={styles.permissionTitle}>Solo personal autorizado</Text>
        <Text style={styles.permissionText}>Iniciá sesión como admin o empleado para usar el escáner.</Text>
      </LinearGradient>
    );
  }

  if (isWeb) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Ionicons name="desktop-outline" size={70} color="#FAD02C" />
        <Text style={styles.permissionTitle}>Disponible solo en la app móvil</Text>
        <Text style={styles.permissionText}>
          El escáner QR requiere acceso directo a la cámara nativa.
        </Text>
      </LinearGradient>
    );
  }

  if (!permission) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <ActivityIndicator size="large" color="#FAD02C" />
        <Text style={styles.loadingText}>Inicializando cámara...</Text>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <View style={styles.permissionBox}>
          <Ionicons name="videocam-off" size={60} color="#E53170" />
          <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
          {/* <Text style={styles.permissionText}>Escanea QR para validar entradas</Text> */}
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient colors={['#FAD02C', '#FF6B9D']} style={styles.permissionButtonGradient}>
              <Ionicons name="camera" size={20} color="#000" />
              <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScan}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Ionicons name="scan" size={32} color="#FAD02C" />
          <Text style={styles.title}>Escáner QR</Text>
          <Text style={styles.subtitle}>Apunta al código de entrada</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-SCAN_AREA_SIZE / 2, SCAN_AREA_SIZE / 2],
                    }),
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.resultGlow,
              {
                opacity: glowAnim,
                backgroundColor: status === 'success' ? '#00FF8830' : '#E5317030',
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
        </View>

        <View style={styles.statusContainer}>
          {status === 'idle' && <Text style={styles.statusText}>Listo para escanear</Text>}
          {status === 'scanning' && <Text style={styles.statusText}>Validando...</Text>}
          {status === 'success' && (
            <>
              <Text style={[styles.statusText, { color: '#00FF88' }]}>QR válido</Text>
              {!lastOrder && (
                <Text style={styles.successSubText}>Ingreso o Ticket validado correctamente.</Text>
              )}
              {lastOrder && (
                <View style={styles.orderBox}>
                  <Text style={styles.orderTitle}>Detalle del pedido</Text>
                  {lastOrder.items.map((it) => (
                    <Text key={it.productId} style={styles.orderItem}>
                      {it.qty} x {it.name} (${it.subtotal})
                    </Text>
                  ))}
                  <Text style={styles.orderTotal}>Total: ${lastOrder.total}</Text>
                </View>
              )}
            </>
          )}
          {status === 'error' && (
            <Text style={[styles.statusText, { color: '#E53170' }]}>QR inválido o sin pedido</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: 'rgba(15, 14, 23, 0.7)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FAD02C', marginTop: 16, fontSize: 16, fontWeight: '600' },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAD02C',
    letterSpacing: 1,
    textShadowColor: '#FAD02C60',
    textShadowRadius: 12,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A7A9BE',
    marginTop: 6,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 40,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderColor: '#00FFAA',
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderColor: '#00FFAA',
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderColor: '#00FFAA',
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderColor: '#00FFAA',
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00FFAA',
    shadowColor: '#00FFAA',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  resultGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  statusContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAD02C',
    textShadowColor: '#FAD02C50',
    textShadowRadius: 8,
  },
  successSubText: {
    color: '#00FF88',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    width: '100%',
  },
  orderTitle: {
    color: '#E5E7EB',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  orderItem: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  orderTotal: {
    marginTop: 6,
    color: '#FCD34D',
    fontWeight: '800',
    textAlign: 'right',
  },
  permissionBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    }),
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAD02C',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#A7A9BE',
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
} as const;
