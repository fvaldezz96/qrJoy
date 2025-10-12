import { useEffect } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { fetchComandas } from '../../src/store/slices/adminSlice';

export default function OrdersScreen() {
  const dispatch = useAppDispatch();
  const { comandas, loading } = useAppSelector((s) => s.admin);

  useEffect(() => {
    dispatch(fetchComandas('bar'));
  }, [dispatch]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Actualizar" onPress={() => dispatch(fetchComandas('bar'))} />
      <FlatList
        data={comandas}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginVertical: 8 }}>
            <Text>Orden: {item.orderId}</Text>
            <Text>Estado: {item.status}</Text>
            <Text>Items: {item.items?.map((x: any) => `${x.qty}x`).join(', ')}</Text>
          </View>
        )}
      />
      {loading ? <Text>Cargando…</Text> : null}
    </View>
  );
}
