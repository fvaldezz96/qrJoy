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
import { fetchUserTickets } from '../../src/store/slices/entranceTicketsSlice';

export default function MyTickets() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // === AUTH & USER ===
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const userId = user?._id;
  const isUser = user?.role === 'user';

  // === TICKETS STATE ===
  const { entities, loading: ticketsLoading } = useAppSelector((s) => s.entranceTickets);
  const tickets = Object.values(entities);

  const [step, setStep] = useState<'cart' | 'qr'>('cart');

  // === TRAER ENTRADAS SI ES USER ===
  useEffect(() => {
    if (userId && isUser) {
      dispatch(fetchUserTickets({ userId }));
    }
  }, [userId, isUser, dispatch]);

  const goBack = () => {
    if (step === 'qr') {
      setStep('cart');
    } else {
      router.back();
    }
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
        onMouseEnter={handleHoverIn}
        onMouseLeave={handleHoverOut}
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
          <Text style={styles.title}>Tus QR de Acceso</Text>
          <Text style={styles.subtitle}>Escaneá y entrá al boliche</Text>
        </View>

        {/* BOTÓN COMPRA */}
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={buySample}
            style={styles.buyButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FAD02C', '#FF6B9D']}
              style={styles.buyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={20} color="#000" />
              <Text style={styles.buyButtonText}>Comprar Ticket (Demo)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* LISTA DE ENTRADAS */}
        <FlatList
          data={tickets}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={60} color="#555" />
              <Text style={styles.emptyText}>No tenés entradas todavía</Text>
              <Text style={styles.emptySub}>¡Comprá una y empezá la fiesta!</Text>
            </View>
          }
          renderItem={({ item }) => {
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
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.ticketOverlay}
                  >
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Ionicons name="ticket" size={28} color="#FAD02C" />
                        <Text style={styles.ticketId}>#{item._id.slice(-6).toUpperCase()}</Text>
                      </View>

                      <View style={styles.ticketInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="pricetag" size={16} color="#8B5CF6" />
                          <Text style={styles.infoText}>{item.type.toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="cash" size={16} color="#E53170" />
                          <Text style={styles.infoText}>${item.price.toLocaleString()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="time" size={16} color="#00AEEF" />
                          <Text style={styles.infoText}>Válida hasta: {fechaValida}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons
                            name={
                              item.qrId.state === 'active' ? 'checkmark-circle' : 'close-circle'
                            }
                            size={16}
                            color={item.qrId.state === 'active' ? '#00FFAA' : '#FF3B30'}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: item.qrId.state === 'active' ? '#00FFAA' : '#FF3B30' },
                            ]}
                          >
                            {item.qrId.state.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.qrSection}>
                        <QRView value={qrData} size={140} />
                        <Text style={styles.qrLabel}>Escaneá para entrar</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
                <View style={styles.perforatedLine} />
              </View>
            );
          }}
        />
      </View>
    </LinearGradient>
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
} as const;
