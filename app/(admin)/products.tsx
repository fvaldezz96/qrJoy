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
import { useAppDispatch, useAppSelector } from '../../src/hook';
import {
  createProduct,
  fetchProducts,
  selectAllProducts,
  selectProductCreateError,
  selectProductCreating,
  selectProductsLoading,
} from '../../src/store/slices/productsSlice';
import { fetchSuppliers, selectAllSuppliers } from '../../src/store/slices/suppliersSlice';
import { fetchStock, restockProductThunk, selectStockByProduct } from '../../src/store/slices/stockSlice';

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

  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);
  const loading = useAppSelector(selectProductsLoading);
  const submitting = useAppSelector(selectProductCreating);
  const createError = useAppSelector(selectProductCreateError);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'drink' | 'food' | 'ticket'>('drink');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockBar, setStockBar] = useState('');
  const [stockRestaurant, setStockRestaurant] = useState('');
  const [stockDoor, setStockDoor] = useState('');

  useEffect(() => {
    dispatch(fetchProducts({ force: true }));
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // REPO STOCK STATE
  const [showRestock, setShowRestock] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [restockLocation, setRestockLocation] = useState<'bar' | 'restaurant' | 'door'>('bar');
  const suppliers = useAppSelector(selectAllSuppliers);

  const openRestock = (p: Product) => {
    setTargetProduct(p);
    setRestockQty('');
    setRestockCost('');
    setSelectedSupplier('');
    setRestockLocation('bar');
    setShowRestock(true);
  };

  const handleRestock = async () => {
    if (!targetProduct || !restockQty || !restockCost || !selectedSupplier) {
      return showAlert('Error', 'Completá todos los campos');
    }
    const qty = Number(restockQty);
    const cost = Number(restockCost);
    if (isNaN(qty) || isNaN(cost)) return showAlert('Error', 'Valores numéricos inválidos');

    try {
      await dispatch(restockProductThunk({
        productId: targetProduct._id,
        productName: targetProduct.name,
        supplierId: selectedSupplier,
        quantity: qty,
        cost,
        location: restockLocation,
      })).unwrap();

      showAlert('Éxito', 'Stock recargado y gasto registrado');
      setShowRestock(false);
    } catch (e: any) {
      showAlert('Error', e.message || 'Falló la recarga');
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !price.trim()) return;
    const numericPrice = Number(price.replace(',', '.'));
    if (Number.isNaN(numericPrice)) return;

    const initialStock = {
      bar: stockBar.trim() ? Number(stockBar) || 0 : 0,
      restaurant: stockRestaurant.trim() ? Number(stockRestaurant) || 0 : 0,
      door: stockDoor.trim() ? Number(stockDoor) || 0 : 0,
    };

    const result = await dispatch(createProduct({
      name: name.trim(),
      category,
      price: numericPrice,
      active: true,
      sku: sku.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      // @ts-ignore - API expects initialStock
      initialStock,
    }));

    if (createProduct.fulfilled.match(result)) {
      setName('');
      setPrice('');
      setSku('');
      setImageUrl('');
      setStockBar('');
      setStockRestaurant('');
      setStockDoor('');
      setShowForm(false);
      showAlert('Éxito', 'Producto creado correctamente');
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Productos</Text>
            <Text style={styles.subtitle}>Gestioná la carta y precios</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, showForm && styles.toggleBtnActive]}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showForm && (
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

            {createError && <Text style={styles.errorText}>{createError}</Text>}

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
        )}

        <Text style={styles.listTitle}>
          {loading ? 'Cargando productos...' : `Productos existentes (${products.length})`}
        </Text>

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
                  <TouchableOpacity onPress={() => openRestock(item)} style={styles.smallBtn}>
                    <Ionicons name="cube" size={14} color="#fff" />
                    <Text style={styles.smallBtnText}>Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </LinearGradient>

      {/* RESTOCK MODAL */}
      {
        showRestock && targetProduct && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reponer Stock: {targetProduct.name}</Text>

              <Text style={styles.label}>Proveedor</Text>
              <View style={styles.chipRow}>
                {suppliers.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.chip, selectedSupplier === s._id && styles.chipActive]}
                    onPress={() => setSelectedSupplier(s._id)}
                  >
                    <Text style={[styles.chipText, selectedSupplier === s._id && styles.chipTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Ubicación</Text>
              <View style={styles.chipRow}>
                {(['bar', 'restaurant', 'door'] as const).map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.chip, restockLocation === l && styles.chipActive]}
                    onPress={() => setRestockLocation(l)}
                  >
                    <Text style={[styles.chipText, restockLocation === l && styles.chipTextActive]}>
                      {l.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Cantidad a agregar"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                value={restockQty}
                onChangeText={setRestockQty}
              />
              <TextInput
                style={styles.input}
                placeholder="Costo Total ($)"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={restockCost}
                onChangeText={setRestockCost}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRestock(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleRestock}>
                  <Text style={styles.confirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )
      }
    </KeyboardAvoidingView >
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
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#ff3366',
  },
  // New Styles
  smallBtn: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    gap: 4
  },
  smallBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
    zIndex: 999
  },
  modalContent: {
    backgroundColor: '#1F2937', width: '100%', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#374151'
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { color: '#9CA3AF', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#9CA3AF' },
  confirmBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  confirmText: { color: '#fff', fontWeight: 'bold' }
});
