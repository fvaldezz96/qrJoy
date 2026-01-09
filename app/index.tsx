import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { useAppDispatch, useAppSelector } from '../src/hook';
import { loginThunk, loginWithGoogleThunk, logout } from '../src/store/slices/authSlice';
import logo from '../assets/IMG_1459.png';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1200;
const isDesktop = width >= 1200;

export default function Home() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'employee';

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const [_request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy',
  });

  const handleLogin = async () => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      setModalVisible(false);
      Toast.show({ type: 'success', text1: 'Acceso concedido', text2: `Bienvenido ${user?.name || email}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Acceso denegado', text2: 'Credenciales inválidas' });
    }
  };

  const handleGoogleLogin = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Toast.show({ type: 'info', text1: 'Google', text2: 'No disponible en este entorno' });
      return;
    }
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) {
        await dispatch(loginWithGoogleThunk(result.params.id_token)).unwrap();
        setModalVisible(false);
        Toast.show({ type: 'success', text1: 'Login con Google', text2: 'Sesión iniciada' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo iniciar con Google' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setMenuVisible(false);
    Toast.show({ type: 'info', text1: 'Hasta pronto' });
  };

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const openLogin = () => {
    setModalVisible(true);
    setMenuVisible(false);
  };

  return (
    <LinearGradient colors={['#0a001f', '#1a0033', '#2d0055']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoGlow}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>JOYWINE</Text>
          <Text style={styles.subtitle}>NIGHTCLUB • SUMMER 2026</Text>

          {/* USER AVATAR / LOGIN */}
          <TouchableOpacity style={styles.userButton} onPress={user ? toggleMenu : openLogin}>
            {user ? (
              <LinearGradient colors={['#ff00aa', '#aa00ff']} style={styles.avatar}>
                <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.loginBtn}>
                <Ionicons name="person-outline" size={20} color="#e0aaff" />
                <Text style={styles.loginText}>VIP ACCESS</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* USER MENU DROPDOWN */}
        {menuVisible && (
          <Animated.View style={[styles.userMenu, isDesktop && styles.userMenuDesktop]}>
            <View style={styles.menuHeader}>
              <LinearGradient colors={['#ff00aa', '#aa00ff']} style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>{user?.email[0].toUpperCase()}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.menuName}>{user?.name || 'VIP Guest'}</Text>
                <Text style={styles.menuEmail}>{user?.email}</Text>
                <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
                  <Text style={styles.roleText}>{(user?.role || 'guest').toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#ff3366" />
              <Text style={styles.menuItemText}>Salir</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* GUEST SECTION */}
        {!isStaff && (
          <>
            <Text style={styles.sectionTitle}>EXPERIENCIA VIP</Text>
            <View style={[styles.guestGrid, isTablet && styles.guestGridTablet, isDesktop && styles.guestGridDesktop]}>
              {[
                { href: '/(user)/products', icon: 'wine', color: '#ff3366', label: 'BOTELLAS & CARTA' },
                { href: '/(user)/my-qr', icon: 'qr-code', color: '#00ffff', label: 'RESERVAS & QR' },
                { href: '/(user)/events', icon: 'musical-notes', color: '#ffaa00', label: 'EVENTOS HOY' },
              ].map((card) => (
                <NeonCard key={card.href} href={card.href} color={card.color} icon={card.icon} label={card.label} />
              ))}
            </View>
          </>
        )}

        {/* STAFF SECTION */}
        {isStaff && (
          <>
            <Text style={styles.sectionTitle}>{isAdmin ? 'CONTROL CENTRAL' : 'OPERACIONES'}</Text>
            <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
              {[
                { href: '/(admin)/comandas', icon: 'fast-food-outline', color: '#00ffaa' },
                { href: '/(admin)/qr-scanner', icon: 'scan-outline', color: '#ffff00' },
                { href: '/(admin)/tables', icon: 'grid-outline', color: '#ff6600' },
                { href: '/(admin)/vip-list', icon: 'star-outline', color: '#ff00ff' },
              ].map((card) => (
                <NeonCard key={card.href} href={card.href} color={card.color} icon={card.icon} label={card.label || ''} small />
              ))}
            </View>
          </>
        )}

        {/* ADMIN SECTION */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>ADMINISTRACIÓN</Text>
            <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
              {[
                { href: '/(admin)/dashboard', icon: 'trending-up-outline', color: '#ff3399' },
                { href: '/(admin)/orders-screen', icon: 'receipt-outline', color: '#33ccff' },
                { href: '/(admin)/products', icon: 'pricetag-outline', color: '#00ff88' },
                { href: '/(admin)/staff', icon: 'people-outline', color: '#aa00ff' },
              ].map((card) => (
                <NeonCard key={card.href} href={card.href} color={card.color} icon={card.icon} label={card.label || ''} small />
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 JOYWINE NIGHTCLUB • ALL RIGHTS RESERVED</Text>
          <Text style={styles.footerSub}>San Juan • Argentina</Text>
        </View>
      </ScrollView>

      {/* LOGIN MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="diamond" size={60} color="#ff00aa" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>JOYWINE</Text>
            <Text style={styles.modalSubtitle}>Acceso Exclusivo</Text>

            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
            <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>INGRESAR</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.googleText}>Continuar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerText}>¿Primera vez? Solicitar acceso VIP</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Modal>

      <Toast />
    </LinearGradient>
  );
}

// === NEON CARD COMPONENT ===
function NeonCard({ href, color, icon, label, small = false }: {
  href: string;
  color: string;
  icon: any;
  label: string;
  small?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  const animateIn = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true })
  ]).start();

  const animateOut = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 0.8, duration: 200, useNativeDriver: true })
  ]).start();

  return (
    <Link href={href} style={{ flex: small ? undefined : 1 }}>
      {isWeb ? (
        <Animated.View style={[
          styles.neonCard,
          small && styles.neonCardSmall,
          { transform: [{ scale }], opacity }
        ]}>
          <Pressable
            onPressIn={animateIn}
            onPressOut={animateOut}
            onHoverIn={isWeb ? animateIn : undefined}
            onHoverOut={isWeb ? animateOut : undefined}
            style={StyleSheet.absoluteFill}
          >
            <LinearGradient
              colors={[color + '20', color + '40']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.glowEffect, { shadowColor: color }]} />
            <Ionicons name={icon} size={small ? 36 : 56} color={color} />
            {label && <Text style={[styles.cardLabel, { color }]}>{label}</Text>}
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          onTouchStart={animateIn}
          onTouchEnd={animateOut}
          style={[
            styles.neonCard,
            small && styles.neonCardSmall,
            { transform: [{ scale }], opacity }
          ]}
        >
          <LinearGradient
            colors={[color + '20', color + '40']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.glowEffect, { shadowColor: color }]} />
          <Ionicons name={icon} size={small ? 36 : 56} color={color} />
          {label && <Text style={[styles.cardLabel, { color }]}>{label}</Text>}
        </Animated.View>
      )}
    </Link>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
    paddingTop: isMobile ? 60 : 80,
    paddingBottom: 100,
    alignItems: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: isMobile ? 40 : 60,
    width: '100%',
  },
  logoGlow: {
    padding: 16,
    borderRadius: 80,
    backgroundColor: 'rgba(170, 0, 255, 0.2)',
    shadowColor: '#aa00ff',
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 30,
    marginBottom: 20,
  },
  logo: { width: 140, height: 140 },
  title: {
    fontSize: isDesktop ? 72 : isTablet ? 60 : 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 8,
    textShadowColor: '#ff00aa',
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: isDesktop ? 20 : 16,
    color: '#e0aaff',
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 8,
  },

  userButton: {
    position: 'absolute',
    top: 0,
    right: isMobile ? 0 : 20,
  },
  avatar: {
    width: isMobile ? 56 : 64,
    height: isMobile ? 56 : 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(170, 0, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#aa00ff',
    gap: 10,
  },
  loginText: { color: '#e0aaff', fontWeight: '800', fontSize: 14 },

  userMenu: {
    position: 'absolute',
    top: isMobile ? 80 : 90,
    right: isMobile ? 16 : 20,
    backgroundColor: 'rgba(15, 0, 40, 0.95)',
    borderRadius: 24,
    padding: 20,
    width: 300,
    borderWidth: 1,
    borderColor: '#aa00ff',
    shadowColor: '#aa00ff',
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1000,
  },
  userMenuDesktop: {
    top: 100,
    right: 40,
    width: 340,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: { color: '#fff', fontSize: 24, fontWeight: '900' },
  menuName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  menuEmail: { color: '#aaa', fontSize: 14 },
  roleBadge: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 6 },
  adminBadge: { backgroundColor: '#aa00ff' },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuItemText: { color: '#ff3366', fontSize: 17, fontWeight: '700' },

  sectionTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 36,
    fontWeight: '900',
    color: '#ff00aa',
    marginVertical: 40,
    textShadowColor: '#ff00aa',
    textShadowRadius: 15,
    letterSpacing: 3,
  },

  guestGrid: {
    width: '100%',
    gap: 30,
    alignItems: 'center',
  },
  guestGridTablet: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 },
  guestGridDesktop: { maxWidth: 1200, gap: 40 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isDesktop ? 30 : 20,
    width: '100%',
    maxWidth: isDesktop ? 1100 : 800,
    marginBottom: 50,
  },
  gridDesktop: { gap: 40 },

  neonCard: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 380,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  neonCardSmall: {
    width: isDesktop ? 220 : isTablet ? 180 : 160,
    height: isDesktop ? 220 : isTablet ? 180 : 160,
  },
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  cardLabel: {
    fontSize: isMobile ? 22 : 26,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'currentColor',
    textShadowRadius: 10,
  },

  footer: {
    marginTop: 80,
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  footerText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 2,
  },
  footerSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#150030',
    padding: 40,
    borderRadius: 40,
    width: '90%',
    maxWidth: 460,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aa00ff',
    shadowColor: '#aa00ff',
    shadowRadius: 30,
    elevation: 30,
  },
  modalTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#e0aaff',
    marginBottom: 30,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    width: '100%',
    padding: 18,
    borderRadius: 20,
    marginVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#aa00ff44',
  },
  primaryBtn: {
    backgroundColor: '#aa00ff',
    width: '100%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: '#aa00ff44' },
  dividerText: { color: '#888', paddingHorizontal: 20, fontSize: 14 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285f4',
    width: '100%',
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  googleText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { color: '#888', marginTop: 20, fontSize: 16 },
  registerText: {
    color: '#ff00aa',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});