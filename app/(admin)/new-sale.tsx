import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { fetchProducts, selectAllProducts } from '../../src/store/slices/productsSlice';
import { fetchTables, selectActiveTables } from '../../src/store/slices/tablesSlice';
import { createOrder } from '../../src/store/slices/ordersSlice';
import { showAlert } from '../../src/utils/showAlert';

interface CartItem {
  product: any;
  quantity: number;
  price: number;
}

export default function NewSaleScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const products = useAppSelector(selectAllProducts);
  const productsLoading = useAppSelector((s) => s.products.loading);
  const activeTables = useAppSelector(selectActiveTables);
  const { user } = useAppSelector((s) => s.auth);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [cashRegisterId, setCashRegisterId] = useState('CAJA-001'); // Valor por defecto
  const [employeeId, setEmployeeId] = useState(user?._id || 'EMP-001');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'products' | 'checkout'>('products');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchTables());
  }, [dispatch]);

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, price: product.price }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.product._id !== productId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const createSale = async (printTicket: boolean = false) => {
    if (cartItems.length === 0) {
      showAlert('Error', 'El carrito está vacío');
      return;
    }

    try {
      // 1. Crear la orden
      const actionResult = await dispatch(createOrder({
        tableId: selectedTableId || undefined,
        type: 'bar',
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
      }));

      const orderId = actionResult.payload as string;

      if (!orderId) throw new Error('No se pudo obtener el ID de la orden');

      // 2. Si es venta rápida (Efectivo & Ticket)
      if (printTicket) {
        // Importar dínámicamente para evitar ciclos
        const { payCashOrder, closeOrder } = await import('../../src/store/slices/ordersSlice');

        // Pagar
        await dispatch(payCashOrder(orderId)).unwrap();

        // Emitir Ticket
        await dispatch(closeOrder(orderId)).unwrap();

        Alert.alert('Éxito', 'Venta cobrada y ticket emitido correctamente 🖨️');
      } else {
        showAlert('Éxito', 'Orden creada correctamente');
      }

      setCartItems([]);
      setSelectedTableId(null);
      setStep('products');

    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo procesar la venta');
    }
  };

  if (productsLoading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#FAD02C" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </LinearGradient>
    );
  }

  if (step === 'checkout') {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('products')}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Resumen de Venta</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Info de caja */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Información de Caja</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Caja:</Text>
              <TextInput
                style={styles.infoInput}
                value={cashRegisterId}
                onChangeText={setCashRegisterId}
                placeholder="ID de caja"
              />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empleado:</Text>
              <TextInput
                style={styles.infoInput}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="ID de empleado"
              />
            </View>
          </View>

          {/* Selector de mesa */}
          <View style={styles.tableSelectorCard}>
            <Text style={styles.tableSelectorLabel}>Mesa (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.tableChip,
                  !selectedTableId && styles.tableChipSelected,
                ]}
                onPress={() => setSelectedTableId(null)}
              >
                <Text style={[
                  styles.tableChipText,
                  !selectedTableId && styles.tableChipTextSelected,
                ]}>
                  Sin mesa
                </Text>
              </TouchableOpacity>
              {activeTables.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  style={[
                    styles.tableChip,
                    selectedTableId === t._id && styles.tableChipSelected,
                  ]}
                  onPress={() => setSelectedTableId(t._id)}
                >
                  <Text
                    style={[
                      styles.tableChipText,
                      selectedTableId === t._id && styles.tableChipTextSelected,
                    ]}
                  >
                    Mesa {t.number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Items del carrito */}
          <Text style={styles.sectionTitle}>Productos</Text>
          {cartItems.map((item, index) => (
            <View key={item.product._id} style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product._id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${getTotal().toLocaleString()}</Text>
          </View>

          {/* Botón de crear venta (Solo crear) */}
          <TouchableOpacity style={styles.createButton} onPress={() => createSale(false)}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.createButtonGradient}>
              <Ionicons name="cart" size={22} color="#fff" />
              <Text style={styles.createButtonText}>Crear Pedido</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón de venta rápida (Efectivo y Ticket) */}
          <TouchableOpacity style={[styles.createButton, { marginTop: 12 }]} onPress={() => createSale(true)}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.createButtonGradient}>
              <Ionicons name="cash" size={22} color="#fff" />
              <Text style={styles.createButtonText}>Cobrar Efectivo & Ticket</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Nueva Venta</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity style={styles.cartButton} onPress={() => setStep('checkout')}>
              <Ionicons name="cart" size={24} color="#fff" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A7A9BE" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor="#A7A9BE"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Products */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => addToCart(item)}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.productGradient}
              >
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                </View>
                <View style={styles.priceStockRow}>
                  <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
                  {item.stock !== undefined && (
                    <Text style={[styles.productStock, item.stock < 5 && styles.lowStock]}>
                      Stock: {item.stock}
                    </Text>
                  )}
                </View>
                <View style={styles.addButton}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Agregar</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={60} color="#555" />
              <Text style={styles.emptyText}>No se encontraron productos</Text>
            </View>
          }
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FAD02C', marginTop: 16, fontSize: 18, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#FAD02C', letterSpacing: 0.5 },
  cartButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },

  // Products
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  productGradient: {
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  productHeader: { flex: 1 },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCategory: {
    color: '#A7A9BE',
    fontSize: 12,
    marginBottom: 8,
  },
  productPrice: {
    color: '#00FF88',
    fontSize: 20,
    fontWeight: '900',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  productStock: {
    color: '#A7A9BE',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStock: {
    color: '#E53170',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  addButtonText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, color: '#888', marginTop: 16 },

  // Checkout
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoTitle: {
    color: '#FAD02C',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#A7A9BE',
    fontSize: 16,
    width: 80,
  },
  infoInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Table selector
  tableSelectorCard: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
    marginBottom: 20,
  },
  tableSelectorLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tableChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    marginRight: 8,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  tableChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A855F7',
  },
  tableChipText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  tableChipTextSelected: {
    color: '#FFFFFF',
  },

  // Cart items
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  cartItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  itemInfo: { flex: 1 },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  // Total
  totalCard: {
    backgroundColor: 'rgba(0,255,136,0.2)',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#00FF88',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  totalPrice: {
    color: '#00FF88',
    fontSize: 28,
    fontWeight: '900',
  },

  // Create button
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
  },
});
