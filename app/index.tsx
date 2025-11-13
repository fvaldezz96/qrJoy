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

import { useAppDispatch, useAppSelector } from '../src/hook';
import { loginThunk, logout } from '../src/store/slices/authSlice';

const logo = require('../src/assets/logo-joywine-removebg-preview.png');
const { width } = Dimensions.get('window');

const isWeb = Platform.OS === 'web';
const isSmall = width < 380;

// === ANIMATED CARD ===
function AnimatedCard({
  href,
  children,
  gradient,
  iconColor,
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  gradient: string[];
  iconColor: string;
  large?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Link href={href} style={{ flex: 1 }}>
      <Animated.View
        onMouseEnter={isWeb ? handlePressIn : undefined}
        onMouseLeave={isWeb ? handlePressOut : undefined}
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
  { href: '/(user)/my-tickets', icon: 'ticket', color: '#00AEEF', label: 'Entradas' },
];

const ADMIN_CARDS = [
  { href: '/(admin)/dashboard', icon: 'stats-chart', color: '#FF6B9D', label: 'Dashboard' },
  { href: '/(admin)/orders-screen', icon: 'list', color: '#4FC3F7', label: 'Pedidos' },
  { href: '/(admin)/qr-scanner', icon: 'scan', color: '#FFD700', label: 'Escanear' },
];

export default function Home() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('valdezfede21@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogin = async () => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      setModalVisible(false);
      Toast.show({ type: 'success', text1: '¡Bienvenido!', text2: user?.name || email });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Credenciales inválidas' });
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
        {/* HEADER CENTRADO */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>JOYWINE</Text>
          <Text style={styles.season}>• Temporada Verano 2026 •</Text>

          {/* AVATAR */}
          <TouchableOpacity style={styles.avatarButton} onPress={user ? toggleMenu : openLogin}>
            {user ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
              </View>
            ) : (
              <Ionicons name="person-circle-outline" size={42} color="#8B5CF6" />
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
        {!isAdmin && (
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
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Usuario</Text>
            <View style={styles.grid}>
              {USER_CARDS.map((card) => (
                <AnimatedCard
                  key={card.href}
                  href={card.href}
                  gradient={[card.color + '40', card.color + '80']}
                  iconColor={card.color}
                >
                  <Ionicons name={card.icon as any} size={32} color={card.color} />
                  <Text style={[styles.cardText, { color: card.color }]}>{card.label}</Text>
                </AnimatedCard>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Admin</Text>
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
                    color={card.color === '#FFD700' ? '#000' : '#fff'}
                  />
                  <Text
                    style={[
                      styles.cardTextWhite,
                      { color: card.color === '#FFD700' ? '#000' : '#fff' },
                    ]}
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
            <Text style={styles.modalTitle}>Iniciar Sesión</Text>
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
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 32,
    position: 'relative',
    width: '100%',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#FAD02C',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FAD02C',
    letterSpacing: 2,
    marginTop: 12,
    textShadowColor: '#FAD02C60',
    textShadowRadius: 12,
  },
  season: {
    fontSize: 15,
    color: '#A7A9BE',
    marginTop: 8,
    fontStyle: 'italic',
  },
  avatarButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
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
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 16,
    width: 260,
    elevation: 25,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 100,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' },
    }),
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  menuName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  menuEmail: { color: '#A7A9BE', fontSize: 13 },
  roleBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  adminBadge: { backgroundColor: '#8B5CF6' },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  menuItemText: { color: '#FF3B30', fontWeight: '600' },

  // SECCIONES
  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FAD02C',
    marginTop: 32,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: '#FAD02C50',
    textShadowRadius: 12,
  },

  // GRIDS
  userGrid: {
    width: '100%',
    maxWidth: 400,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
    width: '100%',
    maxWidth: 500,
  },

  // CARDS
  cardWrapper: {
    width: '100%',
    minWidth: 140,
    maxWidth: 160,
    flex: 1,
  },
  cardLarge: {
    minWidth: 280,
    maxWidth: 320,
  },
  cardGradient: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardInner: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconCircle: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.4,
  },
  iconGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  cardText: { fontSize: 16, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  cardTextLarge: { fontSize: 24, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  cardTextWhite: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    color: '#fff',
    textAlign: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1A1A2E',
    padding: 32,
    borderRadius: 28,
    width: '88%',
    maxWidth: 380,
    gap: 18,
    elevation: 25,
    alignItems: 'center',
  },
  modalIcon: { marginBottom: 8 },
  modalTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  input: {
    backgroundColor: '#2A2A3E',
    color: '#fff',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  loginBtn: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  cancelText: { color: '#8B5CF6', textAlign: 'center', fontWeight: '600', marginTop: 8 },

  // FOOTER
  footer: {
    marginTop: 60,
    paddingVertical: 24,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
