import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { addToCart } from '../../src/store/slices/cartSlice';
import { fetchProducts } from '../../src/store/slices/productsSlice';

export default function Products() {
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={list}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 12, gap: 6 }}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: '100%', height: 120, borderRadius: 8 }}
              />
            ) : null}
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text>${item.price}</Text>
            <Button title="Agregar" onPress={() => dispatch(addToCart({ product: item }))} />
          </View>
        )}
      />
      <Link href="/(user)/cart">Ir al carrito →</Link>
    </View>
  );
}
