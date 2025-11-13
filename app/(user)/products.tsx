import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { addToCart } from '../../src/store/slices/cartSlice';
import {
  fetchProducts,
  selectAllProducts,
  selectProductsLoading,
} from '../../src/store/slices/productsSlice';

export default function Products() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);
  const loading = useAppSelector(selectProductsLoading);
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const [step, setStep] = useState<'cart' | 'qr'>('cart');
  const router = useRouter();

  // === FILTRO LOCAL ===
  const [filter, setFilter] = useState<'all' | 'drink' | 'food'>('all');

  // === TRAE TODOS LOS PRODUCTOS UNA VEZ ===
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const goBack = () => {
    if (step === 'qr') {
      setStep('cart');
    } else {
      router.back();
    }
  };

  // === FILTRADO EN FRONTEND ===
  const filteredProducts = products
    .filter((p) => p.category !== 'ticket')
    .filter((p) => filter === 'all' || p.category === filter);

  if (loading) {
    return (
      <LinearGradient colors={['#0F0E17', '#1A0B2E']} style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Lista de Productos</Text>
          <Text style={styles.subtitle}>Todo para tu noche</Text>
        </View>

        {/* === FILTROS === */}
        <View style={styles.filterContainer}>
          <FilterButton
            label="Todo"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
            color="#8B5CF6"
          />
          <FilterButton
            label="Bebida"
            icon="wine"
            active={filter === 'drink'}
            onPress={() => setFilter('drink')}
            color="#8B5CF6"
          />
          <FilterButton
            label="Comida"
            icon="fast-food"
            active={filter === 'food'}
            onPress={() => setFilter('food')}
            color="#F59E0B"
          />
          {/* <FilterButton
            label="Entrada"
            icon="ticket"
            active={filter === 'ticket'}
            onPress={() => setFilter('ticket')}
            color="#10B981"
          /> */}
        </View>

        {/* === PRODUCTOS FILTRADOS === */}
        {filteredProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
          </View>
        ) : (
          filteredProducts.map((item, i) => <ProductCard key={item._id} product={item} index={i} />)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB CARRITO */}
      <Link href="/(user)/cart" asChild>
        <TouchableOpacity style={styles.fab}>
          <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.fabGradient}>
            <Ionicons name="cart" size={28} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    </LinearGradient>
  );
}

// === FILTRO BOTÓN ===
function FilterButton({
  label,
  icon,
  active,
  onPress,
  color,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && { backgroundColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={active ? [color, color + 'E6'] : ['transparent', 'transparent']}
        style={styles.filterGradient}
      >
        {icon && <Ionicons name={icon as any} size={18} color={active ? '#fff' : color} />}
        <Text style={[styles.filterText, active && { color: '#fff', fontWeight: '800' }]}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// === TARJETA ===
function ProductCard({ product, index }: { product: any; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const category = {
    drink: { icon: 'wine', color: '#8B5CF6', label: 'Bebida' },
    food: { icon: 'fast-food', color: '#F59E0B', label: 'Comida' },
    ticket: { icon: 'ticket', color: '#10B981', label: 'Entrada' },
  }[product.category] || { icon: 'cube', color: '#6B7280', label: 'Otro' };

  const dispatch = useAppDispatch();

  const handleAdd = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, friction: 5, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    dispatch(addToCart({ product }));
  };

  return (
    <Animated.View
      style={[styles.cardWrapper, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardRow}>
          <View style={styles.imageContainer}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name={category.icon} size={36} color={category.color} />
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <View style={[styles.badge, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon} size={12} color="#fff" />
                <Text style={styles.badgeText}>{category.label}</Text>
              </View>
              {product.category === 'ticket' && (
                <View style={styles.vipTag}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              )}
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.price}>${product.price}</Text>

            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <LinearGradient
                colors={[category.color, category.color + 'D0']}
                style={styles.addGradient}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addText}>Agregar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
// === ESTILOS ===
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8B5CF6', marginTop: 16, fontSize: 18, fontWeight: '600' },
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
  header: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    textAlign: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A7A9BE',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: 16, color: '#A7A9BE', marginTop: 6 },
  cardWrapper: {
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardGradient: { padding: 1.5 },
  cardRow: {
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  // IMAGEN
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#2A2A3E',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
  },

  // INFO
  infoContainer: { flex: 1, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  vipText: { color: '#10B981', fontSize: 10, fontWeight: '700' },

  name: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '900', color: '#8B5CF6', marginBottom: 8 },

  // BOTÓN
  addButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  addText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 22,
    flexDirection: 'column',
    overflow: 'hidden',
  },

  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  noImageText: {
    marginTop: 12,
    color: '#A7A9BE',
    fontSize: 14,
    fontWeight: '600',
  },
  content: { padding: 20 },

  ticketText: { color: '#10B981', fontSize: 12, fontWeight: '700' },

  glow: { height: 6, width: '100%' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 12,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});
