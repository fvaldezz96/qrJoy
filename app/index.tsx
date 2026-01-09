// JOYWINE Login System - Fixed for Railway deployment
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
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
const { width } = Dimensions.get('window');

const isWeb = Platform.OS === 'web';
const isSmall = width < 380;

// === ANIMATED CARD ===
type GradientPair = readonly [string, string];

function AnimatedCard({
  href,
  children,
  gradient,
  iconColor,
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  gradient: GradientPair;
  iconColor: string;
  large?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const hoverProps = isWeb
    ? ({ onMouseEnter: handlePressIn, onMouseLeave: handlePressOut } as any)
    : undefined;

  return (
    <Link href={href} style={{ flex: 1 }}>
      <Animated.View
        {...(hoverProps || {})}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.cardWrapper,
          large && styles.cardLarge,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            {children}
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '30' }]}>
              <View style={[styles.iconGlow, { shadowColor: iconColor }]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Link>
  );
}

// === CARDS DATA ===
const USER_CARDS = [
  { href: '/(user)/products', icon: 'restaurant', color: '#FAD02C', label: 'Carta' },
  { href: '/(user)/my-qr', icon: 'qr-code', color: '#E53170', label: 'Ordenes' },
  // { href: '/(user)/my-tickets', icon: 'ticket', color: '#00AEEF', label: 'Entradas' },
] as const;

const STAFF_CARDS = [
  { href: '/(admin)/comandas', icon: 'fast-food', color: '#34D399', label: 'Comandas' },
  { href: '/(admin)/qr-scanner', icon: 'scan', color: '#FFD700', label: 'Escanear QR' },
  { href: '/(admin)/tables', icon: 'restaurant', color: '#F97316', label: 'Mesas' },
] as const;

const ADMIN_CARDS = [
  { href: '/(admin)/dashboard', icon: 'stats-chart', color: '#FF6B9D', label: 'Dashboard' },
  { href: '/(admin)/orders-screen', icon: 'list', color: '#4FC3F7', label: 'Pedidos' },
  { href: '/(admin)/products', icon: 'pricetag', color: '#10B981', label: 'Productos' },
] as const;

