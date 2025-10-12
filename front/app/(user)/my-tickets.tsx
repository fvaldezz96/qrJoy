import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { createTicket, fetchMyTickets, payMockTicket } from '../../src/store/slices/ticketsSlice';

export default function MyTickets() {
  const nav = useRouter();
  const dispatch = useAppDispatch();
  const { list, current, payQR, loading } = useAppSelector((s) => s.tickets);

  useEffect(() => {
    dispatch(fetchMyTickets());
  }, [dispatch]);

  const buySample = async () => {
    // Demo: crea un ticket para hoy + 12k
    const today = new Date();
    const iso = today.toISOString();
    const t = await dispatch(createTicket({ eventDate: iso, price: 12000 })).unwrap();
    const qrRes = await dispatch(payMockTicket(t._id)).unwrap();
    nav.push({
      pathname: '/(user)/qr',
      params: { png: qrRes.pngDataUrl, code: qrRes.code, signature: qrRes.signature },
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title={loading ? 'Procesando…' : 'Comprar ticket (demo)'} onPress={buySample} />
      <FlatList
        data={list}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginVertical: 8 }}>
            <Text>Fecha: {new Date(item.eventDate).toLocaleString()}</Text>
            <Text>Precio: ${item.price}</Text>
            <Text>Estado: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
