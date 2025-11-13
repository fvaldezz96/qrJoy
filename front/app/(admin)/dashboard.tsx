import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../../src/config';
import axios from 'axios';

interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  usedQrs: number;
  pendingOrders: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/metrics`);
      setMetrics(res.data);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#812711" />
        <Text style={{ color: '#812711', marginTop: 10 }}>Cargando métricas...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.center}>
        <Text>No se pudieron cargar las métricas.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Panel de Control - JoyPark</Text>

      <View style={styles.card}>
        <Text style={styles.label}>🧾 Total de pedidos:</Text>
        <Text style={styles.value}>{metrics.totalOrders}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>💰 Ingresos totales:</Text>
        <Text style={styles.value}>${metrics.totalRevenue.toLocaleString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>🥂 Productos activos:</Text>
        <Text style={styles.value}>{metrics.activeProducts}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>✅ QR usados:</Text>
        <Text style={styles.value}>{metrics.usedQrs}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>🕒 Pedidos pendientes:</Text>
        <Text style={styles.value}>{metrics.pendingOrders}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#812711',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#444',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#812711',
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
