import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import api from '../../src/api/client';
import { ENDPOINTS } from '../../src/config';
import { setAuthToken } from '../../src/api/setAuthToken';
import { readToken } from '../../src/utils/tokenStorage';
import { showAlert } from '../../src/utils/showAlert';
import { useAppSelector } from '../../src/hook';

interface Product {
  _id: string;
  name: string;
  category: 'drink' | 'food' | 'ticket';
  price: number;
  sku?: string;
  imageUrl?: string;
  active: boolean;
}

export default function AdminProductsScreen() {
  const router = useRouter();
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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'drink' | 'food' | 'ticket'>('drink');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockBar, setStockBar] = useState('');
  const [stockRestaurant, setStockRestaurant] = useState('');
  const [stockDoor, setStockDoor] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(ENDPOINTS.products.base, { params: { limit: 100 } });
      const items = (data?.data?.items ?? []) as Product[];
      setProducts(items);
    } catch (e: any) {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !price.trim()) return;
    const numericPrice = Number(price.replace(',', '.'));
    if (Number.isNaN(numericPrice)) return;

    try {
      setSubmitting(true);
      setError(null);
      // Aseguramos que el token esté aplicado al cliente antes de llamar al API
      const storedToken = await readToken();
      if (storedToken) {
        setAuthToken(storedToken);
      }

      const initialStock: Record<'bar' | 'restaurant' | 'door', number> = {
        bar: stockBar.trim() ? Number(stockBar) || 0 : 0,
        restaurant: stockRestaurant.trim() ? Number(stockRestaurant) || 0 : 0,
        door: stockDoor.trim() ? Number(stockDoor) || 0 : 0,
      };

      await api.post(ENDPOINTS.products.create, {
        name: name.trim(),
        category,
        price: numericPrice,
        active: true,
        sku: sku.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        initialStock,
      });
      setName('');
      setPrice('');
      setSku('');
      setImageUrl('');
      setStockBar('');
      setStockRestaurant('');
      setStockDoor('');
      await loadProducts();
    } catch (e: any) {
      setError('Error al crear producto');
      showAlert('Error', 'No se pudo crear el producto. Verificá los datos e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isStaff) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.center}>
        <Text style={styles.restricted}>Solo personal autorizado</Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.screen}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Productos</Text>
            <Text style={styles.subtitle}>Gestioná la carta y precios</Text>
          </View>
        </View>

        <View style={styles.formBox}>
          <Text style={styles.formTitle}>Nuevo producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio"
            keyboardType="decimal-pad"
            placeholderTextColor="#6B7280"
            value={price}
            onChangeText={setPrice}
          />

          <View style={styles.categoryRow}>
            <CategoryChip
              label="Bebida"
              value="drink"
              selected={category === 'drink'}
              onPress={() => setCategory('drink')}
            />
            <CategoryChip
              label="Comida"
              value="food"
              selected={category === 'food'}
              onPress={() => setCategory('food')}
            />
            <CategoryChip
              label="Ticket"
              value="ticket"
              selected={category === 'ticket'}
              onPress={() => setCategory('ticket')}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="SKU (opcional)"
            placeholderTextColor="#6B7280"
            value={sku}
            onChangeText={setSku}
          />
          <TextInput
            style={styles.input}
            placeholder="URL de imagen (opcional)"
            placeholderTextColor="#6B7280"
            value={imageUrl}
            onChangeText={setImageUrl}
          />

          <View style={styles.stockRow}>
            <View style={{ flex: 1, marginRight: 4 }}>
              <TextInput
                style={styles.input}
                placeholder="Stock bar"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={stockBar}
                onChangeText={setStockBar}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <TextInput
                style={styles.input}
                placeholder="Stock restaurante"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={stockRestaurant}
                onChangeText={setStockRestaurant}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <TextInput
                style={styles.input}
                placeholder="Stock puerta"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={stockDoor}
                onChangeText={setStockDoor}
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.saveButton, (!name.trim() || !price.trim() || submitting) && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={!name.trim() || !price.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={styles.saveText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.listTitle}>Productos existentes</Text>

        {loading && !products.length ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FAD02C" />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {item.category === 'drink' ? 'Bebida' : item.category === 'food' ? 'Comida' : 'Ticket'}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                  {!item.active && <Text style={styles.inactive}>Inactivo</Text>}
                </View>
              </View>
            )}
          />
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function CategoryChip({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: 'drink' | 'food' | 'ticket';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  restricted: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
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
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#A7A9BE', fontSize: 14 },
  formBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  formTitle: { color: '#FAD02C', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: { backgroundColor: '#FAD02C33', borderColor: '#FAD02C' },
  chipText: { color: '#A7A9BE', fontWeight: '600' },
  chipTextActive: { color: '#FAD02C' },
  errorText: { color: '#FCA5A5', marginTop: 4 },
  saveButton: {
    marginTop: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  listTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  list: { paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.9)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  itemSub: { color: '#9CA3AF', fontSize: 12 },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { color: '#FAD02C', fontWeight: '800', fontSize: 16 },
  inactive: { color: '#FCA5A5', fontSize: 11, marginTop: 2 },
  stockRow: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },
});
