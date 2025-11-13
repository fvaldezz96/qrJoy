import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, ScrollView, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { fetchMetrics } from '../../src/store/slices/adminSlice';

// === INTERFACES ===
// interface OrdersMetrics {
//   total: number;
//   paid: number;
//   pending: number;
//   revenue: number;
// }
// interface ProductsMetrics {
//   active: number;
//   outOfStock: number;
// }
// interface TicketsMetrics {
//   total: number;
//   used: number;
//   unused: number;
//   revenue: number;
// }
// interface QrMetrics {
//   totalGenerated: number;
//   used: number;
// }
// interface DashboardMetrics {
//   orders: OrdersMetrics;
//   products: ProductsMetrics;
//   tickets: TicketsMetrics;
//   qrs: QrMetrics;
// }

// === COMPONENTE MÉTRICA ANIMADA ===
function AnimatedMetric({
  label,
  value,
  icon,
  gradient,
  iconColor,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  iconColor: string;
  delay?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.metricCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.metricGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.metricInner}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '30' }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
            <View style={[styles.iconGlow, { shadowColor: iconColor }]} />
          </View>
          <View style={styles.metricText}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// === DASHBOARD PRINCIPAL ===
export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { metrics, loading, error } = useAppSelector((s) => s.admin);

  useEffect(() => {
    dispatch(fetchMetrics());
  }, [dispatch]);

  if (loading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <ActivityIndicator size="large" color="#FAD02C" />
        <Text style={styles.loadingText}>Cargando métricas...</Text>
      </LinearGradient>
    );
  }

  if (error || !metrics) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Ionicons name="alert-circle" size={60} color="#E53170" />
        <Text style={styles.errorText}>{error || 'Error al cargar métricas'}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.gradientBg}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Glass */}
        <View style={styles.headerGlass}>
          <Ionicons name="stats-chart" size={36} color="#FAD02C" />
          <Text style={styles.title}>Panel de Control</Text>
          <Text style={styles.subtitle}>JoyPark • Verano 2025</Text>
        </View>

        {/* Grid de Métricas */}
        <View style={styles.grid}>
          {/* ÓRDENES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Órdenes</Text>
            <View style={styles.metricsGrid}>
              <AnimatedMetric
                label="Total"
                value={metrics.orders.total}
                icon="cart"
                gradient={['#3D0B2C', '#E53170']}
                iconColor="#FF6B9D"
                delay={100}
              />
              <AnimatedMetric
                label="Pagadas"
                value={metrics.orders.paid}
                icon="checkmark-circle"
                gradient={['#0B3D5C', '#00AEEF']}
                iconColor="#4FC3F7"
                delay={200}
              />
              <AnimatedMetric
                label="Pendientes"
                value={metrics.orders.pending}
                icon="time"
                gradient={['#3D3D0B', '#FAD02C']}
                iconColor="#FFD700"
                delay={300}
              />
              <AnimatedMetric
                label="Ingresos"
                value={`$${metrics.orders.revenue.toLocaleString()}`}
                icon="cash"
                gradient={['#1E3D0B', '#00FF88']}
                iconColor="#00FF88"
                delay={400}
              />
            </View>
          </View>

          {/* TICKETS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entradas</Text>
            <View style={styles.metricsGrid}>
              <AnimatedMetric
                label="Total"
                value={metrics.tickets.total}
                icon="ticket"
                gradient={['#2A1B3D', '#E53170']}
                iconColor="#FF6B9D"
                delay={100}
              />
              <AnimatedMetric
                label="Usadas"
                value={metrics.tickets.used}
                icon="checkmark-done"
                gradient={['#0F2B4A', '#00AEEF']}
                iconColor="#4FC3F7"
                delay={200}
              />
              <AnimatedMetric
                label="Sin usar"
                value={metrics.tickets.unused}
                icon="close-circle"
                gradient={['#3D3D0B', '#FAD02C']}
                iconColor="#FFD700"
                delay={300}
              />
              <AnimatedMetric
                label="Recaudación"
                value={`$${metrics.tickets.revenue.toLocaleString()}`}
                icon="trending-up"
                gradient={['#1E3D0B', '#00FF88']}
                iconColor="#00FF88"
                delay={400}
              />
            </View>
          </View>

          {/* PRODUCTOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <View style={styles.metricsGrid}>
              <AnimatedMetric
                label="Activos"
                value={metrics.products.active}
                icon="cube"
                gradient={['#0B3D5C', '#00AEEF']}
                iconColor="#4FC3F7"
                delay={100}
              />
              <AnimatedMetric
                label="Sin stock"
                value={metrics.products.outOfStock}
                icon="alert-circle"
                gradient={['#3D0B2C', '#E53170']}
                iconColor="#FF6B9D"
                delay={200}
              />
            </View>
          </View>

          {/* QR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Códigos QR</Text>
            <View style={styles.metricsGrid}>
              <AnimatedMetric
                label="Generados"
                value={metrics.qrs.totalGenerated}
                icon="qr-code"
                gradient={['#1E3D0B', '#00FF88']}
                iconColor="#00FFAA"
                delay={100}
              />
              <AnimatedMetric
                label="Usados"
                value={metrics.qrs.used}
                icon="scan"
                gradient={['#3D3D0B', '#FAD02C']}
                iconColor="#FFD700"
                delay={200}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Actualizado en tiempo real</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// === ESTILOS ===
const styles = {
  gradientBg: { flex: 1 },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FAD02C', marginTop: 16, fontSize: 16, fontWeight: '600' },
  errorText: { color: '#E53170', marginTop: 16, fontSize: 16, fontWeight: '600' },
  headerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    background: 'linear-gradient(to right, #FAD02C, #00FFAA)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A7A9BE',
    marginTop: 6,
    fontWeight: '500',
  },
  grid: { gap: 20 },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAD02C',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: '#FAD02C60',
    textShadowRadius: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  metricGradient: { padding: 2 },
  metricInner: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  metricText: { flex: 1 },
  metricLabel: {
    fontSize: 13,
    color: '#A7A9BE',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
} as const;