export default function Home() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'employee';

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Google OAuth (Fallbacks to prevent crash)
  const [_request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web-id',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios-id',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-id',
  });

  const handleLogin = async () => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      setModalVisible(false);
      Toast.show({ type: 'success', text1: '¡Bienvenido!', text2: user?.name || email });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Credenciales inválidas' });
    }
  };

  const handleGoogleLogin = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Toast.show({ type: 'info', text1: 'Google Auth', text2: 'No configurado en este ambiente' });
      return;
    }
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) {
        await dispatch(loginWithGoogleThunk(result.params.id_token)).unwrap();
        setModalVisible(false);
        Toast.show({ type: 'success', text1: '¡Bienvenido!', text2: 'Sesión iniciada con Google' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.message || 'No se pudo iniciar con Google' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setMenuVisible(false);
    Toast.show({ type: 'info', text1: 'Sesión cerrada' });
  };

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const openLogin = () => {
    setModalVisible(true);
    setMenuVisible(false);
  };

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.gradientBg}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>JOYWINE</Text>
          <Text style={styles.season}>• Summer Season 2026 •</Text>

          {/* AVATAR / LOGIN */}
          <TouchableOpacity style={styles.avatarButton} onPress={user ? toggleMenu : openLogin}>
            {user ? (
              <LinearGradient colors={['#8B5CF6', '#D946EF']} style={styles.avatar}>
                <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.loginGhostBtn}>
                <Ionicons name="person-outline" size={24} color="#8B5CF6" />
                <Text style={styles.loginGhostText}>Entrar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* MENÚ DESPLEGABLE */}
        {menuVisible && (
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>{user?.email[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.menuName}>{user?.name || 'Usuario'}</Text>
                <Text style={styles.menuEmail}>{user?.email}</Text>
                <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
                  <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.menuItemText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === USER: 3 CARDS EN COLUMNA === */}
        {!isStaff && (
          <>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <View style={styles.userGrid}>
              {USER_CARDS.map((card) => (
                <AnimatedCard
                  key={card.href}
                  href={card.href}
                  gradient={[card.color + '40', card.color + '80']}
                  iconColor={card.color}
                  large
                >
                  <Ionicons name={card.icon as any} size={48} color={card.color} />
                  <Text style={[styles.cardTextLarge, { color: card.color }]}>{card.label}</Text>
                </AnimatedCard>
              ))}
            </View>
          </>
        )}

        {/* === ADMIN: 6 CARDS EN GRID === */}
        {isStaff && (
          <>
            <Text style={styles.sectionTitle}>{isAdmin ? 'Operaciones' : 'Equipo'}</Text>
            <View style={styles.grid}>
              {STAFF_CARDS.map((card) => (
                <AnimatedCard
                  key={card.href}
                  href={card.href}
                  gradient={[card.color + '40', card.color + '80']}
                  iconColor={card.color}
                >
                  <Ionicons
                    name={card.icon as any}
                    size={28}
                    color="#fff"
                  />
                  <Text
                    style={styles.cardTextWhite}
                  >
                    {card.label}
                  </Text>
                </AnimatedCard>
              ))}
            </View>
          </>
        )}

        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Administración</Text>
            <View style={styles.grid}>
              {ADMIN_CARDS.map((card) => (
                <AnimatedCard
                  key={card.href}
                  href={card.href}
                  gradient={[card.color + '40', card.color + '80']}
                  iconColor={card.color}
                >
                  <Ionicons
                    name={card.icon as any}
                    size={28}
                    color="#fff"
                  />
                  <Text
                    style={styles.cardTextWhite}
                  >
                    {card.label}
                  </Text>
                </AnimatedCard>
              ))}
            </View>
          </>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 JOYWINE • Todos los derechos reservados</Text>
        </View>
      </ScrollView>

      {/* MODAL LOGIN */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Ionicons name="lock-closed" size={48} color="#8B5CF6" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Joy Wine</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#666"
            />
            <TextInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continuar con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón Google */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.googleBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerText}>¿No tenés cuenta? Crear cuenta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Modal>
      <Toast />
    </LinearGradient>
  );
}

// === ESTILOS MEJORADOS ===
const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: isSmall ? 16 : 24,
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
    width: '100%',
  },
  logoContainer: {
    padding: 12,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 50,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowRadius: 15,
  },
  season: {
    fontSize: 16,
    color: '#8B5CF6',
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  avatarButton: {
    position: 'absolute',
    top: -10,
    right: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 10,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  loginGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 8,
  },
  loginGhostText: { color: '#8B5CF6', fontWeight: '700', fontSize: 14 },

  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: { color: '#fff', fontWeight: '800', fontSize: 18 },

  // MENÚ
  menu: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 24,
    padding: 20,
    width: 280,
    elevation: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  menuName: { color: '#fff', fontWeight: '800', fontSize: 18 },
  menuEmail: { color: '#A7A9BE', fontSize: 14 },
  roleBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  adminBadge: { backgroundColor: '#8B5CF6' },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  menuItemText: { color: '#FF3B30', fontWeight: '700', fontSize: 16 },

  // SECCIONES
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAD02C',
    marginTop: 40,
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(250, 208, 44, 0.3)',
    textShadowRadius: 10,
  },

  // GRIDS
  userGrid: {
    width: '100%',
    maxWidth: 450,
    gap: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
    width: '100%',
    maxWidth: 600,
  },

  // CARDS
  cardWrapper: {
    width: '100%',
    minWidth: 150,
    maxWidth: 180,
    flex: 1,
  },
  cardLarge: {
    minWidth: '100%',
    maxWidth: 400,
  },
  cardGradient: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardInner: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 120,
  },
  iconCircle: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 20,
  },
  cardText: { fontSize: 18, fontWeight: '800', marginTop: 12, color: '#fff' },
  cardTextLarge: { fontSize: 28, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  cardTextWhite: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
    color: '#fff',
    textAlign: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1A1A2E',
    padding: 32,
    borderRadius: 32,
    width: '90%',
    maxWidth: 400,
    gap: 20,
    elevation: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  modalIcon: { marginBottom: 8 },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    padding: 18,
    borderRadius: 16,
    fontSize: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginBtn: {
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(219, 68, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(219, 68, 55, 0.4)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    gap: 12,
  },
  googleBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  cancelText: { color: '#8B5CF6', textAlign: 'center', fontWeight: '700', marginTop: 12, fontSize: 16 },
  registerText: {
    color: '#FAD02C',
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 16,
    fontSize: 15,
  },

  // FOOTER
  footer: {
    marginTop: 80,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
