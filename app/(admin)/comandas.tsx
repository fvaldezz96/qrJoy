import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import {
  Comanda,
  ComandaStation,
  ComandaStatus,
  fetchComandas,
  updateComandaStatus,
} from '../../src/store/slices/comandasSlice';

const stations: { label: string; value?: ComandaStation }[] = [
  { label: 'Todas', value: undefined },
  { label: 'Bar', value: 'bar' },
  { label: 'Cocina', value: 'kitchen' },
];

const statuses: { label: string; value?: ComandaStatus }[] = [
  { label: 'Todas', value: undefined },
  { label: 'En cola', value: 'queued' },
  { label: 'En curso', value: 'in_progress' },
  { label: 'Servidas', value: 'served' },
];

const statusConfig: Record<ComandaStatus, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  queued: { color: '#F59E0B', label: 'En cola', icon: 'time' },
  in_progress: { color: '#60A5FA', label: 'En curso', icon: 'flame' },
  served: { color: '#34D399', label: 'Servida', icon: 'checkmark-circle' },
  cancelled: { color: '#EF4444', label: 'Cancelada', icon: 'close-circle' },
};

function ComandaCard({ comanda, onUpdate }: { comanda: Comanda; onUpdate: (status: ComandaStatus) => void }) {
  const cfg = statusConfig[comanda.status];

  const renderActions = () => {
    if (comanda.status === 'served' || comanda.status === 'cancelled') return null;
    return (
      <View style={styles.actionsRow}>
        {comanda.status === 'queued' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionInfo]} onPress={() => onUpdate('in_progress')}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.actionText}>Iniciar</Text>
          </TouchableOpacity>
        )}
        {comanda.status === 'in_progress' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionSuccess]} onPress={() => onUpdate('served')}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionText}>Servido</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => onUpdate('cancelled')}>
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.actionText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#1f1f2e', '#171522']} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardLabel}>Orden #{comanda.orderId.slice(-6).toUpperCase()}</Text>
          <Text style={styles.cardSub}>Estación: {comanda.station === 'bar' ? 'Barra' : 'Cocina'}</Text>
          {typeof comanda.tableNumber === 'number' && (
            <Text style={styles.cardSub}>Mesa: {comanda.tableNumber}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
          <Ionicons name={cfg.icon} size={16} color={cfg.color} />
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {comanda.qrCode && (
        <Text style={styles.qrCode}>QR: {comanda.qrCode.slice(0, 8)}…</Text>
      )}

      <View style={styles.itemsBox}>
        {comanda.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {item.qty}× {(item.productId as any)?.name || 'Producto'}
            </Text>
            {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
          </View>
        ))}
      </View>

      {renderActions()}
    </LinearGradient>
  );
}

export default function ComandasScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading, error } = useAppSelector((s) => s.comandas);
  const { user } = useAppSelector((s) => s.auth);
  const isStaff = user?.role === 'admin' || user?.role === 'employee';

  const [selectedStation, setSelectedStation] = useState<ComandaStation | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<ComandaStatus | undefined>('queued');
  const [refreshing, setRefreshing] = useState(false);

  const filters = useMemo(
    () => ({ station: selectedStation, status: selectedStatus }),
    [selectedStation, selectedStatus],
  );

  useEffect(() => {
    dispatch(fetchComandas(filters));
  }, [dispatch, filters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchComandas(filters)).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, filters]);

  const handleUpdate = useCallback(
    async (id: string, status: ComandaStatus) => {
      await dispatch(updateComandaStatus({ id, status }));
      await dispatch(fetchComandas(filters));
    },
    [dispatch, filters],
  );

  if (!isStaff) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Text style={styles.restricted}>Solo personal autorizado</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.screen}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Comandas en curso</Text>
          <Text style={styles.subtitle}>Controlá pedidos pagados y QR activos</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Estación</Text>
          <View style={styles.filterChips}>
            {stations.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.chip,
                  selectedStation === opt.value && styles.chipActive,
                  opt.value === undefined && selectedStation === undefined && styles.chipActive,
                ]}
                onPress={() => setSelectedStation(opt.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedStation === opt.value && styles.chipTextActive,
                    opt.value === undefined && selectedStation === undefined && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Estado</Text>
          <View style={styles.filterChips}>
            {statuses.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.chip,
                  selectedStatus === opt.value && styles.chipActive,
                  opt.value === undefined && selectedStatus === undefined && styles.chipActive,
                ]}
                onPress={() => setSelectedStatus(opt.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedStatus === opt.value && styles.chipTextActive,
                    opt.value === undefined && selectedStatus === undefined && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {loading && !items.length ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FAD02C" size="large" />
          <Text style={styles.loadingText}>Cargando comandas…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={56} color="#6B7280" />
              <Text style={styles.emptyText}>No hay comandas para los filtros seleccionados</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ComandaCard comanda={item} onUpdate={(status) => handleUpdate(item._id, status)} />
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  restricted: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#A7A9BE', fontSize: 14 },
  filtersRow: { gap: 16, marginBottom: 12 },
  filterGroup: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12 },
  filterLabel: { color: '#A7A9BE', marginBottom: 8, fontWeight: '600' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: { backgroundColor: '#FAD02C33', borderColor: '#FAD02C' },
  chipText: { color: '#A7A9BE', fontWeight: '600' },
  chipTextActive: { color: '#FAD02C' },
  list: { paddingBottom: 60 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardSub: { color: '#A7A9BE', fontSize: 13 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  statusBadgeText: { fontWeight: '700' },
  qrCode: { color: '#FAD02C', fontSize: 12, marginBottom: 10 },
  itemsBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, marginBottom: 12 },
  itemRow: { marginBottom: 6 },
  itemText: { color: '#fff', fontWeight: '600' },
  itemNote: { color: '#F87171', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  actionText: { color: '#fff', fontWeight: '700' },
  actionInfo: { backgroundColor: '#3B82F6' },
  actionSuccess: { backgroundColor: '#10B981' },
  actionDanger: { backgroundColor: '#EF4444' },
  loadingText: { color: '#fff', marginTop: 12, fontWeight: '600' },
  errorText: { color: '#EF4444', marginTop: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#A7A9BE', marginTop: 12, textAlign: 'center' },
});
