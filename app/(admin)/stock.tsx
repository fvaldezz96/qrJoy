import { useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

import api from '../../src/api/client';

export default function Stock() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/stock');
    setItems(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const adjust = async (productId: string, delta: number) => {
    await api.patch(`/stock/${productId}`, { quantity: delta });
    load();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Actualizar" onPress={load} />
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginVertical: 8 }}>
            <Text>
              {item.productId?.name} — Qty: {item.quantity}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="+1" onPress={() => adjust(item.productId?._id, 1)} />
              <Button title="-1" onPress={() => adjust(item.productId?._id, -1)} />
            </View>
          </View>
        )}
      />
      {loading ? <Text>Cargando…</Text> : null}
    </View>
  );
}
