import { useState } from 'react';
import { Alert, Button, FlatList, Image, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { clearCart } from '../../src/store/slices/cartSlice';
import { createOrder, payMockOrder } from '../../src/store/slices/ordersSlice';

export default function Cart() {
  const { items } = useAppSelector((s) => s.cart);
  const { currentOrderId, qr, loading } = useAppSelector((s) => s.orders);
  const dispatch = useAppDispatch();
  const total = items.reduce((a, b) => a + b.product.price * b.qty, 0);
  const [step, setStep] = useState<'cart' | 'qr'>('cart');

  const handlePay = async () => {
    if (!items.length) return Alert.alert('Carrito vacío');
    const res = await dispatch(createOrder()).unwrap();
    await dispatch(payMockOrder(res));
    setStep('qr');
    dispatch(clearCart());
  };

  if (step === 'qr' && qr) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}
      >
        <Text>Mostrá este QR en la barra</Text>
        <Image source={{ uri: qr.pngDataUrl }} style={{ width: 240, height: 240 }} />
        <Text style={{ fontSize: 12, opacity: 0.7 }}>code: {qr.code}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.product._id}
        ListEmptyComponent={<Text>Tu carrito está vacío</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 12 }}>
            <Text>
              {item.product.name} x {item.qty}
            </Text>
            <Text>${item.product.price * item.qty}</Text>
          </View>
        )}
      />
      <Text style={{ fontWeight: '700', marginVertical: 8 }}>Total: ${total}</Text>
      <Button
        title={loading ? 'Procesando...' : 'Pagar (Mock)'}
        onPress={handlePay}
        disabled={loading || !items.length}
      />
    </View>
  );
}
